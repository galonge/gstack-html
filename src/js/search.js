// Client-side fuzzy search across skill names, descriptions, triggers

function initSearch(skills) {
  const input = document.querySelector(".search-input");
  const results = document.querySelector(".search-results");
  if (!input || !results) return;

  let debounceTimer;

  input.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => search(input.value.trim()), 150);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      input.value = "";
      results.hidden = true;
    }
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-container")) {
      results.hidden = true;
    }
  });

  function search(query) {
    if (!query || query.length < 2) {
      results.hidden = true;
      return;
    }

    const q = query.toLowerCase();
    const scored = skills
      .map((skill) => {
        let score = 0;

        if (skill.name.toLowerCase().includes(q)) score += 10;
        if (skill.name.toLowerCase().startsWith(q)) score += 5;
        if (skill.slug.includes(q)) score += 8;

        if (skill.description.toLowerCase().includes(q)) score += 3;

        for (const trigger of skill.triggers) {
          if (trigger.toLowerCase().includes(q)) {
            score += 5;
            break;
          }
        }

        for (const tool of skill.allowedTools) {
          if (tool.toLowerCase().includes(q)) {
            score += 2;
            break;
          }
        }

        return { skill, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    if (scored.length === 0) {
      results.innerHTML =
        '<div class="search-result-item"><div class="search-result-desc">No skills found</div></div>';
      results.hidden = false;
      return;
    }

    results.innerHTML = scored
      .map(
        ({ skill }) => `
        <div class="search-result-item" data-slug="${skill.slug}">
          <div class="search-result-name">${escapeHtml(skill.name)}</div>
          <div class="search-result-desc">${escapeHtml(skill.description)}</div>
        </div>
      `
      )
      .join("");

    results.hidden = false;

    results.querySelectorAll(".search-result-item[data-slug]").forEach((el) => {
      el.addEventListener("click", () => {
        const slug = el.dataset.slug;
        results.hidden = true;
        input.value = "";
        if (typeof openDetailPanel === "function") {
          openDetailPanel(slug);
        }
      });
    });
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
}
