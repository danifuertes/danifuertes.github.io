/* Builds the page from the YAML files in data/.
   Each section in index.html is filled by the renderer with the same id; a section
   whose data is empty stays hidden and is left out of the navigation. */
(function () {
  "use strict";

  const DATA_FILES = ["profile", "research", "publications", "experience", "teaching", "awards", "skills"];

  /* Helpers -------------------------------------------------------------- */

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  // Minimal Markdown: [links](url), **bold** and *italic*.
  const inline = (md) => esc(md)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");

  const paragraphs = (md) => md.trim().split(/\n\s*\n/)
    .map((p) => `<p>${inline(p.replace(/\s*\n\s*/g, " "))}</p>`).join("");

  const extLink = (url, text) => url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${text}</a>` : text;

  // Line icons (Lucide, ISC licence).
  const ICONS = {
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/>',
    paper: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>',
    arxiv: '<rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>',
    code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    thesis: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    quote: '<path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    award: '<circle cx="12" cy="8" r="6"/><path d="M15.48 12.89 17 22l-5-3-5 3 1.52-9.11"/>',
  };
  const icon = (name) => `<svg class="icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

  const tags = (items, extraClass = "") =>
    `<ul class="tag-list ${extraClass}">${items.map((t) => `<li class="tag">${esc(t)}</li>`).join("")}</ul>`;

  /* Sidebar -------------------------------------------------------------- */

  function renderProfile(p) {
    const links = p.links.map((l) => `
      <li><a href="${esc(l.url)}" target="_blank" rel="noopener" title="${esc(l.label)}" aria-label="${esc(l.label)}">
        <img src="assets/icons/${esc(l.icon)}" alt="" width="20" height="20" class="logo">
      </a></li>`).join("");

    return `
      <img class="profile-card__photo" src="${esc(p.photo)}" alt="Portrait of ${esc(p.name)}" width="132" height="132">
      <div class="profile-card__body">
        <h1 class="profile-card__name">${esc(p.name)}</h1>
        <p class="profile-card__role">${esc(p.position)}</p>
        <p class="profile-card__affiliation">${extLink(p.affiliation_url, esc(p.affiliation))}</p>
        ${tags(p.interests, "tag-list--center")}
        <ul class="social-links">
          <li><a href="mailto:${esc(p.email)}" title="${esc(p.email)}" aria-label="Email">${icon("mail")}</a></li>
          ${links}
        </ul>
        <a class="profile-card__email" href="mailto:${esc(p.email)}">${esc(p.email)}</a>
        ${p.cv ? `<a class="button button--primary button--block" href="${esc(p.cv)}" target="_blank" rel="noopener">${icon("download")} Download CV</a>` : ""}
      </div>`;
  }

  /* Sections (each returns its inner HTML, or "" to hide the section) ---- */

  const renderAbout = (p) => `<div class="prose">${paragraphs(p.bio)}</div>`;

  const renderResearch = (lines) => !lines.length ? "" : `
    <div class="research-grid">${lines.map((r) => `
      <article class="research-card">
        <h3 class="research-card__title">${esc(r.title)}</h3>
        <p class="research-card__text">${esc(r.description)}</p>
      </article>`).join("")}
    </div>`;

  function renderPublication(pub, selfName) {
    const link = pub.doi ? `https://doi.org/${pub.doi}` : pub.url;
    const authors = pub.authors.map((a) => a === selfName ? `<strong>${esc(a)}</strong>` : esc(a)).join(", ");
    const button = (url, ico, label) => `<a class="button button--small" href="${esc(url)}" target="_blank" rel="noopener">${icon(ico)} ${label}</a>`;

    return `
      <article class="pub" id="pub-${esc(pub.id)}" data-pub-type="${esc(pub.type)}">
        <a class="pub__thumb" href="${esc(link)}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true">
          <img src="assets/img/papers/${esc(pub.id)}.webp" alt="" loading="lazy" width="120" height="120">
        </a>
        <div class="pub__body">
          <span class="badge badge--${esc(pub.type)}">${esc(pub.short)}</span>
          <h4 class="pub__title">${extLink(link, esc(pub.title))}</h4>
          <p class="pub__authors">${authors}</p>
          <p class="pub__venue">${esc(pub.venue)}</p>
          <div class="pub__actions">
            ${pub.type === "thesis" ? button(link, "thesis", "Thesis") : button(link, "paper", "Paper")}
            ${pub.arxiv ? button(`https://arxiv.org/abs/${pub.arxiv}`, "arxiv", "arXiv") : ""}
            ${pub.code ? button(pub.code, "code", "Code") : ""}
            ${pub.bibtex ? `<button class="button button--small" type="button" aria-expanded="false" aria-controls="bib-${esc(pub.id)}" data-bibtex-toggle>${icon("quote")} BibTeX</button>` : ""}
          </div>
          ${pub.bibtex ? `
          <div class="bibtex" id="bib-${esc(pub.id)}" hidden>
            <button class="bibtex__copy" type="button" data-bibtex-copy aria-label="Copy BibTeX">
              <span data-copy-idle>${icon("copy")} Copy</span>
              <span data-copy-done hidden>${icon("check")} Copied</span>
            </button>
            <pre><code>${esc(pub.bibtex.trim())}</code></pre>
          </div>` : ""}
        </div>
      </article>`;
  }

  function renderPublications(pubs, selfName) {
    if (!pubs.length) return "";
    const years = [...new Set(pubs.map((p) => p.year))].sort((a, b) => b - a);
    return years.map((year) => `
      <div class="pub-year" data-pub-year>
        <h3 class="pub-year__label">${esc(year)}</h3>
        ${pubs.filter((p) => p.year === year).map((p) => renderPublication(p, selfName)).join("")}
      </div>`).join("");
  }

  const publicationsHeader = () => `
    <div class="section-header">
      <h2 class="section-title">Publications</h2>
      <div class="filter" role="group" aria-label="Filter publications by type">
        ${["all", "journal", "conference", "thesis"].map((t, i) =>
          `<button type="button" class="filter__btn${i === 0 ? " is-active" : ""}" data-filter="${t}" aria-pressed="${i === 0}">${t[0].toUpperCase() + t.slice(1)}</button>`).join("")}
      </div>
    </div>`;

  function renderExperience(items) {
    const timeline = (heading, list) => !list.length ? "" : `
      <div>
        <h3 class="subsection-title">${heading}</h3>
        <ol class="timeline">${list.map((e) => `
          <li class="timeline__item">
            ${e.period ? `<span class="timeline__period">${esc(e.period)}</span>` : ""}
            <span class="timeline__title">${esc(e.title)}</span>
            <span class="timeline__org">${extLink(e.url, esc(e.org))}</span>
            ${e.description ? `<span class="timeline__desc">${esc(e.description)}</span>` : ""}
          </li>`).join("")}
        </ol>
      </div>`;
    if (!items.length) return "";
    return `<div class="timeline-columns">
      ${timeline("Positions", items.filter((e) => !e.education))}
      ${timeline("Education", items.filter((e) => e.education))}
    </div>`;
  }

  const renderTeaching = (courses) => !courses.length ? "" : `
    <ul class="plain-list">${courses.map((c) => `
      <li class="plain-list__item">
        <span class="plain-list__meta">${esc(c.period)}</span>
        <span><strong>${extLink(c.url, esc(c.course))}</strong>
          <span class="muted">· ${c.role ? esc(c.role) + ", " : ""}${esc(c.institution)}</span></span>
      </li>`).join("")}
    </ul>`;

  const renderAwards = (awards) => !awards.length ? "" : `
    <ul class="plain-list">${awards.map((a) => `
      <li class="plain-list__item">
        <span class="plain-list__meta">${esc(a.year)}</span>
        <span><span class="plain-list__icon">${icon("award")}</span><strong>${esc(a.title)}</strong>
          <span class="muted">· ${extLink(a.url, esc(a.org))}</span></span>
      </li>`).join("")}
    </ul>`;

  const renderSkills = (groups) => !groups.length ? "" : `
    <dl class="skills">${groups.map((g) => `
      <dt>${esc(g.group)}</dt>
      <dd><ul class="skill-list">${g.items.map((s) => `
        <li class="skill"><img src="assets/icons/${esc(s.icon)}" alt="" width="18" height="18" class="logo" loading="lazy">${esc(s.name)}</li>`).join("")}
      </ul></dd>`).join("")}
    </dl>`;

  /* Page assembly -------------------------------------------------------- */

  async function load(name) {
    const res = await fetch(`data/${name}.yml`);
    if (!res.ok) throw new Error(`data/${name}.yml: HTTP ${res.status}`);
    return jsyaml.load(await res.text()) || [];
  }

  function fill(id, body) {
    const section = document.getElementById(id);
    if (!body.trim()) { section.hidden = true; return; }
    const title = id === "publications" ? publicationsHeader() : `<h2 class="section-title">${section.dataset.title}</h2>`;
    section.innerHTML = title + body;
  }

  async function render() {
    const d = Object.fromEntries(await Promise.all(DATA_FILES.map(async (f) => [f, await load(f)])));

    document.getElementById("profile").innerHTML = renderProfile(d.profile);
    fill("about", renderAbout(d.profile));
    fill("research", renderResearch(d.research));
    fill("publications", renderPublications(d.publications, d.profile.name));
    fill("experience", renderExperience(d.experience));
    fill("teaching", renderTeaching(d.teaching));
    fill("awards", renderAwards(d.awards));
    fill("skills", renderSkills(d.skills));

    document.getElementById("nav").innerHTML = [...document.querySelectorAll("main > .section:not([hidden])")]
      .map((s) => `<li><a href="#${s.id}" data-nav-link>${s.dataset.title}</a></li>`).join("");

    const year = new Date().getFullYear();
    document.getElementById("footer").innerHTML = `<p>© ${year} ${esc(d.profile.name)}</p>`;

    // Jump to the anchor in the URL now that the content exists.
    if (location.hash) document.querySelector(location.hash)?.scrollIntoView();
  }

  render().catch((err) => {
    console.error(err);
    document.getElementById("about").innerHTML =
      `<p>Could not load the page content (${esc(err.message)}). If you opened the file directly, serve the folder with a local web server instead.</p>`;
  });
})();
