// Flow view — pipeline-first subway map

function initFlow(skills, graphData) {
  const pipeline = document.querySelector(".flow-pipeline");
  const detail = document.querySelector(".flow-stage-detail");
  const crossRail = document.querySelector(".flow-cross-rail");

  if (!pipeline || !detail) return;

  const skillBySlug = Object.fromEntries(skills.map((s) => [s.slug, s]));
  const categories = graphData.categories;

  // Map stages to categories + ordering
  const STAGES = [
    {
      id: "ideate",
      label: "Ideate",
      icon: "💡",
      prompt: "Should you build it? Forcing questions before any code is written.",
      categories: ["Planning"],
      filter: (s) => s.slug === "office-hours",
    },
    {
      id: "plan",
      label: "Plan",
      icon: "🧭",
      prompt: "Pressure-test the plan from four angles: product, engineering, design, developer experience.",
      categories: ["Planning"],
      filter: (s) => s.slug !== "office-hours",
    },
    {
      id: "design",
      label: "Design",
      icon: "🎨",
      prompt: "Visual variants and production-ready HTML/CSS before the code is written.",
      categories: ["Design"],
    },
    {
      id: "build",
      label: "Build",
      icon: "🔨",
      prompt: "Code review, debugging, and cross-LLM second opinions while you build.",
      categories: ["Build"],
      filter: (s) => !["qa", "qa-only"].includes(s.slug),
    },
    {
      id: "qa",
      label: "QA",
      icon: "🧪",
      prompt: "Drive a real browser, find bugs, file reports with screenshots.",
      categories: ["Build"],
      filter: (s) => ["qa", "qa-only", "browse", "scrape"].includes(s.slug),
    },
    {
      id: "review",
      label: "Review",
      icon: "🔍",
      prompt: "Specialist subagents review your diff for security, structure, performance.",
      categories: ["Build", "Security"],
      filter: (s) => ["review", "cso"].includes(s.slug),
    },
    {
      id: "ship",
      label: "Ship",
      icon: "🚀",
      prompt: "Run tests, bump version, generate changelog, open PR. Then merge and deploy.",
      categories: ["Ship"],
      filter: (s) =>
        ["ship", "land-and-deploy", "document-release", "setup-deploy", "gstack-upgrade"].includes(
          s.slug
        ),
    },
    {
      id: "monitor",
      label: "Monitor",
      icon: "📡",
      prompt: "Watch the live app after launch — errors, regressions, page failures.",
      categories: ["Ship", "Ops"],
      filter: (s) => ["canary", "landing-report", "health"].includes(s.slug),
    },
    {
      id: "reflect",
      label: "Reflect",
      icon: "✨",
      prompt: "Capture wins, persist patterns, get smarter every cycle.",
      categories: ["Ops"],
      filter: (s) =>
        ["retro", "learn", "benchmark", "benchmark-models", "context-save", "context-restore"].includes(
          s.slug
        ),
    },
  ];

  const CROSS_CUTTING = [
    "browse",
    "open-gstack-browser",
    "setup-browser-cookies",
    "pair-agent",
    "careful",
    "freeze",
    "unfreeze",
    "guard",
    "make-pdf",
    "skillify",
    "setup-gbrain",
    "sync-gbrain",
    "investigate",
    "codex",
    "devex-review",
  ];

  // Build pipeline
  STAGES.forEach((stage, i) => {
    if (i > 0) {
      const arrow = document.createElement("div");
      arrow.className = "flow-arrow";
      arrow.innerHTML = `<svg width="20" height="12" viewBox="0 0 20 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M0 6 L18 6 M14 2 L18 6 L14 10"/></svg>`;
      pipeline.appendChild(arrow);
    }

    const stageSkills = getStageSkills(stage);

    const btn = document.createElement("button");
    btn.className = "flow-stage";
    btn.dataset.stage = stage.id;
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", "false");
    btn.innerHTML = `
      <div class="flow-stage-circle">
        <div class="flow-stage-icon">${stage.icon}</div>
        <div class="flow-stage-count">${stageSkills.length}</div>
      </div>
      <div class="flow-stage-label">${stage.label}</div>
    `;

    btn.addEventListener("click", () => {
      window.gstackNavigate("flow", stage.id);
    });

    pipeline.appendChild(btn);
  });

  // Build cross-cutting rail
  if (crossRail) {
    CROSS_CUTTING.forEach((slug) => {
      const skill = skillBySlug[slug];
      if (!skill) return;
      const node = graphData.nodes.find((n) => n.id === slug);
      const catColor = categories[node?.category]?.color || "#6B7280";

      const card = document.createElement("div");
      card.className = "flow-cross-card";
      card.dataset.slug = slug;
      card.style.setProperty("--cat-color", catColor);
      card.innerHTML = `
        <div class="flow-cross-name">${escapeHtml(skill.name)}</div>
        <div class="flow-cross-desc">${escapeHtml(firstLine(skill.description, 90))}</div>
      `;
      card.addEventListener("click", () => {
        window.gstackNavigate("atlas", slug);
      });
      crossRail.appendChild(card);
    });
  }

  function getStageSkills(stage) {
    const fromCats = graphData.nodes.filter((n) => stage.categories.includes(n.category));
    const asSkills = fromCats.map((n) => skillBySlug[n.id]).filter(Boolean);
    return stage.filter ? asSkills.filter((s) => stage.filter(s)) : asSkills;
  }

  function renderStage(stageId) {
    const stage = STAGES.find((s) => s.id === stageId);
    if (!stage) {
      detail.className = "flow-stage-detail empty";
      detail.innerHTML = "Click a station above to see the skills available at that stage.";
      pipeline.querySelectorAll(".flow-stage").forEach((b) =>
        b.setAttribute("aria-selected", "false")
      );
      return;
    }

    const stageSkills = getStageSkills(stage);

    // Find next stage for "leads to"
    const stageIdx = STAGES.findIndex((s) => s.id === stageId);
    const nextStage = STAGES[stageIdx + 1];

    detail.className = "flow-stage-detail";
    detail.innerHTML = `
      <div class="flow-stage-header">
        <div>
          <h2 class="flow-stage-title">${stage.icon} ${stage.label}</h2>
          <p class="flow-stage-prompt">${escapeHtml(stage.prompt)}</p>
        </div>
        <div class="flow-stage-progress">
          Stage <span>${stageIdx + 1}</span> of ${STAGES.length}
        </div>
      </div>
      <div class="flow-cards">
        ${stageSkills.map((s) => renderCard(s, nextStage)).join("")}
      </div>
    `;

    // Wire card clicks
    detail.querySelectorAll(".flow-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest(".flow-leads-chip")) return;
        window.gstackNavigate("atlas", card.dataset.slug);
      });
    });

    detail.querySelectorAll(".flow-leads-chip").forEach((chip) => {
      chip.addEventListener("click", (e) => {
        e.stopPropagation();
        const target = chip.dataset.target;
        if (target) window.gstackNavigate("atlas", target);
      });
    });

    // Update active state
    pipeline.querySelectorAll(".flow-stage").forEach((b) => {
      b.setAttribute("aria-selected", b.dataset.stage === stageId ? "true" : "false");
    });

    // Scroll selected stage into view if needed
    const selected = pipeline.querySelector(`[data-stage="${stageId}"]`);
    selected?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }

  function renderCard(skill, nextStage) {
    const node = graphData.nodes.find((n) => n.id === skill.slug);
    const cat = node?.category || "Utilities";
    const catColor = categories[cat]?.color || "#6B7280";

    // Find "leads to" — edges from this skill, prioritize skills in nextStage
    const outgoing = graphData.edges
      .filter((e) => e.source === skill.slug)
      .map((e) => skillBySlug[e.target])
      .filter(Boolean);

    let leadsTo = [];
    if (nextStage) {
      const nextSkills = getStageSkills(nextStage);
      leadsTo = outgoing.filter((s) => nextSkills.find((ns) => ns.slug === s.slug));
    }
    if (leadsTo.length === 0) {
      leadsTo = outgoing.slice(0, 3);
    }

    return `
      <div class="flow-card" data-slug="${skill.slug}" style="--cat-color:${catColor}">
        <div class="flow-card-head">
          <span class="flow-card-name">${escapeHtml(skill.name)}</span>
          ${skill.preambleTier ? `<span class="flow-card-tier">T${skill.preambleTier}</span>` : ""}
        </div>
        <div class="flow-card-desc">${escapeHtml(firstLine(skill.description, 200))}</div>
        ${
          leadsTo.length > 0
            ? `
        <div class="flow-card-section">
          <div class="flow-card-label">Leads to</div>
          <div class="flow-card-leads-to">
            ${leadsTo
              .slice(0, 3)
              .map((s) => `<span class="flow-leads-chip" data-target="${s.slug}">/${escapeHtml(s.name)}</span>`)
              .join("")}
          </div>
        </div>
        `
            : skill.triggers.length > 0
              ? `
        <div class="flow-card-section">
          <div class="flow-card-label">Trigger</div>
          <div class="flow-card-leads-to">
            <span class="flow-leads-chip">${escapeHtml(skill.triggers[0])}</span>
          </div>
        </div>
        `
              : ""
        }
      </div>
    `;
  }

  function firstLine(text, max) {
    const t = text.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
    if (t.length <= max) return t;
    return t.slice(0, max - 3) + "...";
  }

  function escapeHtml(str) {
    if (str == null) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // Route handler
  window.addEventListener("gstack:route", (e) => {
    if (e.detail.view !== "flow") return;
    const subpath = e.detail.subpath;
    if (subpath && STAGES.find((s) => s.id === subpath)) {
      renderStage(subpath);
    } else {
      // Default: select first stage
      renderStage(STAGES[0].id);
    }
  });

  // Initial render
  renderStage(STAGES[0].id);
}
