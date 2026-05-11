// Atlas view — sidebar nav + skill detail content pane

var __atlasShowSkill;

function initAtlas(skills, graphData) {
  const nav = document.querySelector(".atlas-nav");
  const content = document.querySelector(".atlas-content");
  const filterInput = document.querySelector(".atlas-filter-input");

  if (!nav || !content) return;

  const skillBySlug = Object.fromEntries(skills.map((s) => [s.slug, s]));
  const nodeBySlug = Object.fromEntries(
    graphData.nodes.map((n) => [n.id, n])
  );
  const categories = graphData.categories;

  // === Build sidebar ===
  const homeLink = document.createElement("a");
  homeLink.className = "atlas-nav-home";
  homeLink.href = "#atlas";
  homeLink.innerHTML = "<strong>Start here</strong>";
  homeLink.addEventListener("click", (e) => {
    e.preventDefault();
    window.gstackNavigate("atlas");
  });
  nav.appendChild(homeLink);

  // Group skills by category, ordered by stage
  const orderedCats = Object.entries(categories)
    .sort((a, b) => a[1].stage - b[1].stage)
    .filter(([, info]) => info.count > 0);

  for (const [catName, info] of orderedCats) {
    const group = document.createElement("div");
    group.className = "atlas-nav-group";
    group.dataset.category = catName;

    const header = document.createElement("div");
    header.className = "atlas-nav-group-header";
    header.style.setProperty("--cat-color", info.color);
    header.innerHTML = `
      <span class="atlas-nav-group-dot"></span>
      <span>${catName}</span>
      <span class="atlas-nav-group-count">${info.count}</span>
    `;
    group.appendChild(header);

    const catSkills = graphData.nodes
      .filter((n) => n.category === catName)
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const node of catSkills) {
      const item = document.createElement("a");
      item.className = "atlas-nav-item";
      item.dataset.slug = node.id;
      item.href = `#atlas/${node.id}`;
      item.style.setProperty("--cat-color", info.color);
      item.innerHTML = `
        <span>/${node.name}</span>
        ${node.tier ? `<span class="atlas-nav-item-tier">T${node.tier}</span>` : ""}
      `;
      item.addEventListener("click", (e) => {
        e.preventDefault();
        window.gstackNavigate("atlas", node.id);
      });
      group.appendChild(item);
    }

    nav.appendChild(group);
  }

  // === Sidebar filter ===
  if (filterInput) {
    filterInput.addEventListener("input", () => {
      const q = filterInput.value.trim().toLowerCase();
      nav.querySelectorAll(".atlas-nav-item").forEach((item) => {
        const slug = item.dataset.slug;
        const skill = skillBySlug[slug];
        const haystack = (
          skill.name +
          " " +
          skill.description +
          " " +
          skill.triggers.join(" ")
        ).toLowerCase();
        item.classList.toggle("hidden", q && !haystack.includes(q));
      });

      // Hide empty groups
      nav.querySelectorAll(".atlas-nav-group").forEach((group) => {
        const visibleItems = [...group.querySelectorAll(".atlas-nav-item:not(.hidden)")].length;
        group.style.display = visibleItems === 0 ? "none" : "";
      });
    });
  }

  // === Render landing ===
  function renderLanding() {
    const paths = [
      {
        prompt: "I want to ship my first PR",
        skills: ["review", "ship", "land-and-deploy", "canary"],
      },
      {
        prompt: "I want to plan a feature",
        skills: ["office-hours", "autoplan", "plan-ceo-review", "plan-eng-review"],
      },
      {
        prompt: "I want to debug an issue",
        skills: ["investigate", "qa", "browse"],
      },
      {
        prompt: "I want to design something",
        skills: ["design-consultation", "design-shotgun", "design-html", "design-review"],
      },
      {
        prompt: "I want to add safety guardrails",
        skills: ["careful", "freeze", "guard", "cso"],
      },
      {
        prompt: "I want to reflect on what we built",
        skills: ["retro", "learn", "health", "document-release"],
      },
    ];

    const html = `
      <div class="atlas-landing">
        <div class="atlas-landing-hero">
          <h1><span class="amber">/</span>gstack</h1>
          <p>A reference for every skill in gstack. Pick a starting path below, or browse the sidebar.</p>
        </div>

        <div class="atlas-paths">
          <div class="atlas-paths-title">Start here</div>
          <div class="atlas-paths-grid">
            ${paths
              .map(
                (p) => `
              <div class="atlas-path-card" data-first="${p.skills[0]}">
                <div class="atlas-path-prompt">${escapeHtml(p.prompt)}</div>
                <div class="atlas-path-skills">
                  ${p.skills
                    .map(
                      (s, i) =>
                        `${i > 0 ? '<span class="atlas-path-arrow">→</span>' : ""}<span>/${escapeHtml(s)}</span>`
                    )
                    .join("")}
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>

        <div class="atlas-categories">
          <div class="atlas-paths-title">Browse by category</div>
          <div class="atlas-categories-grid">
            ${orderedCats
              .map(
                ([name, info]) => `
              <div class="atlas-category-card" style="--cat-color:${info.color}" data-category="${name}">
                <div class="atlas-category-name">${name}</div>
                <div class="atlas-category-count">${info.count} skill${info.count !== 1 ? "s" : ""}</div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      </div>
    `;

    content.innerHTML = html;

    content.querySelectorAll(".atlas-path-card").forEach((card) => {
      card.addEventListener("click", () => {
        window.gstackNavigate("atlas", card.dataset.first);
      });
    });

    content.querySelectorAll(".atlas-category-card").forEach((card) => {
      card.addEventListener("click", () => {
        const cat = card.dataset.category;
        const first = graphData.nodes
          .filter((n) => n.category === cat)
          .sort((a, b) => (b.tier || 0) - (a.tier || 0))[0];
        if (first) window.gstackNavigate("atlas", first.id);
      });
    });

    // Highlight home in sidebar
    nav.querySelectorAll(".atlas-nav-item").forEach((i) => i.classList.remove("active"));
    nav.querySelector(".atlas-nav-home")?.classList.add("active");
  }

  // === Render skill detail ===
  function renderSkill(slug) {
    const skill = skillBySlug[slug];
    if (!skill) {
      renderLanding();
      return;
    }
    const node = nodeBySlug[slug];
    const cat = node ? node.category : "Utilities";
    const catColor = categories[cat]?.color || "#6B7280";

    // Get related skills
    const related = getRelatedSkills(slug);

    const tagline = extractTagline(skill.description);

    const html = `
      <div class="atlas-skill" style="--cat-color:${catColor}">
        <nav class="atlas-breadcrumb">
          <a data-route="atlas">Atlas</a>
          <span class="atlas-breadcrumb-sep">›</span>
          <a data-category="${cat}">${cat}</a>
          <span class="atlas-breadcrumb-sep">›</span>
          <span>/${escapeHtml(skill.name)}</span>
        </nav>

        <div class="atlas-skill-hero">
          <h1 class="atlas-skill-name">${escapeHtml(skill.name)}</h1>
          <p class="atlas-skill-tagline">${escapeHtml(tagline)}</p>
          <div class="atlas-skill-meta">
            <span class="pill category" style="--cat-color:${catColor}">${cat}</span>
            ${skill.preambleTier ? `<span class="pill tier">Tier ${skill.preambleTier}</span>` : ""}
            <span class="pill dim">v${escapeHtml(skill.version)}</span>
          </div>
        </div>

        ${
          skill.triggers.length > 0
            ? `
        <div class="atlas-section">
          <div class="atlas-section-title">Triggers — natural language phrases</div>
          <div class="atlas-pill-grid">
            ${skill.triggers.map((t) => `<span class="pill">${escapeHtml(t)}</span>`).join("")}
          </div>
        </div>
        `
            : ""
        }

        ${
          skill.allowedTools.length > 0
            ? `
        <div class="atlas-section">
          <div class="atlas-section-title">Tools this skill can use</div>
          <div class="atlas-pill-grid">
            ${skill.allowedTools.map((t) => `<span class="pill dim">${escapeHtml(t)}</span>`).join("")}
          </div>
        </div>
        `
            : ""
        }

        ${
          related.length > 0
            ? `
        <div class="atlas-section">
          <div class="atlas-section-title">Related skills</div>
          <div class="atlas-related">
            ${related
              .slice(0, 6)
              .map((r) => {
                const rnode = nodeBySlug[r.slug];
                const rcat = rnode?.category || "Utilities";
                const rcolor = categories[rcat]?.color || "#6B7280";
                return `
              <div class="atlas-related-card" data-slug="${r.slug}" style="--cat-color:${rcolor}">
                <div class="atlas-related-name">/${escapeHtml(r.name)}</div>
                <div class="atlas-related-desc">${escapeHtml(r.description.slice(0, 100))}</div>
              </div>
            `;
              })
              .join("")}
          </div>
        </div>
        `
            : ""
        }

        <div class="atlas-section">
          <div class="atlas-section-title">Full documentation</div>
          <div class="atlas-body" data-mode="rendered">${skill.bodyHtml}</div>
          <button class="atlas-raw-toggle">Show raw markdown</button>
        </div>
      </div>
    `;

    content.innerHTML = html;
    content.scrollTop = 0;
    requestAnimationFrame(() => {
      try { window.scrollTo({ top: 0, behavior: "instant" }); } catch {}
      window.scrollTo(0, 0);
    });

    // Wire up interactions
    content.querySelectorAll(".atlas-related-card").forEach((card) => {
      card.addEventListener("click", () => {
        window.gstackNavigate("atlas", card.dataset.slug);
      });
    });

    content.querySelector('[data-route="atlas"]')?.addEventListener("click", (e) => {
      e.preventDefault();
      window.gstackNavigate("atlas");
    });

    // Raw markdown toggle
    const toggle = content.querySelector(".atlas-raw-toggle");
    const body = content.querySelector(".atlas-body");
    toggle?.addEventListener("click", () => {
      const mode = body.dataset.mode;
      if (mode === "rendered") {
        body.innerHTML = `<pre class="atlas-raw">${escapeHtml(skill.bodyMarkdown)}</pre>`;
        body.dataset.mode = "raw";
        toggle.textContent = "Show rendered HTML";
      } else {
        body.innerHTML = skill.bodyHtml;
        body.dataset.mode = "rendered";
        toggle.textContent = "Show raw markdown";
      }
    });

    // Highlight active item in sidebar
    nav.querySelectorAll(".atlas-nav-item").forEach((i) => {
      i.classList.toggle("active", i.dataset.slug === slug);
    });
    nav.querySelector(".atlas-nav-home")?.classList.remove("active");

    // Scroll active item into view
    const active = nav.querySelector(`.atlas-nav-item[data-slug="${slug}"]`);
    active?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function getRelatedSkills(slug) {
    const skill = skillBySlug[slug];
    if (!skill) return [];

    const found = new Set();
    const text = (skill.description + " " + skill.bodyMarkdown).toLowerCase();
    const pattern = /\/([a-z][\w-]*)/g;
    let m;
    while ((m = pattern.exec(text)) !== null) {
      const t = m[1];
      if (t !== slug && skillBySlug[t]) found.add(t);
    }

    // Also include edges from graph data (both directions)
    graphData.edges.forEach((e) => {
      if (e.source === slug && skillBySlug[e.target]) found.add(e.target);
      if (e.target === slug && skillBySlug[e.source]) found.add(e.source);
    });

    return [...found].map((s) => skillBySlug[s]).filter(Boolean);
  }

  function extractTagline(description) {
    // First sentence is usually the tagline
    const firstSentence = description.split(/\.(\s|$)/)[0];
    return firstSentence.length > 220 ? firstSentence.slice(0, 217) + "..." : firstSentence + ".";
  }

  function escapeHtml(str) {
    if (str == null) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // Route handler
  __atlasShowSkill = renderSkill;

  window.addEventListener("gstack:route", (e) => {
    if (e.detail.view !== "atlas") return;
    const subpath = e.detail.subpath;
    if (!subpath) {
      renderLanding();
    } else if (skillBySlug[subpath]) {
      renderSkill(subpath);
    } else {
      renderLanding();
    }
  });

  // Initial render (landing)
  renderLanding();
}
