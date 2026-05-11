// App orchestrator — initializes all modules after DOM ready

(function () {
  const skills = window.__SKILLS_DATA__;
  const graphData = window.__GRAPH_DATA__;

  function boot() {
    // Initialize particle background
    initParticles();

    // Initialize workflow pipeline
    if (typeof initWorkflow === "function") {
      initWorkflow(graphData);
    }

    // Initialize D3 graph
    if (typeof initGraph === "function") {
      initGraph(graphData, skills);
    }

    // Initialize detail panel
    if (typeof initDetailPanel === "function") {
      initDetailPanel(skills, graphData);
    }

    // Initialize search
    if (typeof initSearch === "function") {
      initSearch(skills);
    }

    // View toggle
    initViewToggle();

    // Format build date
    const timeEl = document.querySelector(".footer-updated time");
    if (timeEl) {
      const d = new Date(timeEl.textContent);
      timeEl.textContent = d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  function initViewToggle() {
    const toggleBtn = document.querySelector(".view-toggle-btn");
    const graphContainer = document.querySelector(".graph-container");
    const cardsContainer = document.querySelector(".cards-container");
    const headerToggle = document.querySelector(".header-nav .view-toggle");

    if (!toggleBtn || !graphContainer || !cardsContainer) return;

    const stored = localStorage.getItem("gstack-view") || "graph";
    setView(stored);

    toggleBtn.addEventListener("click", () => {
      const current = toggleBtn.dataset.current;
      setView(current === "graph" ? "cards" : "graph");
    });

    if (headerToggle) {
      headerToggle.addEventListener("click", () => {
        const current = toggleBtn.dataset.current;
        setView(current === "graph" ? "cards" : "graph");
      });
    }

    function setView(view) {
      toggleBtn.dataset.current = view;
      localStorage.setItem("gstack-view", view);

      const graphLabel = toggleBtn.querySelector(".toggle-graph");
      const cardsLabel = toggleBtn.querySelector(".toggle-cards");

      if (view === "graph") {
        graphContainer.hidden = false;
        cardsContainer.hidden = true;
        graphLabel.classList.add("active");
        cardsLabel.classList.remove("active");
        if (headerToggle) headerToggle.querySelector(".view-toggle-label").textContent = "Cards";
      } else {
        graphContainer.hidden = true;
        cardsContainer.hidden = false;
        graphLabel.classList.remove("active");
        cardsLabel.classList.add("active");
        if (headerToggle) headerToggle.querySelector(".view-toggle-label").textContent = "Graph";
        renderCards();
      }
    }

    function renderCards() {
      const grid = document.querySelector(".cards-grid");
      if (!grid || grid.children.length > 0) return;

      const categories = graphData.categories;

      skills.forEach((skill) => {
        const node = graphData.nodes.find((n) => n.id === skill.slug);
        const cat = node ? node.category : "Utilities";
        const catColor = categories[cat]?.color || "#6B7280";

        const card = document.createElement("div");
        card.className = "skill-card";
        card.style.setProperty("--cat-color", catColor);
        card.dataset.slug = skill.slug;

        card.innerHTML = `
          <div class="skill-card-header">
            <span class="skill-card-name">${skill.name}</span>
            ${skill.preambleTier ? `<span class="skill-card-tier">tier ${skill.preambleTier}</span>` : ""}
          </div>
          <div class="skill-card-desc">${escapeHtml(skill.description)}</div>
          <div class="skill-card-triggers">
            ${skill.triggers
              .slice(0, 3)
              .map((t) => `<span class="trigger-tag">${escapeHtml(t)}</span>`)
              .join("")}
          </div>
        `;

        card.addEventListener("click", () => {
          if (typeof openDetailPanel === "function") {
            openDetailPanel(skill.slug);
          }
        });

        grid.appendChild(card);
      });
    }
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // Particle background
  function initParticles() {
    const canvas = document.querySelector(".particle-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    resize();

    const particles = [];
    const count = 60;
    const rect = canvas.parentElement.getBoundingClientRect();

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 2 + 1,
      });
    }

    function draw() {
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      // Draw connections
      ctx.strokeStyle = "rgba(245, 158, 11, 0.06)";
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(245, 158, 11, 0.25)";
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }

      requestAnimationFrame(draw);
    }
    draw();

    window.addEventListener("resize", resize);
  }
})();
