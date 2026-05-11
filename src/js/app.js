// App router — tabs, URL hash, cmd+K search

(function () {
  const skills = window.__SKILLS_DATA__;
  const graphData = window.__GRAPH_DATA__;

  function boot() {
    initTabs();
    initSearchOverlay();
    formatBuildDate();

    if (typeof initStory === "function") initStory(skills, graphData);
    if (typeof initFlow === "function") initFlow(skills, graphData);
    if (typeof initAtlas === "function") initAtlas(skills, graphData);

    // Resolve initial route from URL hash
    handleRoute();

    window.addEventListener("hashchange", handleRoute);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  function initTabs() {
    document.querySelectorAll(".tab[data-view]").forEach((tab) => {
      tab.addEventListener("click", (e) => {
        e.preventDefault();
        const view = tab.dataset.view;
        navigateTo(view);
      });
    });
  }

  function navigateTo(view, subpath) {
    const newHash = subpath ? `#${view}/${subpath}` : `#${view}`;
    if (location.hash !== newHash) {
      location.hash = newHash;
    } else {
      handleRoute();
    }
  }

  window.gstackNavigate = navigateTo;

  function handleRoute() {
    const hash = location.hash.replace(/^#/, "") || "story";
    const [view, ...rest] = hash.split("/");
    const validViews = ["story", "flow", "atlas"];
    const targetView = validViews.includes(view) ? view : "story";

    setActiveView(targetView);

    // Dispatch sub-route to view handlers
    const subpath = rest.join("/");
    window.dispatchEvent(new CustomEvent("gstack:route", {
      detail: { view: targetView, subpath }
    }));
  }

  function setActiveView(view) {
    document.body.dataset.view = view;

    document.querySelectorAll(".tab[data-view]").forEach((tab) => {
      const isActive = tab.dataset.view === view;
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    document.querySelectorAll(".view[data-view]").forEach((section) => {
      const isActive = section.dataset.view === view;
      section.hidden = !isActive;
    });

    // Scroll to top on tab change (fall back to legacy scrollTo if behavior:instant unsupported)
    if (view !== "story") {
      try {
        window.scrollTo({ top: 0, behavior: "instant" });
      } catch {
        window.scrollTo(0, 0);
      }
      window.scrollTo(0, 0);
    }
  }

  // === cmd+K Search Overlay ===
  function initSearchOverlay() {
    const overlay = document.querySelector(".search-overlay");
    const input = document.querySelector(".search-overlay-input");
    const results = document.querySelector(".search-overlay-results");
    const trigger = document.querySelector(".search-trigger");

    if (!overlay || !input || !results) return;

    function open() {
      overlay.hidden = false;
      overlay.classList.add("visible");
      setTimeout(() => input.focus(), 30);
    }

    function close() {
      overlay.classList.remove("visible");
      overlay.hidden = true;
      input.value = "";
      results.innerHTML = "";
    }

    trigger?.addEventListener("click", open);

    document.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (overlay.hidden) open(); else close();
      } else if (e.key === "Escape" && !overlay.hidden) {
        close();
      }
    });

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });

    let activeIdx = -1;

    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      activeIdx = -1;
      if (!q) {
        results.innerHTML = "";
        return;
      }

      const matches = scoreSkills(q);
      if (matches.length === 0) {
        results.innerHTML = `<div class="search-empty">No skills match "${escapeHtml(q)}"</div>`;
        return;
      }

      results.innerHTML = matches
        .slice(0, 8)
        .map((m, i) => {
          const node = graphData.nodes.find((n) => n.id === m.skill.slug);
          const catColor = graphData.categories[node?.category]?.color || "#6B7280";
          return `
          <div class="search-result" data-slug="${m.skill.slug}" data-idx="${i}">
            <span class="search-result-dot" style="background:${catColor}"></span>
            <div class="search-result-text">
              <div class="search-result-name">/${escapeHtml(m.skill.name)}</div>
              <div class="search-result-desc">${escapeHtml(m.skill.description.slice(0, 80))}</div>
            </div>
            <span class="search-result-view">Atlas</span>
          </div>
        `;
        })
        .join("");

      results.querySelectorAll(".search-result").forEach((el) => {
        el.addEventListener("click", () => {
          navigateTo("atlas", el.dataset.slug);
          close();
        });
      });
    });

    input.addEventListener("keydown", (e) => {
      const items = results.querySelectorAll(".search-result");
      if (!items.length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        activeIdx = Math.min(activeIdx + 1, items.length - 1);
        updateActive();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        activeIdx = Math.max(activeIdx - 1, 0);
        updateActive();
      } else if (e.key === "Enter" && activeIdx >= 0) {
        e.preventDefault();
        items[activeIdx].click();
      }

      function updateActive() {
        items.forEach((it, i) => it.classList.toggle("active", i === activeIdx));
        items[activeIdx]?.scrollIntoView({ block: "nearest" });
      }
    });
  }

  function scoreSkills(q) {
    return skills
      .map((skill) => {
        let score = 0;
        const name = skill.name.toLowerCase();
        const slug = skill.slug.toLowerCase();
        const desc = skill.description.toLowerCase();

        if (name === q || slug === q) score += 20;
        if (name.startsWith(q) || slug.startsWith(q)) score += 10;
        if (name.includes(q) || slug.includes(q)) score += 6;
        if (desc.includes(q)) score += 2;

        for (const t of skill.triggers) {
          if (t.toLowerCase().includes(q)) { score += 4; break; }
        }
        for (const tool of skill.allowedTools) {
          if (tool.toLowerCase().includes(q)) { score += 1; break; }
        }

        return { skill, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  function formatBuildDate() {
    const timeEl = document.querySelector(".footer-updated time");
    if (timeEl) {
      try {
        const d = new Date(timeEl.textContent);
        timeEl.textContent = d.toLocaleDateString("en-US", {
          year: "numeric", month: "long", day: "numeric"
        });
      } catch {}
    }
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
})();
