// Atlas view — sidebar nav + skill detail content pane

var __atlasShowSkill;

// Cache of loaded version data (by version key)
const versionCache = {};

async function loadVersionSkills(version) {
  if (versionCache[version]) return versionCache[version];
  try {
    const res = await fetch(`versions/v${version}/skills.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    versionCache[version] = data;
    return data;
  } catch (err) {
    console.error("Failed to load version", version, err);
    return null;
  }
}

function initAtlas(skills, graphData) {
  const nav = document.querySelector(".atlas-nav");
  const content = document.querySelector(".atlas-content");
  const filterInput = document.querySelector(".atlas-filter-input");
  const versionTrigger = document.querySelector(".atlas-version-trigger");
  const versionMenu = document.querySelector(".atlas-version-menu");
  const versionCurrentLabel = document.querySelector(".atlas-version-current");

  if (!nav || !content) return;

  const versionsIndex = window.__VERSIONS_INDEX__ || { versions: [], current: "" };
  const currentVersion = versionsIndex.current;

  // Seed the cache with the bundled (latest) skills
  if (currentVersion) {
    versionCache[currentVersion] = skills;
  }

  const skillBySlug = Object.fromEntries(skills.map((s) => [s.slug, s]));
  const nodeBySlug = Object.fromEntries(
    graphData.nodes.map((n) => [n.id, n])
  );
  const categories = graphData.categories;

  // === Version picker UI ===
  if (versionCurrentLabel) {
    versionCurrentLabel.textContent = `v${currentVersion}`;
  }

  if (versionMenu && versionsIndex.versions.length > 0) {
    versionsIndex.versions.forEach((v, i) => {
      const item = document.createElement("div");
      item.className = "atlas-version-item" + (v.version === currentVersion ? " active" : "");
      item.setAttribute("role", "option");
      item.innerHTML = `
        <span>v${v.version}</span>
        <span class="atlas-version-item-date">${v.date}</span>
        ${i === 0 ? '<span class="atlas-version-item-current">latest</span>' : ""}
      `;
      item.addEventListener("click", () => {
        closeVersionMenu();
        if (v.version !== currentVersion) {
          // For now: clicking an older version just sets the active version in the picker
          // and the compare UI; we don't navigate. The compare button on each skill
          // is the primary way to interact with older versions.
          alert(`Looking at the snapshot for v${v.version}.\n\nOpen any skill and click "Compare versions" to see what changed.`);
        }
      });
      versionMenu.appendChild(item);
    });
  }

  function openVersionMenu() {
    versionMenu.hidden = false;
    versionTrigger.setAttribute("aria-expanded", "true");
  }

  function closeVersionMenu() {
    versionMenu.hidden = true;
    versionTrigger.setAttribute("aria-expanded", "false");
  }

  versionTrigger?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (versionMenu.hidden) openVersionMenu();
    else closeVersionMenu();
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".atlas-version-picker")) closeVersionMenu();
  });

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
          <div class="atlas-body">${skill.bodyHtml}</div>
        </div>

        <div class="atlas-source">
          <button class="atlas-source-toggle" aria-expanded="false">
            <span class="atlas-source-toggle-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </span>
            <span class="atlas-source-toggle-label">
              <span class="atlas-source-toggle-title">View source</span>
              <span class="atlas-source-toggle-meta">SKILL.md · ${skill.bodyMarkdown.split('\n').length} lines · markdown</span>
            </span>
            <span class="atlas-source-toggle-action">Show</span>
          </button>
          <div class="atlas-source-panel" hidden>
            <div class="atlas-source-header">
              <span class="atlas-source-header-name">${escapeHtml(skill.slug)}/SKILL.md</span>
              <button class="atlas-source-copy" aria-label="Copy markdown">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                <span>Copy</span>
              </button>
            </div>
            <pre class="atlas-source-pre"><code class="atlas-source-code"></code></pre>
          </div>
        </div>

        ${versionsIndex.versions.length > 1 ? `
        <div class="atlas-compare">
          <button class="atlas-compare-toggle" aria-expanded="false">
            <span class="atlas-compare-toggle-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3l5 5-5 5"/><path d="M8 21l-5-5 5-5"/><path d="M21 8H7a4 4 0 0 0-4 4"/><path d="M3 16h14a4 4 0 0 0 4-4"/></svg>
            </span>
            <span class="atlas-compare-toggle-label">
              <span class="atlas-compare-toggle-title">Compare versions</span>
              <span class="atlas-compare-toggle-meta">See what changed in /${skill.slug} across ${versionsIndex.versions.length} tracked versions</span>
            </span>
            <span class="atlas-source-toggle-action">Compare</span>
          </button>
          <div class="atlas-compare-panel" hidden></div>
        </div>
        ` : ""}
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

    // Source viewer slide-down
    const sourceToggle = content.querySelector(".atlas-source-toggle");
    const sourcePanel = content.querySelector(".atlas-source-panel");
    const sourceCode = content.querySelector(".atlas-source-code");
    const sourceAction = content.querySelector(".atlas-source-toggle-action");

    if (sourceCode) sourceCode.textContent = skill.bodyMarkdown;

    sourceToggle?.addEventListener("click", () => {
      const isOpen = sourceToggle.getAttribute("aria-expanded") === "true";
      sourceToggle.setAttribute("aria-expanded", String(!isOpen));
      sourcePanel.hidden = isOpen;
      sourceAction.textContent = isOpen ? "Show" : "Hide";
      if (!isOpen) {
        // Scroll the source into view smoothly
        setTimeout(() => {
          sourcePanel.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 50);
      }
    });

    // Copy button
    const copyBtn = content.querySelector(".atlas-source-copy");
    copyBtn?.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(skill.bodyMarkdown);
        const label = copyBtn.querySelector("span");
        const orig = label.textContent;
        label.textContent = "Copied!";
        setTimeout(() => { label.textContent = orig; }, 1500);
      } catch {}
    });

    // Compare versions
    const compareToggle = content.querySelector(".atlas-compare-toggle");
    const comparePanel = content.querySelector(".atlas-compare-panel");

    compareToggle?.addEventListener("click", async () => {
      const isOpen = compareToggle.getAttribute("aria-expanded") === "true";
      compareToggle.setAttribute("aria-expanded", String(!isOpen));
      comparePanel.hidden = isOpen;
      const actionLabel = compareToggle.querySelector(".atlas-source-toggle-action");
      if (actionLabel) actionLabel.textContent = isOpen ? "Compare" : "Hide";
      if (isOpen) return;

      // Render compare UI on first open
      if (!comparePanel.dataset.rendered) {
        comparePanel.dataset.rendered = "true";
        renderCompareUI(comparePanel, slug);
      }

      setTimeout(() => {
        comparePanel.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
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

  // === Compare UI ===
  async function renderCompareUI(panel, slug) {
    const allVersions = versionsIndex.versions;
    if (allVersions.length < 2) {
      panel.innerHTML = `<div class="atlas-compare-empty"><div class="atlas-compare-empty-icon">⏳</div>Only one version tracked so far. The nightly workflow will accumulate history over time.</div>`;
      return;
    }

    const latest = allVersions[0];
    const previous = allVersions[1];

    panel.innerHTML = `
      <div class="atlas-compare-header">
        <div class="atlas-compare-version-pair">
          <select class="atlas-compare-select" data-side="from">
            ${allVersions.map((v, i) => `<option value="${v.version}" ${i === 1 ? "selected" : ""}>v${v.version}  ·  ${v.date}</option>`).join("")}
          </select>
          <span class="atlas-compare-arrow">→</span>
          <select class="atlas-compare-select" data-side="to">
            ${allVersions.map((v, i) => `<option value="${v.version}" ${i === 0 ? "selected" : ""}>v${v.version}  ·  ${v.date}</option>`).join("")}
          </select>
        </div>
        <div class="atlas-compare-stats" data-stats></div>
      </div>
      <div class="atlas-compare-body" data-diff>
        <div class="atlas-compare-empty"><div class="atlas-compare-empty-icon">⏳</div>Loading...</div>
      </div>
    `;

    const fromSelect = panel.querySelector('[data-side="from"]');
    const toSelect = panel.querySelector('[data-side="to"]');

    async function updateDiff() {
      const fromV = fromSelect.value;
      const toV = toSelect.value;
      await renderDiff(panel, slug, fromV, toV);
    }

    fromSelect.addEventListener("change", updateDiff);
    toSelect.addEventListener("change", updateDiff);

    await updateDiff();
  }

  async function renderDiff(panel, slug, fromV, toV) {
    const diffBody = panel.querySelector("[data-diff]");
    const statsEl = panel.querySelector("[data-stats]");
    diffBody.innerHTML = `<div class="atlas-compare-empty"><div class="atlas-compare-empty-icon">⏳</div>Loading v${fromV} and v${toV}...</div>`;

    const [fromData, toData] = await Promise.all([
      loadVersionSkills(fromV),
      loadVersionSkills(toV),
    ]);

    if (!fromData || !toData) {
      diffBody.innerHTML = `<div class="atlas-compare-empty"><div class="atlas-compare-empty-icon">⚠️</div>Could not load version data. Try again or pick a different version.</div>`;
      return;
    }

    const fromSkill = fromData.find((s) => s.slug === slug);
    const toSkill = toData.find((s) => s.slug === slug);

    if (!fromSkill && !toSkill) {
      diffBody.innerHTML = `<div class="atlas-compare-not-in-version"><strong>/${slug}</strong> didn't exist in either v${fromV} or v${toV}.</div>`;
      statsEl.innerHTML = "";
      return;
    }

    if (!fromSkill) {
      diffBody.innerHTML = `<div class="atlas-compare-not-in-version"><strong>/${slug}</strong> was added in v${toV}. It didn't exist in v${fromV}.</div>`;
      const lines = (toSkill.bodyMarkdown || "").split("\n").length;
      statsEl.innerHTML = `<span class="atlas-compare-stat-added">+${lines}</span><span class="atlas-compare-stat-unchanged">new skill</span>`;
      return;
    }

    if (!toSkill) {
      diffBody.innerHTML = `<div class="atlas-compare-not-in-version"><strong>/${slug}</strong> was removed in v${toV}. It existed in v${fromV}.</div>`;
      const lines = (fromSkill.bodyMarkdown || "").split("\n").length;
      statsEl.innerHTML = `<span class="atlas-compare-stat-removed">-${lines}</span><span class="atlas-compare-stat-unchanged">removed</span>`;
      return;
    }

    // Diff the two markdown bodies (plus frontmatter we care about as a prefix)
    const fromText = serializeForDiff(fromSkill);
    const toText = serializeForDiff(toSkill);

    if (fromText === toText) {
      diffBody.innerHTML = `<div class="atlas-compare-empty"><div class="atlas-compare-empty-icon">✓</div>No changes between v${fromV} and v${toV}.</div>`;
      statsEl.innerHTML = `<span class="atlas-compare-stat-unchanged">identical</span>`;
      return;
    }

    const diff = computeDiff(fromText, toText);
    let added = 0;
    let removed = 0;
    diff.forEach((line) => {
      if (line.type === "add") added++;
      if (line.type === "remove") removed++;
    });

    statsEl.innerHTML = `
      <span class="atlas-compare-stat-added">+${added}</span>
      <span class="atlas-compare-stat-removed">-${removed}</span>
    `;

    diffBody.innerHTML = `<div class="atlas-diff">${diff
      .map((line) => renderDiffLine(line))
      .join("")}</div>`;
  }

  function serializeForDiff(skill) {
    // Include version + a few metadata fields + body
    const meta = [
      `version: ${skill.version}`,
      `tier: ${skill.preambleTier ?? "—"}`,
      `triggers: ${(skill.triggers || []).join(", ")}`,
      `tools: ${(skill.allowedTools || []).join(", ")}`,
      `description: ${skill.description.trim()}`,
      "",
      "---",
      "",
    ].join("\n");
    return meta + (skill.bodyMarkdown || "");
  }

  function renderDiffLine(line) {
    const marker = line.type === "add" ? "+" : line.type === "remove" ? "-" : line.type === "hunk" ? " " : " ";
    return `<div class="atlas-diff-line ${line.type}">
      <span class="atlas-diff-marker">${marker}</span>
      <span class="atlas-diff-content">${escapeHtml(line.content)}</span>
    </div>`;
  }

  // Line-based diff with context. Simple LCS-style approach with hunk grouping.
  function computeDiff(fromText, toText) {
    const fromLines = fromText.split("\n");
    const toLines = toText.split("\n");

    // Use a Myers-style diff: compute LCS via DP table, then walk back.
    // For perf, limit to 2000 lines per side (SKILL.md files won't exceed this).
    const m = fromLines.length;
    const n = toLines.length;

    if (m + n > 8000) {
      // Too big — fall back to a naive comparison
      return naiveDiff(fromLines, toLines);
    }

    // Build LCS table
    const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (fromLines[i - 1] === toLines[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    // Backtrack to get operations
    const ops = [];
    let i = m;
    let j = n;
    while (i > 0 && j > 0) {
      if (fromLines[i - 1] === toLines[j - 1]) {
        ops.unshift({ type: "context", content: fromLines[i - 1] });
        i--; j--;
      } else if (dp[i - 1][j] >= dp[i][j - 1]) {
        ops.unshift({ type: "remove", content: fromLines[i - 1] });
        i--;
      } else {
        ops.unshift({ type: "add", content: toLines[j - 1] });
        j--;
      }
    }
    while (i > 0) {
      ops.unshift({ type: "remove", content: fromLines[i - 1] });
      i--;
    }
    while (j > 0) {
      ops.unshift({ type: "add", content: toLines[j - 1] });
      j--;
    }

    // Group into hunks: collapse runs of >5 context lines
    return collapseContext(ops, 3);
  }

  function naiveDiff(fromLines, toLines) {
    // Treat as full removal + full addition
    return [
      ...fromLines.map((l) => ({ type: "remove", content: l })),
      ...toLines.map((l) => ({ type: "add", content: l })),
    ];
  }

  function collapseContext(ops, contextLines) {
    const result = [];
    let runStart = 0;
    let i = 0;
    while (i < ops.length) {
      if (ops[i].type !== "context") {
        i++;
        continue;
      }
      let j = i;
      while (j < ops.length && ops[j].type === "context") j++;
      const runLength = j - i;
      const isStart = i === 0;
      const isEnd = j === ops.length;

      if (runLength > contextLines * 2 + 1 && !isStart && !isEnd) {
        // Keep context before, hunk marker, context after
        const headEnd = i + contextLines;
        for (let k = i; k < headEnd; k++) result.push(ops[k]);
        const skipped = runLength - contextLines * 2;
        result.push({
          type: "hunk",
          content: `··· ${skipped} unchanged line${skipped === 1 ? "" : "s"} ···`,
        });
        for (let k = j - contextLines; k < j; k++) result.push(ops[k]);
      } else if (isStart && runLength > contextLines + 1) {
        // Skip leading context
        const skipped = runLength - contextLines;
        result.push({
          type: "hunk",
          content: `··· ${skipped} unchanged line${skipped === 1 ? "" : "s"} ···`,
        });
        for (let k = j - contextLines; k < j; k++) result.push(ops[k]);
      } else if (isEnd && runLength > contextLines + 1) {
        // Skip trailing context
        const skipped = runLength - contextLines;
        for (let k = i; k < i + contextLines; k++) result.push(ops[k]);
        result.push({
          type: "hunk",
          content: `··· ${skipped} unchanged line${skipped === 1 ? "" : "s"} ···`,
        });
      } else {
        for (let k = i; k < j; k++) result.push(ops[k]);
      }
      i = j;
    }
    // Add non-context ops in their original order — actually we walk through all ops sequentially.
    // The above loop only added context groups; we still need to interleave the add/remove ops.
    // Reconsider: rewrite to walk through original ops once.
    return walkAndCollapse(ops, contextLines);
  }

  function walkAndCollapse(ops, contextLines) {
    const out = [];
    let i = 0;
    while (i < ops.length) {
      const op = ops[i];
      if (op.type !== "context") {
        out.push(op);
        i++;
        continue;
      }
      // Found a context run starting at i
      let j = i;
      while (j < ops.length && ops[j].type === "context") j++;
      const runLength = j - i;
      const isStart = out.length === 0;
      const isEnd = j === ops.length;

      if (runLength > contextLines * 2 + 1 && !isStart && !isEnd) {
        for (let k = i; k < i + contextLines; k++) out.push(ops[k]);
        const skipped = runLength - contextLines * 2;
        out.push({
          type: "hunk",
          content: `··· ${skipped} unchanged line${skipped === 1 ? "" : "s"} ···`,
        });
        for (let k = j - contextLines; k < j; k++) out.push(ops[k]);
      } else if (isStart && runLength > contextLines + 1) {
        const skipped = runLength - contextLines;
        out.push({
          type: "hunk",
          content: `··· ${skipped} unchanged line${skipped === 1 ? "" : "s"} ···`,
        });
        for (let k = j - contextLines; k < j; k++) out.push(ops[k]);
      } else if (isEnd && runLength > contextLines + 1) {
        const skipped = runLength - contextLines;
        for (let k = i; k < i + contextLines; k++) out.push(ops[k]);
        out.push({
          type: "hunk",
          content: `··· ${skipped} unchanged line${skipped === 1 ? "" : "s"} ···`,
        });
      } else {
        for (let k = i; k < j; k++) out.push(ops[k]);
      }
      i = j;
    }
    return out;
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
