/* Page behaviour: theme toggle, publication filter, BibTeX toggle/copy, active section in the nav.
   Click handlers are delegated to the document because the content is rendered by render.js. */
(function () {
  "use strict";

  const root = document.documentElement;

  function setTheme(theme) {
    root.dataset.theme = theme;
    document.dispatchEvent(new CustomEvent("themechange"));
  }

  // Follow the system setting while the visitor has not chosen a theme.
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    if (!localStorage.getItem("theme")) setTheme(e.matches ? "dark" : "light");
  });

  function filterPublications(type) {
    document.querySelectorAll("[data-filter]").forEach((b) => {
      const active = b.dataset.filter === type;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
    document.querySelectorAll("[data-pub-year]").forEach((year) => {
      let visible = 0;
      year.querySelectorAll("[data-pub-type]").forEach((pub) => {
        pub.hidden = type !== "all" && pub.dataset.pubType !== type;
        if (!pub.hidden) visible++;
      });
      year.hidden = visible === 0;
    });
  }

  function toggleBibtex(btn) {
    const open = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!open));
    document.getElementById(btn.getAttribute("aria-controls")).hidden = open;
  }

  function copyBibtex(btn) {
    const text = btn.parentElement.querySelector("code").textContent;
    navigator.clipboard.writeText(text).then(() => {
      const idle = btn.querySelector("[data-copy-idle]");
      const done = btn.querySelector("[data-copy-done]");
      idle.hidden = true;
      done.hidden = false;
      setTimeout(() => { idle.hidden = false; done.hidden = true; }, 1600);
    });
  }

  document.addEventListener("click", (e) => {
    const target = e.target.closest("[data-theme-toggle], [data-filter], [data-bibtex-toggle], [data-bibtex-copy]");
    if (!target) return;
    if (target.matches("[data-theme-toggle]")) {
      const next = root.dataset.theme === "dark" ? "light" : "dark";
      localStorage.setItem("theme", next);
      setTheme(next);
    } else if (target.matches("[data-filter]")) {
      filterPublications(target.dataset.filter);
    } else if (target.matches("[data-bibtex-toggle]")) {
      toggleBibtex(target);
    } else {
      copyBibtex(target);
    }
  });

  // Highlight the nav link of the section currently in view.
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      document.querySelectorAll("[data-nav-link]").forEach((a) => {
        a.classList.toggle("is-active", a.getAttribute("href") === `#${entry.target.id}`);
      });
    });
  }, { rootMargin: "-30% 0px -60% 0px" });
  document.querySelectorAll("main > .section").forEach((s) => observer.observe(s));
})();
