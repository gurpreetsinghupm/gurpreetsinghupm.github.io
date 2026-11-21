# Gurpreet Singh — A Research Journal

A personal academic website designed as a book you read from cover to cover.

- **Wide screens:** two facing pages with 3D page turns.
- **Phones and narrow windows:** one page at a time, swipe to turn.
- Keyboard: `→` / `←` (also Space, Page Up/Down, Home, End). Click a page to turn it.
- Every page has its own link, e.g. `…/#ch6` opens the Publications chapter.
- Plain HTML, CSS and JavaScript — no build step, no dependencies.

## Put it online with GitHub Pages

1. Create a new **public** repository on GitHub.
   - For the address `https://<your-username>.github.io/`, name the repository exactly `<your-username>.github.io`.
   - Any other name gives `https://<your-username>.github.io/<repository-name>/`.
2. Upload the **contents** of this folder (not the folder itself): `index.html`, `404.html`, `.nojekyll`, `README.md` and the `assets/` folder.
   - On github.com: *Add file → Upload files*, drag everything in, then *Commit changes*.
   - Or from Terminal, inside this folder:
     ```
     git init
     git add .
     git commit -m "Research journal website"
     git branch -M main
     git remote add origin https://github.com/<your-username>/<repository-name>.git
     git push -u origin main
     ```
3. In the repository: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)` → Save**.
4. After a minute the site is live at the address shown on that page.

## Editing

- All text is in `index.html`. Each `<section class="page">` is one page; pages alternate right-hand (even) and left-hand (odd).
- Keep the total number of pages **even** so the back cover lands on the left.
- Photos are in `assets/img/` (metadata already stripped). The CV download is `assets/docs/Gurpreet_Singh_CV.pdf`.
- When you change `book.css` or `book.js`, bump the `?v=` number on their links in `index.html` so returning visitors don't keep an old cached copy.
- After editing, open `index.html?check` in a browser: the tab title says `CHECK OK` or lists any page whose text no longer fits.

Text current as of November 2026.
