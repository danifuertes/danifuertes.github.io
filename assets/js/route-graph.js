/* Animated multi-agent routing graph drawn in the sidebar banner.
   A few agents leave a depot, visit random nodes and return, leaving a trail.
   Respects prefers-reduced-motion (draws a static frame) and pauses when off screen. */
(function () {
  "use strict";

  var canvas = document.querySelector("[data-route-graph]");
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext("2d");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var NODE_COUNT = 26;
  var AGENT_COUNT = 3;
  var STOPS_PER_ROUTE = 5;
  var SPEED = 32; // px per second

  var width = 0, height = 0, nodes = [], depot = null, agents = [], colors = {};
  var running = false, visible = true, lastTime = 0;

  function readColors() {
    var style = getComputedStyle(document.documentElement);
    colors.node = style.getPropertyValue("--graph-node").trim();
    colors.edge = style.getPropertyValue("--graph-edge").trim();
    colors.agents = style.getPropertyValue("--graph-agents").split(",").map(function (c) { return c.trim(); });
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildGraph();
  }

  function buildGraph() {
    var pad = 10;
    nodes = [];
    for (var i = 0; i < NODE_COUNT; i++) {
      nodes.push({ x: pad + Math.random() * (width - 2 * pad), y: pad + Math.random() * (height - 2 * pad) });
    }
    // Keep the depot away from the area covered by the profile photo (bottom centre).
    depot = { x: width * (Math.random() < 0.5 ? 0.18 : 0.82), y: height * 0.42 };
    agents = [];
    for (var a = 0; a < AGENT_COUNT; a++) agents.push(newAgent(a));
  }

  function newAgent(index) {
    var stops = [];
    var pool = nodes.slice();
    for (var s = 0; s < STOPS_PER_ROUTE; s++) {
      stops.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }
    // Order stops by angle around the depot so routes look like plausible tours.
    stops.sort(function (p, q) {
      return Math.atan2(p.y - depot.y, p.x - depot.x) - Math.atan2(q.y - depot.y, q.x - depot.x);
    });
    return {
      color: index,
      route: [depot].concat(stops, [depot]),
      segment: 0,
      progress: 0,
      fade: 1,
      delay: index * 1.2
    };
  }

  function step(agent, dt) {
    if (agent.delay > 0) { agent.delay -= dt; return; }
    if (agent.segment >= agent.route.length - 1) {
      agent.fade -= dt * 0.6;
      if (agent.fade <= 0) Object.assign(agent, newAgent(agent.color), { delay: 0.4 });
      return;
    }
    var a = agent.route[agent.segment], b = agent.route[agent.segment + 1];
    var len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    agent.progress += (SPEED * dt) / len;
    if (agent.progress >= 1) { agent.progress = 0; agent.segment++; }
  }

  function position(agent) {
    var i = Math.min(agent.segment, agent.route.length - 2);
    var a = agent.route[i], b = agent.route[i + 1];
    var t = agent.segment >= agent.route.length - 1 ? 1 : agent.progress;
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // Faint proximity edges for a graph texture.
    ctx.strokeStyle = colors.edge;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var i = 0; i < nodes.length; i++) {
      for (var j = i + 1; j < nodes.length; j++) {
        if (Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y) < 62) {
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
        }
      }
    }
    ctx.stroke();

    ctx.fillStyle = colors.node;
    nodes.forEach(function (n) { ctx.beginPath(); ctx.arc(n.x, n.y, 1.8, 0, Math.PI * 2); ctx.fill(); });

    agents.forEach(function (agent) {
      if (agent.delay > 0) return;
      var color = colors.agents[agent.color % colors.agents.length];
      var pos = position(agent);

      ctx.globalAlpha = Math.max(agent.fade, 0);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(agent.route[0].x, agent.route[0].y);
      for (var s = 1; s <= agent.segment && s < agent.route.length; s++) ctx.lineTo(agent.route[s].x, agent.route[s].y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();

      ctx.fillStyle = color;
      for (var v = 1; v <= agent.segment && v < agent.route.length - 1; v++) {
        ctx.beginPath(); ctx.arc(agent.route[v].x, agent.route[v].y, 3, 0, Math.PI * 2); ctx.fill();
      }

      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(pos.x, pos.y, 3.2, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    });

    // Depot
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(depot.x - 4, depot.y - 4, 8, 8);
  }

  function frame(time) {
    if (!running) return;
    var dt = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    agents.forEach(function (a) { step(a, dt); });
    draw();
    requestAnimationFrame(frame);
  }

  function start() {
    if (running || reduceMotion || !visible || document.hidden) return;
    running = true;
    lastTime = performance.now();
    requestAnimationFrame(frame);
  }

  function stop() { running = false; }

  function drawStatic() {
    // Show every route complete, without animation.
    agents.forEach(function (a) { a.delay = 0; a.segment = a.route.length - 1; a.fade = 1; });
    draw();
  }

  readColors();
  resize();
  if (reduceMotion) drawStatic(); else start();

  window.addEventListener("resize", function () { resize(); if (reduceMotion) drawStatic(); });
  document.addEventListener("themechange", function () { readColors(); if (!running) draw(); });
  document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      visible ? start() : stop();
    }).observe(canvas);
  }
})();
