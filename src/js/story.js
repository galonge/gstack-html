// Story view — scrollytelling explainer for gstack

function initStory(skills, graphData) {
  const root = document.querySelector(".view-story");
  if (!root) return;

  const skillBySlug = Object.fromEntries(skills.map((s) => [s.slug, s]));

  const STORY = [
    {
      num: "01",
      title: "Between idea and ship lies a chasm",
      prose: `<p>Every feature begins with a question and ends with a deploy. In between: planning, design, code, review, tests, merges, monitoring, follow-ups.</p><p>Most engineers cross this chasm alone. <strong>gstack</strong> hands you a team of specialists.</p>`,
      skills: [],
      terminal: [
        { type: "dim", text: "# you have an idea." },
        { type: "dim", text: "# now what?" },
        { type: "prompt", text: "" },
      ],
    },
    {
      num: "02",
      title: "Enter gstack",
      prose: `<p>A CLI tool by <strong>Garry Tan</strong> that turns Claude Code into a virtual engineering team.</p><p>46 specialized skills. Each one a domain expert. They share context, talk to each other, and follow a real engineering workflow.</p>`,
      skills: [],
      terminal: [
        { type: "prompt", text: "gstack --version" },
        { type: "output", text: "gstack v1.32.0.0" },
        { type: "output", text: "46 skills loaded across 9 categories" },
        { type: "success", text: "✓ ready" },
        { type: "prompt", text: "" },
      ],
    },
    {
      num: "03",
      title: "It starts with a question",
      prose: `<p>Before you write a line of code, <code>/office-hours</code> walks you through six forcing questions from YC office hours: demand evidence, status quo, narrowest wedge, observation, desperate specificity, future fit.</p><p>If your idea survives the questions, it's worth building.</p>`,
      skills: ["office-hours"],
      terminal: [
        { type: "prompt", text: "/office-hours" },
        { type: "skill", text: "office-hours · session started" },
        { type: "output", text: "Q1: What's the demand evidence?" },
        { type: "output", text: "Q2: Who currently does this manually?" },
        { type: "output", text: "Q3: What's the narrowest wedge?" },
        { type: "output", text: "Q4: What have you observed?" },
        { type: "output", text: "Q5: What's the desperate specific?" },
        { type: "output", text: "Q6: How does this compound over time?" },
        { type: "success", text: "✓ design doc saved" },
      ],
    },
    {
      num: "04",
      title: "Pressure-test the plan",
      prose: `<p>One <code>/autoplan</code> runs four parallel reviews on your proposal: <code>/plan-ceo-review</code> for product viability, <code>/plan-eng-review</code> for architecture, <code>/plan-design-review</code> for UX excellence, <code>/plan-devex-review</code> for developer friction.</p><p>The plan that survives is the one worth executing.</p>`,
      skills: ["autoplan", "plan-ceo-review", "plan-eng-review", "plan-design-review", "plan-devex-review"],
      terminal: [
        { type: "prompt", text: "/autoplan" },
        { type: "skill", text: "autoplan · dispatching 4 reviewers" },
        { type: "output", text: "  ⟶ /plan-ceo-review     [running]" },
        { type: "output", text: "  ⟶ /plan-eng-review     [running]" },
        { type: "output", text: "  ⟶ /plan-design-review  [running]" },
        { type: "output", text: "  ⟶ /plan-devex-review   [running]" },
        { type: "success", text: "✓ 4 reviews complete · 23 findings · 7 decided automatically" },
      ],
    },
    {
      num: "05",
      title: "Design before code",
      prose: `<p><code>/design-shotgun</code> generates multiple visual variants so you compare options before committing. <code>/design-html</code> outputs production-ready HTML/CSS.</p><p>By the time you write code, the design is settled.</p>`,
      skills: ["design-consultation", "design-shotgun", "design-html", "design-review"],
      terminal: [
        { type: "prompt", text: "/design-shotgun dashboard-redesign" },
        { type: "skill", text: "design-shotgun · generating 5 variants" },
        { type: "output", text: "  ▸ variant-1.html  (industrial)" },
        { type: "output", text: "  ▸ variant-2.html  (editorial)" },
        { type: "output", text: "  ▸ variant-3.html  (data-dense)" },
        { type: "output", text: "  ▸ variant-4.html  (warm-minimal)" },
        { type: "output", text: "  ▸ variant-5.html  (technical)" },
        { type: "success", text: "✓ pick a direction → /design-html" },
      ],
    },
    {
      num: "06",
      title: "Build with guardrails",
      prose: `<p><code>/careful</code> warns before destructive commands like <code>rm -rf</code>, <code>DROP TABLE</code>, force-push. <code>/freeze</code> locks down a directory so it can't be edited. <code>/guard</code> turns both on at once.</p><p>You can move fast because the brakes work.</p>`,
      skills: ["careful", "freeze", "unfreeze", "guard"],
      terminal: [
        { type: "prompt", text: "/guard" },
        { type: "success", text: "✓ destructive command warnings ON" },
        { type: "success", text: "✓ migrations/ frozen" },
        { type: "prompt", text: "rm -rf node_modules" },
        { type: "warning", text: "⚠ careful · this is destructive" },
        { type: "warning", text: "  proceed? [y/N]" },
      ],
    },
    {
      num: "07",
      title: "Browse, don't guess",
      prose: `<p><code>/browse</code> drives a real headless Chromium daemon — 100ms per command — so Claude can actually see your app, click buttons, take screenshots, and verify behavior.</p><p>No more guessing if the change worked.</p>`,
      skills: ["browse", "open-gstack-browser"],
      terminal: [
        { type: "prompt", text: '/browse "go to localhost:3000 and click signup"' },
        { type: "skill", text: "browse · navigating..." },
        { type: "output", text: "  ▸ page loaded (213ms)" },
        { type: "output", text: "  ▸ clicked button[data-action=signup]" },
        { type: "output", text: "  ▸ modal opened" },
        { type: "output", text: "  ▸ screenshot saved → .gstack/screenshots/signup-modal.png" },
        { type: "success", text: "✓ verified" },
      ],
    },
    {
      num: "08",
      title: "Test like you mean it",
      prose: `<p><code>/qa</code> runs through your golden path AND edge cases iteratively, finds bugs, files reports with screenshots, fixes them, retests.</p><p>The result: a feature that actually works.</p>`,
      skills: ["qa", "qa-only", "investigate"],
      terminal: [
        { type: "prompt", text: "/qa signup flow" },
        { type: "skill", text: "qa · session started" },
        { type: "output", text: "  ✓ happy path: email + password → dashboard" },
        { type: "error", text: "  ✗ bug: blank email submits silently" },
        { type: "warning", text: "  → root cause: missing aria-required validation" },
        { type: "success", text: "  ✓ fixed · retested · 0 regressions" },
        { type: "success", text: "✓ 7 paths tested · 1 bug found and fixed" },
      ],
    },
    {
      num: "09",
      title: "Review with specialists",
      prose: `<p><code>/review</code> dispatches specialist subagents in parallel on your diff: security, performance, SQL safety, LLM trust boundaries, conditional side effects, structural issues.</p><p>Each subagent runs in a fresh context and reports only what's relevant. Mechanical fixes auto-apply.</p>`,
      skills: ["review", "cso", "codex"],
      terminal: [
        { type: "prompt", text: "/review" },
        { type: "skill", text: "review · dispatching specialists" },
        { type: "output", text: "  ⟶ security      · 0 findings" },
        { type: "output", text: "  ⟶ performance   · 1 finding (N+1 in /users)" },
        { type: "output", text: "  ⟶ sql-safety    · 0 findings" },
        { type: "output", text: "  ⟶ llm-trust     · 1 finding (user-tainted prompt)" },
        { type: "output", text: "  ⟶ structure     · auto-fixed 4 mechanical issues" },
        { type: "success", text: "✓ 2 findings to review · 4 auto-applied" },
      ],
    },
    {
      num: "10",
      title: "Ship with a story",
      prose: `<p><code>/ship</code> runs the full deployment gauntlet: merge base branch, run tests, verify plan completion, bump <code>VERSION</code>, generate <code>CHANGELOG</code>, push, open a PR with the whole story laid out.</p><p>Then <code>/land-and-deploy</code> watches the PR through CI and merges when green.</p>`,
      skills: ["ship", "land-and-deploy", "document-release"],
      terminal: [
        { type: "prompt", text: "/ship" },
        { type: "skill", text: "ship · running gauntlet" },
        { type: "output", text: "  ✓ base branch merged" },
        { type: "output", text: "  ✓ tests · 248 passing" },
        { type: "output", text: "  ✓ plan items complete · 12/12" },
        { type: "output", text: "  ✓ VERSION 1.4.7.0 → 1.4.8.0" },
        { type: "output", text: "  ✓ CHANGELOG generated" },
        { type: "success", text: "✓ PR #847 opened · https://github.com/.../847" },
      ],
    },
    {
      num: "11",
      title: "Watch after launch",
      prose: `<p><code>/canary</code> monitors the live deployment for console errors, page failures, performance regressions, broken links.</p><p>If anything degrades, you find out fast — before users do.</p>`,
      skills: ["canary", "landing-report", "health"],
      terminal: [
        { type: "prompt", text: "/canary 30m" },
        { type: "skill", text: "canary · watching production" },
        { type: "output", text: "  ▸ /dashboard       · ✓ 200ms p95" },
        { type: "output", text: "  ▸ /pricing         · ✓ 184ms p95" },
        { type: "output", text: "  ▸ /signup          · ✓ 0 errors" },
        { type: "output", text: "  ▸ console errors   · 0" },
        { type: "success", text: "✓ 30 min clean · deploy looks healthy" },
      ],
    },
    {
      num: "12",
      title: "Reflect, then go again",
      prose: `<p><code>/retro</code> captures what shipped, what worked, what stumbled. <code>/learn</code> persists patterns across sessions so the team gets smarter every cycle.</p><p>This is gstack. 46 skills. 9 stages. One engineering team that lives in your terminal.</p>`,
      skills: ["retro", "learn", "context-save", "benchmark"],
      terminal: [
        { type: "prompt", text: "/retro --week" },
        { type: "skill", text: "retro · weekly digest" },
        { type: "output", text: "  shipped:       11 features" },
        { type: "output", text: "  reviewed:      28 PRs" },
        { type: "output", text: "  patterns:      4 new (saved → /learn)" },
        { type: "output", text: "  velocity:      +18% vs last week" },
        { type: "success", text: "✓ go again." },
      ],
    },
  ];

  // === Build hero ===
  const hero = document.createElement("div");
  hero.className = "story-hero";
  hero.innerHTML = `
    <div class="story-hero-bg"><canvas></canvas></div>
    <div class="story-hero-content">
      <div class="story-hero-eyebrow">A visual guide to gstack</div>
      <h1 class="story-hero-title">gstack<span class="cursor">_</span></h1>
      <p class="story-hero-sub">An engineering team in your terminal. 46 skills that handle the work between an idea and a shipped product.</p>
      <div class="story-hero-meta">
        <span class="story-hero-badge">v${graphData.meta.version}</span>
        <span>${skills.length} skills</span>
        <span>·</span>
        <span>by Garry Tan</span>
      </div>
      <div class="story-hero-cta">
        <div class="story-scroll-hint">Scroll to begin</div>
        <div class="story-scroll-arrow">↓</div>
      </div>
    </div>
  `;
  root.appendChild(hero);

  // === Build scrolly sections ===
  const scrolly = document.createElement("div");
  scrolly.className = "story-scrolly";

  STORY.forEach((section, i) => {
    const el = document.createElement("section");
    el.className = "story-section";
    el.dataset.idx = i;
    el.innerHTML = `
      <div class="story-section-content">
        <div class="story-section-num"><span>${section.num}</span> / ${String(STORY.length).padStart(2, "0")}</div>
        <h2 class="story-section-title">${section.title}</h2>
        <div class="story-section-prose">${section.prose}</div>
        ${
          section.skills.length > 0
            ? `<div class="story-section-skills">${section.skills
                .map(
                  (s) =>
                    `<span class="story-skill-chip" data-slug="${s}">${escapeHtml(s)}</span>`
                )
                .join("")}</div>`
            : ""
        }
      </div>
      <div class="story-section-visual">
        <div class="story-terminal">
          <div class="story-terminal-bar">
            <div class="story-terminal-dot"></div>
            <div class="story-terminal-dot"></div>
            <div class="story-terminal-dot"></div>
            <div class="story-terminal-title">~/project · zsh</div>
          </div>
          <div class="story-terminal-body" data-terminal="${i}"></div>
        </div>
      </div>
    `;
    scrolly.appendChild(el);
  });

  // === Finale ===
  const finale = document.createElement("section");
  finale.className = "story-finale";
  finale.innerHTML = `
    <div class="story-finale-eyebrow">end of walkthrough</div>
    <h2 class="story-finale-title">Now <span class="amber">explore freely.</span></h2>
    <p class="story-finale-sub">Every skill, every workflow, every detail — at your fingertips.</p>
    <div class="story-finale-cta">
      <button class="story-finale-btn primary" data-go="flow">
        <div class="story-finale-btn-name">The Flow →</div>
        <div class="story-finale-btn-desc">workflow-first map</div>
      </button>
      <button class="story-finale-btn" data-go="atlas">
        <div class="story-finale-btn-name">The Atlas →</div>
        <div class="story-finale-btn-desc">full skill reference</div>
      </button>
    </div>
  `;
  scrolly.appendChild(finale);

  root.appendChild(scrolly);

  // === Wire up interactions ===
  finale.querySelectorAll("[data-go]").forEach((btn) => {
    btn.addEventListener("click", () => {
      window.gstackNavigate(btn.dataset.go);
    });
  });

  // Skill chips → Atlas
  root.querySelectorAll(".story-skill-chip[data-slug]").forEach((chip) => {
    chip.addEventListener("click", () => {
      window.gstackNavigate("atlas", chip.dataset.slug);
    });
  });

  // === Particle background on hero ===
  initParticles(hero.querySelector("canvas"));

  // === Intersection observer for section activation + terminal animation ===
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
          const idx = parseInt(entry.target.dataset.idx, 10);
          animateTerminal(idx);
        }
      });
    },
    { threshold: 0.4 }
  );

  scrolly.querySelectorAll(".story-section").forEach((s) => observer.observe(s));

  const animatedTerminals = new Set();

  function animateTerminal(idx) {
    if (animatedTerminals.has(idx)) return;
    animatedTerminals.add(idx);

    const body = root.querySelector(`[data-terminal="${idx}"]`);
    if (!body) return;

    const lines = STORY[idx].terminal;
    body.innerHTML = "";

    lines.forEach((line, i) => {
      setTimeout(() => {
        const lineEl = document.createElement("div");
        lineEl.className = `story-terminal-line ${line.type}`;
        lineEl.textContent = line.text;
        body.appendChild(lineEl);
        body.scrollTop = body.scrollHeight;
      }, i * 220);
    });

    // Add blinking cursor on the final line
    setTimeout(() => {
      const cursor = document.createElement("span");
      cursor.className = "story-terminal-cursor";
      body.appendChild(cursor);
    }, lines.length * 220 + 100);
  }

  // Hide footer on Story (it shows at finale)
  // (No-op — footer is fine to show below story)

  function escapeHtml(str) {
    if (str == null) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function initParticles(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      ctx.scale(dpr, dpr);
    }
    resize();

    const rect = canvas.parentElement.getBoundingClientRect();
    const particles = [];
    const count = 80;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        r: Math.random() * 1.6 + 0.6,
      });
    }

    function draw() {
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = "rgba(245, 158, 11, 0.05)";
      ctx.lineWidth = 0.6;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 140) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(245, 158, 11, 0.2)";
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      requestAnimationFrame(draw);
    }
    draw();

    window.addEventListener("resize", () => {
      resize();
      const r2 = canvas.parentElement.getBoundingClientRect();
      rect.width = r2.width;
      rect.height = r2.height;
    });
  }
}
