// Detail panel — slide-in panel for skill markdown content

var openDetailPanel; // exported globally for graph/card clicks

function initDetailPanel(skills, graphData) {
  const panel = document.querySelector(".detail-panel");
  const overlay = document.querySelector(".detail-overlay");
  const closeBtn = document.querySelector(".detail-close");
  const nameEl = document.querySelector(".detail-name");
  const metaEl = document.querySelector(".detail-meta");
  const bodyEl = document.querySelector(".detail-body");
  const rawToggle = document.querySelector(".detail-raw-toggle");

  if (!panel || !overlay) return;

  let currentSkill = null;
  let showingRaw = false;

  openDetailPanel = function (slug) {
    const skill = skills.find((s) => s.slug === slug);
    if (!skill) return;

    currentSkill = skill;
    showingRaw = false;
    rawToggle.textContent = "Show raw markdown";

    const node = graphData.nodes.find((n) => n.id === slug);
    const cat = node ? node.category : "Utilities";
    const catColor = graphData.categories[cat]?.color || "#6B7280";

    nameEl.textContent = skill.name;

    // Build meta pills
    const pills = [];
    pills.push(
      `<span class="detail-pill category" style="--cat-color:${catColor}">${cat}</span>`
    );
    if (skill.preambleTier) {
      pills.push(
        `<span class="detail-pill tier">tier ${skill.preambleTier}</span>`
      );
    }
    pills.push(
      `<span class="detail-pill">v${skill.version}</span>`
    );

    if (skill.allowedTools.length > 0) {
      skill.allowedTools.forEach((t) => {
        pills.push(`<span class="detail-pill">${escapeHtml(t)}</span>`);
      });
    }

    metaEl.innerHTML = pills.join("");

    // Triggers section + body
    let html = "";
    if (skill.triggers.length > 0) {
      html += '<div style="margin-bottom:20px"><strong style="color:var(--text);font-size:13px;font-family:var(--font-mono)">Triggers</strong><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">';
      skill.triggers.forEach((t) => {
        html += `<span class="trigger-tag">${escapeHtml(t)}</span>`;
      });
      html += "</div></div>";
    }
    html += skill.bodyHtml;
    bodyEl.innerHTML = html;
    bodyEl.scrollTop = 0;

    // Show panel
    overlay.hidden = false;
    panel.hidden = false;
    requestAnimationFrame(() => {
      overlay.classList.add("visible");
      panel.classList.add("visible");
    });

    // Update URL
    history.replaceState(null, "", `#skill/${slug}`);
  };

  function closePanel() {
    overlay.classList.remove("visible");
    panel.classList.remove("visible");
    setTimeout(() => {
      overlay.hidden = true;
      panel.hidden = true;
    }, 400);
    history.replaceState(null, "", location.pathname);
  }

  closeBtn.addEventListener("click", closePanel);
  overlay.addEventListener("click", closePanel);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.hidden) closePanel();
  });

  // Raw markdown toggle
  rawToggle.addEventListener("click", () => {
    if (!currentSkill) return;
    showingRaw = !showingRaw;
    if (showingRaw) {
      rawToggle.textContent = "Show rendered HTML";
      bodyEl.innerHTML = `<pre style="white-space:pre-wrap;word-break:break-word;font-size:13px;color:var(--text-secondary)">${escapeHtml(currentSkill.bodyMarkdown)}</pre>`;
    } else {
      rawToggle.textContent = "Show raw markdown";
      let html = "";
      if (currentSkill.triggers.length > 0) {
        html += '<div style="margin-bottom:20px"><strong style="color:var(--text);font-size:13px;font-family:var(--font-mono)">Triggers</strong><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">';
        currentSkill.triggers.forEach((t) => {
          html += `<span class="trigger-tag">${escapeHtml(t)}</span>`;
        });
        html += "</div></div>";
      }
      html += currentSkill.bodyHtml;
      bodyEl.innerHTML = html;
    }
    bodyEl.scrollTop = 0;
  });

  // Handle hash on load
  if (location.hash.startsWith("#skill/")) {
    const slug = location.hash.replace("#skill/", "");
    setTimeout(() => openDetailPanel(slug), 500);
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
}
