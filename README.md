# danifuertes.github.io

Source of my personal academic website: **https://danifuertes.github.io**

It is a plain static site (HTML, CSS and JavaScript) with no build step. The page loads its content from YAML files in the browser, so GitHub Pages serves the repo as-is and any local static server shows exactly the same result.

## Folders

```
index.html          English page: metadata for search engines and link previews, sidebar, empty sections
es/index.html       Spanish page: same structure as index.html, with Spanish metadata and labels
404.html            "Page not found" page served by GitHub Pages
.nojekyll           Tells GitHub Pages to serve files as they are, without running Jekyll
data/               Page content (YAML). Edit these files to update the site
assets/
  css/main.css      All styles; colours and fonts for light and dark themes are at the top
  js/render.js      Reads data/*.yml and builds every section of the page
  js/main.js        Interactions: theme toggle, publication filter, BibTeX copy, active nav link
  js/route-graph.js Animated multi-agent routing banner in the sidebar
  js/vendor/        Third-party libraries (js-yaml, the YAML parser)
  img/              Profile photo, favicon, and paper thumbnails in img/papers/
  icons/            Logos for the contact links and the skills
```

## Editing content

| File | What it controls |
| --- | --- |
| [`data/profile.yml`](data/profile.yml) | Name, position, photo, bio, interests, contact links, CV |
| [`data/research.yml`](data/research.yml) | Research lines |
| [`data/publications.yml`](data/publications.yml) | Papers and theses, with links and BibTeX |
| [`data/experience.yml`](data/experience.yml) | Positions and education |
| [`data/teaching.yml`](data/teaching.yml) | Courses (section hidden while empty) |
| [`data/awards.yml`](data/awards.yml) | Awards |
| [`data/skills.yml`](data/skills.yml) | Skills grouped by category, each with a logo from `assets/icons/` |
| [`data/ui.yml`](data/ui.yml) | Interface text: section titles, buttons, labels |

A section whose file is empty is hidden automatically, along with its link in the navigation bar. To reorder sections, move the `<section>` lines in both `index.html` and `es/index.html`.

### English and Spanish

Both pages read the same data files. Text that changes between languages is written as a pair; anything else (names, paper titles, technical terms) is written once and shown in both:

```yaml
title: {en: Autonomous navigation, es: Navegación autónoma}   # translated
org: Idiap Research Institute                                 # same in both pages
```

If the `es` value is missing, the English one is shown. The page language comes from `<html lang>`; the `EN`/`ES` button links the two pages.

### Adding a publication

1. Add an entry at the top of `data/publications.yml` (the fields are documented in the file header).
2. Add a thumbnail at `assets/img/papers/<id>.webp`, about 360 px on the longest side, e.g.
   ```bash
   convert figure.png -resize 360x360 -quality 80 assets/img/papers/<id>.webp
   ```

## Local preview

Open this folder (the repository root) with VS Code **Live Server**, or run from it:

```bash
python3 -m http.server 8000   # http://localhost:8000
```

The English page is at `/` and the Spanish one at `/es/`. Paths are relative to the site root, so the server must serve this folder at `/`. Opening `index.html` directly from disk (`file://`) does not work, because browsers block loading the YAML files that way.
