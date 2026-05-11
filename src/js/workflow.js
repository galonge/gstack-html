// Workflow pipeline — horizontal SVG stage nodes with animations

function initWorkflow(graphData) {
  const STAGES = [
    { label: "Ideate", categories: ["Planning"] },
    { label: "Plan", categories: ["Planning"] },
    { label: "Design", categories: ["Design"] },
    { label: "Build", categories: ["Build"] },
    { label: "QA", categories: ["Build"] },
    { label: "Review", categories: ["Build"] },
    { label: "Ship", categories: ["Ship"] },
    { label: "Monitor", categories: ["Ops"] },
    { label: "Reflect", categories: ["Ops"] },
  ];

  // Count skills per stage
  const catSkillCounts = {};
  for (const node of graphData.nodes) {
    catSkillCounts[node.category] = (catSkillCounts[node.category] || 0) + 1;
  }

  const track = document.querySelector(".workflow-track");
  if (!track) return;

  STAGES.forEach((stage, i) => {
    const count = stage.categories.reduce(
      (sum, c) => sum + (catSkillCounts[c] || 0),
      0
    );

    if (i > 0) {
      const arrow = document.createElement("div");
      arrow.className = "workflow-arrow";
      arrow.dataset.index = i;
      track.appendChild(arrow);
    }

    const el = document.createElement("div");
    el.className = "workflow-stage";
    el.dataset.categories = stage.categories.join(",");
    el.innerHTML = `
      <div class="workflow-node">
        <span class="workflow-node-count">${count}</span>
      </div>
      <span class="workflow-node-label">${stage.label}</span>
    `;

    el.addEventListener("click", () => {
      const wasActive = el.classList.contains("active");
      document.querySelectorAll(".workflow-stage").forEach((s) => s.classList.remove("active"));

      if (!wasActive) {
        el.classList.add("active");
        window.dispatchEvent(
          new CustomEvent("gstack:filter-category", {
            detail: { categories: stage.categories },
          })
        );
      } else {
        window.dispatchEvent(
          new CustomEvent("gstack:filter-category", {
            detail: { categories: null },
          })
        );
      }
    });

    track.appendChild(el);
  });

  // Entrance animation — pulse each stage sequentially
  const stages = track.querySelectorAll(".workflow-stage");
  const arrows = track.querySelectorAll(".workflow-arrow");

  stages.forEach((stage, i) => {
    setTimeout(() => {
      const node = stage.querySelector(".workflow-node");
      node.style.transform = "scale(1.15)";
      node.style.borderColor = "var(--amber)";
      node.style.boxShadow = "0 0 20px rgba(245, 158, 11, 0.3)";

      if (i > 0) {
        arrows[i - 1].classList.add("animated");
      }

      setTimeout(() => {
        node.style.transform = "";
        node.style.borderColor = "";
        node.style.boxShadow = "";
      }, 400);
    }, 200 + i * 150);
  });
}
