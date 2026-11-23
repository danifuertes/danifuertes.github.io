# danifuertes.github.io

Source of my personal academic website: **https://danifuertes.github.io**

It is a plain static site (HTML, CSS and JavaScript) with no build step. The page loads its content from YAML files in the browser, so GitHub Pages serves the repo as-is and any local static server shows exactly the same result.

## Folders

```
index.html          Page shell: metadata for search engines and link previews, sidebar, empty sections
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
  icons/            Brand icons for the contact links (Scholar, ORCID, GitHub, LinkedIn)
```

## Editing content

| File | What it controls |
| --- | --- |
| [`data/profile.yml`](data/profile.yml) | Name, position, photo, bio, interests, contact links, CV |
| [`data/news.yml`](data/news.yml) | Dated updates (newest first; the first 6 are shown) |
| [`data/research.yml`](data/research.yml) | Research lines and their related papers |
| [`data/publications.yml`](data/publications.yml) | Papers and theses, with links and BibTeX |
| [`data/experience.yml`](data/experience.yml) | Positions and education |
| [`data/teaching.yml`](data/teaching.yml) | Courses (section hidden while empty) |
| [`data/awards.yml`](data/awards.yml) | Awards |
| [`data/skills.yml`](data/skills.yml) | Skills grouped by category |

A section whose file is empty is hidden automatically, along with its link in the navigation bar. To reorder sections, move the `<section>` lines in `index.html`.

### Adding a publication

1. Add an entry at the top of `data/publications.yml` (the fields are documented in the file header).
2. Add a thumbnail at `assets/img/papers/<id>.webp`, about 360 px on the longest side, e.g.
   ```bash
   convert figure.png -resize 360x360 -quality 80 assets/img/papers/<id>.webp
   ```
3. Optionally reference the `id` from a research line in `data/research.yml` and add a line to `data/news.yml`.

## Local preview

Open the folder with VS Code **Live Server**, or run:

```bash
python3 -m http.server 8000   # http://localhost:8000
```

Opening `index.html` directly from disk (`file://`) does not work, because browsers block loading the YAML files that way.
