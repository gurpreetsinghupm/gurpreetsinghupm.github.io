/* Gurpreet Singh — A Research Journal
   Turns a list of <section class="page"> into a book.
   - spread mode (wide screens): two facing pages, 3D page turns
   - single mode (phones / narrow windows): one page at a time
   No dependencies. */
(function () {
  'use strict';

  var root = document.documentElement;
  var book = document.getElementById('book');
  var stage = document.getElementById('stage');
  var counter = document.getElementById('counter');
  var progress = document.getElementById('progress');
  var prevBtn = document.getElementById('prev');
  var nextBtn = document.getElementById('next');
  var hint = document.getElementById('hint');

  var pages = Array.prototype.slice.call(book.querySelectorAll(':scope > section.page'));
  var N = pages.length;
  var PW = 480, PH = 680;
  var TURN = 900;
  var mode = null;     // 'spread' | 'single'
  var leaves = [];
  var flipped = 0;     // spread: number of turned leaves (0..L)
  var cur = 0;         // single: current page index
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- page furniture: side, running heads, folios, contents ---------- */
  var idIndex = {};
  pages.forEach(function (p, i) {
    p.dataset.index = i;
    if (p.id) idIndex[p.id] = i;
    var recto = i % 2 === 0;               // even index = right-hand page
    p.classList.add(recto ? 'recto' : 'verso');
    if (p.classList.contains('bare')) return;
    var rh = p.querySelector('.rh');
    var fo = p.querySelector('.folio');
    if (rh) rh.textContent = recto ? (p.dataset.chapter || 'A Research Journal') : 'Gurpreet Singh';
    if (fo) fo.textContent = String(i);
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-goto]'), function (a) {
    var i = idIndex[a.dataset.goto];
    var pn = a.querySelector('.pn');
    if (pn && i != null) pn.textContent = String(i);
    a.setAttribute('href', '#' + a.dataset.goto);
    a.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); go(i); });
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-goto-index]'), function (b) {
    b.addEventListener('click', function (e) { e.stopPropagation(); go(parseInt(b.dataset.gotoIndex, 10) || 0); });
  });

  /* ---------- building the two layouts ---------- */
  function buildSpread() {
    book.innerHTML = '';
    leaves = [];
    for (var k = 0; k < Math.ceil(N / 2); k++) {
      var leaf = document.createElement('div');
      leaf.className = 'leaf';
      var front = document.createElement('div'); front.className = 'face front';
      var back = document.createElement('div'); back.className = 'face back';
      front.appendChild(pages[2 * k]);
      if (pages[2 * k + 1]) back.appendChild(pages[2 * k + 1]);
      leaf.appendChild(front); leaf.appendChild(back);
      book.appendChild(leaf);
      leaves.push(leaf);
    }
  }
  function buildSingle() {
    book.innerHTML = '';
    leaves = [];
    pages.forEach(function (p) { book.appendChild(p); });
  }

  /* ---------- state helpers ---------- */
  function currentPage() {
    if (mode === 'spread') return flipped === 0 ? 0 : Math.min(2 * flipped - 1, N - 1);
    return cur;
  }

  function renderSpread(target, animate) {
    var L = leaves.length;
    var changed = [];
    leaves.forEach(function (leaf, k) {
      var should = k < target;
      if (leaf.classList.contains('flipped') !== should) changed.push(k);
    });
    // turning leaves go on top for the duration of the turn
    var forward = target > flipped;
    changed.forEach(function (k, idx) {
      var leaf = leaves[k];
      var order = forward ? idx : changed.length - idx;
      leaf.style.zIndex = String(200 + order);
      leaf.style.transitionDelay = animate ? (idx * 70) + 'ms' : '0ms';
      if (animate) {
        leaf.classList.add('turning');
        setTimeout(function () { leaf.classList.remove('turning'); }, TURN + idx * 70 + 50);
      }
    });
    leaves.forEach(function (leaf, k) {
      leaf.classList.toggle('flipped', k < target);
      if (changed.indexOf(k) === -1) leaf.style.zIndex = String(k < target ? k + 1 : L - k);
    });
    var settle = function () {
      leaves.forEach(function (leaf, k) {
        leaf.style.zIndex = String(k < target ? k + 1 : L - k);
        leaf.style.transitionDelay = '0ms';
      });
    };
    if (animate && changed.length) setTimeout(settle, TURN + changed.length * 70 + 30); else settle();
    flipped = target;
    book.classList.toggle('closed-front', target === 0);
    book.classList.toggle('closed-back', target === L);
    updateUi();
  }

  function renderSingle(i) {
    cur = Math.max(0, Math.min(N - 1, i));
    pages.forEach(function (p, k) {
      p.classList.toggle('active', k === cur);
      p.classList.toggle('before', k < cur);
      p.classList.toggle('after', k > cur);
      p.setAttribute('aria-hidden', k === cur ? 'false' : 'true');
    });
    updateUi();
  }

  function setInert(visible) {
    pages.forEach(function (p, k) {
      var on = visible.indexOf(k) !== -1;
      if ('inert' in p) p.inert = !on;
      p.setAttribute('aria-hidden', on ? 'false' : 'true');
    });
  }

  function updateUi() {
    var p = currentPage();
    var label, visible;
    if (mode === 'spread') {
      var L = leaves.length;
      if (flipped === 0) { label = 'Cover'; visible = [0]; }
      else if (flipped === L) { label = 'Back cover'; visible = [N - 1]; }
      else {
        var l = 2 * flipped - 1, r = 2 * flipped;
        label = 'pp. ' + l + ' – ' + r;
        visible = [l, r];
      }
      if (prevBtn) prevBtn.disabled = flipped === 0;
      if (nextBtn) nextBtn.disabled = flipped === L;
      setInert(visible);
    } else {
      label = cur === 0 ? 'Cover' : (cur === N - 1 ? 'Back cover' : 'p. ' + cur + ' of ' + (N - 2));
      if (prevBtn) prevBtn.disabled = cur === 0;
      if (nextBtn) nextBtn.disabled = cur === N - 1;
      setInert([cur]);
    }
    if (counter) counter.textContent = label;
    progress.style.width = (100 * p / (N - 1)) + '%';
    var id = pages[p] && pages[p].id ? pages[p].id : 'page-' + p;
    if (history.replaceState) history.replaceState(null, '', p === 0 ? location.pathname + location.search : '#' + id);
  }

  /* ---------- navigation ---------- */
  function go(i, animate) {
    if (i == null || isNaN(i)) return;
    i = Math.max(0, Math.min(N - 1, i));
    var anim = animate !== false && !reduce;
    if (mode === 'spread') renderSpread(Math.ceil(i / 2), anim);
    else renderSingle(i);
    dismissHint();
  }
  function next() {
    if (mode === 'spread') { if (flipped < leaves.length) renderSpread(flipped + 1, !reduce); }
    else renderSingle(cur + 1);
    dismissHint();
  }
  function prev() {
    if (mode === 'spread') { if (flipped > 0) renderSpread(flipped - 1, !reduce); }
    else renderSingle(cur - 1);
    dismissHint();
  }

  if (prevBtn) prevBtn.addEventListener('click', prev);
  if (nextBtn) nextBtn.addEventListener('click', next);
  var toContents = document.getElementById('toContents');
  if (toContents) toContents.addEventListener('click', function () { go(idIndex.contents); });

  document.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var t = e.target && e.target.tagName;
    if (t === 'INPUT' || t === 'TEXTAREA') return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) { e.preventDefault(); prev(); }
    else if (e.key === 'Home') { e.preventDefault(); go(0); }
    else if (e.key === 'End') { e.preventDefault(); go(N - 1); }
  });

  // click a page to turn it (ignores links, buttons and text selection)
  book.addEventListener('click', function (e) {
    if (e.target.closest('a,button,[data-goto]')) return;
    var sel = window.getSelection && String(window.getSelection());
    if (sel && sel.length > 2) return;
    if (mode === 'spread') {
      var face = e.target.closest('.face');
      if (!face) return;
      if (face.classList.contains('front')) next(); else prev();
    } else {
      var rect = book.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width;
      if (x > 0.6) next(); else if (x < 0.25) prev();
    }
  });

  // swipe
  var sx = null, sy = null;
  document.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) return;
    sx = e.touches[0].clientX; sy = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (sx == null) return;
    var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    sx = sy = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) { if (dx < 0) next(); else prev(); }
  }, { passive: true });

  /* ---------- layout & scaling ---------- */
  function fit() {
    var vw = window.innerWidth, vh = window.innerHeight;
    var want = (vw >= 980 && vh >= 540 && vw / vh > 1.2) ? 'spread' : 'single';
    if (want !== mode) {
      var p = mode ? currentPage() : startPage();
      mode = want;
      root.dataset.mode = mode;
      root.classList.add('no-anim');
      if (mode === 'spread') { buildSpread(); flipped = -1; renderSpread(Math.ceil(p / 2), false); }
      else { buildSingle(); renderSingle(p); }
      requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.remove('no-anim'); }); });
    }
    var bw = mode === 'spread' ? 2 * PW : PW;
    var padX = mode === 'spread' ? 80 : 16;
    var padY = mode === 'spread' ? 44 : 24;
    var s = Math.min((vw - padX) / bw, (vh - padY) / PH, mode === 'spread' ? 1.4 : 1.7);
    stage.style.setProperty('--s', String(Math.max(0.3, s)));
  }

  function startPage() {
    var h = decodeURIComponent((location.hash || '').slice(1));
    if (!h) return 0;
    var m = /^page-(\d+)$/.exec(h);
    if (m) return Math.min(N - 1, parseInt(m[1], 10));
    return idIndex[h] != null ? idIndex[h] : 0;
  }

  window.addEventListener('resize', fit);
  window.addEventListener('hashchange', function () { go(startPage()); });

  /* ---------- first-visit hint ---------- */
  var hintTimer = null;
  function dismissHint() { if (hint && !hint.classList.contains('gone')) hint.classList.add('gone'); clearTimeout(hintTimer); }
  hintTimer = setTimeout(dismissHint, 6500);

  fit();

  /* ---------- debug: freeze a page mid-turn (?turn=70) ---------- */
  var tm = /[?&]turn=(\d+)/.exec(location.search);
  if (tm && mode === 'spread' && leaves[flipped]) {
    var lf = leaves[flipped]; lf.style.transition = 'none'; lf.style.zIndex = '300';
    lf.style.transform = 'rotateY(-' + tm[1] + 'deg)';
  }

  /* ---------- self-check (open with ?check to list pages whose text overflows) ---------- */
  if (/[?&]check\b/.test(location.search)) {
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () {
      setTimeout(function () {
        var bad = [];
        pages.forEach(function (p, i) {
          var b = p.querySelector('.body');
          if (b && b.scrollHeight > b.clientHeight + 1) bad.push(i + ':' + (p.id || '') + '(+' + (b.scrollHeight - b.clientHeight) + 'px)');
        });
        document.title = 'CHECK ' + (bad.length ? 'OVERFLOW ' + bad.join(' ') : 'OK') + ' N=' + N + ' vw=' + window.innerWidth + ' mode=' + mode + ' s=' + stage.style.getPropertyValue('--s');
      }, 400);
    });
  }
})();
