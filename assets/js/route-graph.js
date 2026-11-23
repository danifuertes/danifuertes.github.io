/* Animated min-max mTSP in the sidebar banner.
   Each cycle generates a random instance (evenly spread nodes, a depot), solves it with MinMaxMTSP
   (assets/js/mtsp.js) and animates the agents travelling their routes at the same speed, so a balanced
   solution shows as all agents returning to the depot at about the same time.
   Respects prefers-reduced-motion (draws the solved routes, no animation) and pauses when off screen. */
(function () {
  "use strict";

  const canvas = document.querySelector("[data-route-graph]");
  if (!canvas || !canvas.getContext || !window.MinMaxMTSP) return;

  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const NODE_COUNT = 20;
  const AGENT_COUNT = 4;
  const SPEED = 28;          // px per second
  const HOLD = 1.5;          // seconds showing the finished routes
  const FADE = 0.8;          // seconds fading out before the next instance
  const PHOTO_RADIUS = 66;   // keep nodes away from the profile photo (centred on the banner's bottom edge)

  let width = 0, height = 0, depot = null, nodes = [], agents = [], colors = {};
  let elapsed = 0, makespan = 0, running = false, visible = true, lastTime = 0;

  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  function readColors() {
    const style = getComputedStyle(document.documentElement);
    colors.node = style.getPropertyValue("--graph-node").trim();
    colors.agents = style.getPropertyValue("--graph-agents").split(",").map((c) => c.trim());
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    newInstance();
  }

  // Best-candidate sampling: each new node is the candidate farthest from the existing ones,
  // which spreads nodes evenly without a grid look.
  function sampleNodes() {
    const pad = 12, photo = { x: width / 2, y: height };
    const points = [depot];
    const allowed = (p) => dist(p, photo) > PHOTO_RADIUS;
    for (let tries = 0; points.length <= NODE_COUNT && tries < NODE_COUNT * 20; tries++) {
      let best = null, bestScore = -1;
      for (let c = 0; c < 15; c++) {
        const p = { x: pad + Math.random() * (width - 2 * pad), y: pad + Math.random() * (height - 2 * pad) };
        if (!allowed(p)) continue;
        const score = Math.min(...points.map((q) => dist(p, q)));
        if (score > bestScore) { best = p; bestScore = score; }
      }
      if (best) points.push(best);
    }
    return points.slice(1);
  }

  function newInstance() {
    depot = { x: width * (0.3 + Math.random() * 0.4), y: height * 0.25 };
    nodes = sampleNodes();
    const routes = window.MinMaxMTSP.solve(depot, nodes, AGENT_COUNT);

    agents = routes.filter((r) => r.length).map((route, i) => {
      const path = [depot, ...route, depot];
      const cumulative = [0];
      for (let s = 1; s < path.length; s++) cumulative.push(cumulative[s - 1] + dist(path[s - 1], path[s]));
      return { color: colors.agents[i % colors.agents.length], path, cumulative, length: cumulative[cumulative.length - 1] };
    });
    makespan = Math.max(...agents.map((a) => a.length));
    elapsed = 0;
  }

  // Position of an agent after travelling `d` px, and the index of the segment it is on.
  function locate(agent, d) {
    const { path, cumulative } = agent;
    if (d >= agent.length) return { pos: path[path.length - 1], segment: path.length - 1 };
    let s = 1;
    while (cumulative[s] < d) s++;
    const a = path[s - 1], b = path[s];
    const t = (d - cumulative[s - 1]) / (cumulative[s] - cumulative[s - 1] || 1);
    return { pos: { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }, segment: s - 1 };
  }

  function drawPath(points) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    const travelled = elapsed * SPEED;
    const fadeStart = makespan / SPEED + HOLD;
    ctx.globalAlpha = elapsed > fadeStart ? Math.max(0, 1 - (elapsed - fadeStart) / FADE) : 1;
    const alpha = ctx.globalAlpha;

    ctx.fillStyle = colors.node;
    nodes.forEach((n) => { ctx.beginPath(); ctx.arc(n.x, n.y, 1.8, 0, Math.PI * 2); ctx.fill(); });

    agents.forEach((agent) => {
      const { pos, segment } = locate(agent, travelled);

      // Planned route: faint dashed line.
      ctx.globalAlpha = alpha * 0.3;
      ctx.strokeStyle = agent.color;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      drawPath(agent.path);
      ctx.setLineDash([]);

      // Travelled part: solid trail and visited nodes.
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 1.6;
      drawPath([...agent.path.slice(0, segment + 1), pos]);
      ctx.fillStyle = agent.color;
      for (let v = 1; v <= segment && v < agent.path.length - 1; v++) {
        ctx.beginPath(); ctx.arc(agent.path[v].x, agent.path[v].y, 3, 0, Math.PI * 2); ctx.fill();
      }

      // Agent.
      ctx.shadowColor = agent.color;
      ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(pos.x, pos.y, 3.2, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    });

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(depot.x - 4, depot.y - 4, 8, 8);
    ctx.globalAlpha = 1;
  }

  function frame(time) {
    if (!running) return;
    elapsed += Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    if (elapsed > makespan / SPEED + HOLD + FADE) newInstance();
    draw();
    requestAnimationFrame(frame);
  }

  function start() {
    if (running || reduceMotion || !visible || document.hidden) return;
    running = true;
    lastTime = performance.now();
    requestAnimationFrame(frame);
  }

  const stop = () => { running = false; };

  function drawStatic() {
    elapsed = makespan / SPEED; // every route complete
    draw();
  }

  readColors();
  resize();
  if (reduceMotion) drawStatic(); else start();

  window.addEventListener("resize", () => { resize(); if (reduceMotion) drawStatic(); });
  document.addEventListener("themechange", () => {
    readColors();
    agents.forEach((a, i) => { a.color = colors.agents[i % colors.agents.length]; });
    if (!running) draw();
  });
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      visible ? start() : stop();
    }).observe(canvas);
  }
})();
