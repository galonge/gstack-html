// D3 force-directed skill graph

function initGraph(graphData, skills) {
  const container = document.querySelector(".graph-container");
  const svg = d3.select(".skill-graph");
  if (!container || svg.empty()) return;

  const width = container.clientWidth;
  const height = container.clientHeight;

  svg.attr("viewBox", [0, 0, width, height]);

  // Tooltip
  const tooltip = document.createElement("div");
  tooltip.className = "graph-tooltip";
  container.appendChild(tooltip);

  // Zoom controls
  const zoomControls = document.createElement("div");
  zoomControls.className = "graph-zoom-controls";
  zoomControls.innerHTML = `
    <button class="graph-zoom-btn" data-action="in">+</button>
    <button class="graph-zoom-btn" data-action="out">&minus;</button>
    <button class="graph-zoom-btn" data-action="reset">&#8634;</button>
  `;
  container.appendChild(zoomControls);

  // Category filters
  const filtersContainer = document.querySelector(".category-filters");
  if (filtersContainer) {
    const allChip = document.createElement("button");
    allChip.className = "category-chip active";
    allChip.textContent = "All";
    allChip.dataset.category = "all";
    filtersContainer.appendChild(allChip);

    for (const [name, info] of Object.entries(graphData.categories)) {
      if (info.count === 0) continue;
      const chip = document.createElement("button");
      chip.className = "category-chip";
      chip.style.setProperty("--cat-color", info.color);
      chip.dataset.category = name;
      chip.innerHTML = `<span class="category-chip-dot"></span>${name} <span style="opacity:0.5">${info.count}</span>`;
      filtersContainer.appendChild(chip);
    }
  }

  // Prepare data
  const nodes = graphData.nodes.map((n) => ({ ...n }));
  const links = graphData.edges.map((e) => ({
    source: e.source,
    target: e.target,
  }));

  const tierScale = (tier) => {
    if (!tier) return 16;
    return [0, 14, 18, 22, 28][tier] || 16;
  };

  // Arrow marker
  svg
    .append("defs")
    .append("marker")
    .attr("id", "arrowhead")
    .attr("viewBox", "0 0 10 6")
    .attr("refX", 10)
    .attr("refY", 3)
    .attr("markerWidth", 8)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M0,0L10,3L0,6")
    .attr("class", "graph-arrow");

  // Zoom behavior
  const zoom = d3
    .zoom()
    .scaleExtent([0.3, 4])
    .on("zoom", (event) => {
      g.attr("transform", event.transform);
    });

  svg.call(zoom);

  const g = svg.append("g");

  // Links
  const link = g
    .append("g")
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("class", "graph-link")
    .attr("marker-end", "url(#arrowhead)");

  // Nodes
  const node = g
    .append("g")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .attr("class", "graph-node")
    .call(
      d3
        .drag()
        .on("start", dragStarted)
        .on("drag", dragged)
        .on("end", dragEnded)
    );

  node
    .append("circle")
    .attr("r", (d) => tierScale(d.tier))
    .attr("fill", (d) => {
      const cat = graphData.categories[d.category];
      return cat ? cat.color + "20" : "#6B728020";
    })
    .attr("stroke", (d) => {
      const cat = graphData.categories[d.category];
      return cat ? cat.color : "#6B7280";
    })
    .style("--cat-color", (d) => {
      const cat = graphData.categories[d.category];
      return cat ? cat.color : "#6B7280";
    });

  node
    .append("text")
    .text((d) => d.name)
    .attr("dy", (d) => tierScale(d.tier) + 14);

  // Force simulation
  const simulation = d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3
        .forceLink(links)
        .id((d) => d.id)
        .distance(100)
    )
    .force("charge", d3.forceManyBody().strength(-200))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force(
      "collision",
      d3.forceCollide().radius((d) => tierScale(d.tier) + 12)
    )
    .force("x", d3.forceX(width / 2).strength(0.05))
    .force("y", d3.forceY(height / 2).strength(0.05))
    .alphaDecay(0.02);

  // Category clustering force
  const categoryPositions = {};
  const catNames = Object.keys(graphData.categories);
  catNames.forEach((name, i) => {
    const angle = (i / catNames.length) * Math.PI * 2;
    categoryPositions[name] = {
      x: width / 2 + Math.cos(angle) * (width * 0.25),
      y: height / 2 + Math.sin(angle) * (height * 0.25),
    };
  });

  simulation.force(
    "cluster",
    (alpha) => {
      for (const d of nodes) {
        const target = categoryPositions[d.category];
        if (target) {
          d.vx += (target.x - d.x) * alpha * 0.03;
          d.vy += (target.y - d.y) * alpha * 0.03;
        }
      }
    }
  );

  simulation.on("tick", () => {
    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => {
        const r = tierScale(
          nodes.find((n) => n.id === (d.target.id || d.target))?.tier
        );
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist > 0 ? d.target.x - (dx / dist) * (r + 4) : d.target.x;
      })
      .attr("y2", (d) => {
        const r = tierScale(
          nodes.find((n) => n.id === (d.target.id || d.target))?.tier
        );
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist > 0 ? d.target.y - (dy / dist) * (r + 4) : d.target.y;
      });

    node.attr("transform", (d) => `translate(${d.x},${d.y})`);
  });

  // Interactions
  node
    .on("mouseover", function (event, d) {
      const connectedIds = new Set();
      connectedIds.add(d.id);
      links.forEach((l) => {
        const sid = typeof l.source === "object" ? l.source.id : l.source;
        const tid = typeof l.target === "object" ? l.target.id : l.target;
        if (sid === d.id) connectedIds.add(tid);
        if (tid === d.id) connectedIds.add(sid);
      });

      node.classed("dimmed", (n) => !connectedIds.has(n.id));
      node.classed("highlighted", (n) => connectedIds.has(n.id));

      link.classed("dimmed", (l) => {
        const sid = typeof l.source === "object" ? l.source.id : l.source;
        const tid = typeof l.target === "object" ? l.target.id : l.target;
        return !(connectedIds.has(sid) && connectedIds.has(tid));
      });
      link.classed("highlighted", (l) => {
        const sid = typeof l.source === "object" ? l.source.id : l.source;
        const tid = typeof l.target === "object" ? l.target.id : l.target;
        return connectedIds.has(sid) && connectedIds.has(tid);
      });

      const skill = skills.find((s) => s.slug === d.id);
      tooltip.innerHTML = `
        <div class="graph-tooltip-name">${d.name}</div>
        <div class="graph-tooltip-desc">${escapeHtml(d.description)}</div>
        <div class="graph-tooltip-meta">${d.category} · tier ${d.tier || "—"} · v${d.version}</div>
      `;
      tooltip.classList.add("visible");

      const rect = container.getBoundingClientRect();
      tooltip.style.left =
        Math.min(event.clientX - rect.left + 12, rect.width - 300) + "px";
      tooltip.style.top = event.clientY - rect.top - 10 + "px";
    })
    .on("mousemove", function (event) {
      const rect = container.getBoundingClientRect();
      tooltip.style.left =
        Math.min(event.clientX - rect.left + 12, rect.width - 300) + "px";
      tooltip.style.top = event.clientY - rect.top - 10 + "px";
    })
    .on("mouseout", function () {
      node.classed("dimmed", false).classed("highlighted", false);
      link.classed("dimmed", false).classed("highlighted", false);
      tooltip.classList.remove("visible");
    })
    .on("click", function (event, d) {
      event.stopPropagation();
      if (typeof openDetailPanel === "function") {
        openDetailPanel(d.id);
      }
    });

  // Drag handlers
  function dragStarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
    tooltip.classList.remove("visible");
  }

  function dragEnded(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  // Zoom controls
  zoomControls.addEventListener("click", (e) => {
    const action = e.target.closest("[data-action]")?.dataset.action;
    if (!action) return;
    const t = d3.zoomTransform(svg.node());
    if (action === "in") svg.transition().duration(300).call(zoom.scaleBy, 1.5);
    if (action === "out") svg.transition().duration(300).call(zoom.scaleBy, 0.67);
    if (action === "reset")
      svg
        .transition()
        .duration(500)
        .call(zoom.transform, d3.zoomIdentity);
  });

  // Category filter clicks
  const filtersEl = document.querySelector(".category-filters");
  if (filtersEl) {
    filtersEl.addEventListener("click", (e) => {
      const chip = e.target.closest(".category-chip");
      if (!chip) return;

      const cat = chip.dataset.category;
      const wasActive = chip.classList.contains("active");

      filtersEl
        .querySelectorAll(".category-chip")
        .forEach((c) => c.classList.remove("active"));

      if (wasActive || cat === "all") {
        filtersEl.querySelector('[data-category="all"]').classList.add("active");
        node.classed("dimmed", false);
        link.classed("dimmed", false);
        filterCards(null);
      } else {
        chip.classList.add("active");
        node.classed("dimmed", (n) => n.category !== cat);
        link.classed("dimmed", (l) => {
          const s = typeof l.source === "object" ? l.source : nodes.find((n) => n.id === l.source);
          const t = typeof l.target === "object" ? l.target : nodes.find((n) => n.id === l.target);
          return s?.category !== cat && t?.category !== cat;
        });
        filterCards(cat);
      }
    });
  }

  // Listen to workflow stage clicks
  window.addEventListener("gstack:filter-category", (e) => {
    const cats = e.detail.categories;
    filtersEl
      ?.querySelectorAll(".category-chip")
      .forEach((c) => c.classList.remove("active"));

    if (!cats) {
      filtersEl?.querySelector('[data-category="all"]')?.classList.add("active");
      node.classed("dimmed", false);
      link.classed("dimmed", false);
      filterCards(null);
    } else {
      node.classed("dimmed", (n) => !cats.includes(n.category));
      link.classed("dimmed", (l) => {
        const s = typeof l.source === "object" ? l.source : nodes.find((n) => n.id === l.source);
        const t = typeof l.target === "object" ? l.target : nodes.find((n) => n.id === l.target);
        return !cats.includes(s?.category) && !cats.includes(t?.category);
      });
      filterCards(cats);
    }
  });

  function filterCards(catOrCats) {
    document.querySelectorAll(".skill-card").forEach((card) => {
      if (!catOrCats) {
        card.style.display = "";
        return;
      }
      const slug = card.dataset.slug;
      const nodeData = graphData.nodes.find((n) => n.id === slug);
      const cats = Array.isArray(catOrCats) ? catOrCats : [catOrCats];
      card.style.display =
        nodeData && cats.includes(nodeData.category) ? "" : "none";
    });
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // Responsive resize
  window.addEventListener("resize", () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    svg.attr("viewBox", [0, 0, w, h]);
    simulation.force("center", d3.forceCenter(w / 2, h / 2));
    simulation.force("x", d3.forceX(w / 2).strength(0.05));
    simulation.force("y", d3.forceY(h / 2).strength(0.05));
    simulation.alpha(0.3).restart();
  });
}
