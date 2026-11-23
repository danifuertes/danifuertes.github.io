/* Min-max multiple TSP (mTSP) heuristic.
   m agents start and end at a shared depot; every node is visited by exactly one agent;
   the goal is to minimise the length of the LONGEST route (i.e. the time until all agents are back).

   1. Construction: min-max cheapest insertion. Nodes are inserted one by one (farthest from the depot
      first) at the position, in any route, that keeps the longest route shortest; ties go to the
      cheapest insertion.
   2. Improvement, repeated until no move helps:
      - 2-opt inside each route (removes crossings),
      - relocate a node from the longest route into another route, or
      - swap a node of the longest route with a node of another route,
      whenever that lowers the maximum route length.
   3. Multi-start: steps 1-2 are repeated from randomised insertion orders and the best solution is kept.

   Points are {x, y} objects. Returns an array of m routes, each an ordered array of points (depot excluded). */
(function (root) {
  "use strict";

  const EPS = 1e-9;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  function routeLength(depot, route) {
    let length = 0, prev = depot;
    for (const p of route) { length += dist(prev, p); prev = p; }
    return length + dist(prev, depot);
  }

  // Cheapest position to insert p into route: { index, delta }.
  function bestInsertion(depot, route, p) {
    let best = { index: 0, delta: Infinity };
    for (let i = 0; i <= route.length; i++) {
      const prev = i === 0 ? depot : route[i - 1];
      const next = i === route.length ? depot : route[i];
      const delta = dist(prev, p) + dist(p, next) - dist(prev, next);
      if (delta < best.delta) best = { index: i, delta };
    }
    return best;
  }

  function construct(depot, order, m) {
    const routes = Array.from({ length: m }, () => []);
    const lengths = new Array(m).fill(0);

    for (const p of order) {
      let best = null;
      routes.forEach((route, k) => {
        const { index, delta } = bestInsertion(depot, route, p);
        const maxLen = Math.max(lengths[k] + delta, ...lengths.filter((_, j) => j !== k));
        if (!best || maxLen < best.maxLen - EPS || (Math.abs(maxLen - best.maxLen) <= EPS && delta < best.delta)) {
          best = { k, index, delta, maxLen };
        }
      });
      routes[best.k].splice(best.index, 0, p);
      lengths[best.k] += best.delta;
    }
    return routes;
  }

  function twoOpt(depot, route) {
    const path = [depot, ...route, depot];
    let improved = true;
    while (improved) {
      improved = false;
      for (let i = 1; i < path.length - 2; i++) {
        for (let j = i + 1; j < path.length - 1; j++) {
          const gain = dist(path[i - 1], path[j]) + dist(path[i], path[j + 1])
                     - dist(path[i - 1], path[i]) - dist(path[j], path[j + 1]);
          if (gain < -EPS) {
            path.splice(i, j - i + 1, ...path.slice(i, j + 1).reverse());
            improved = true;
          }
        }
      }
    }
    return path.slice(1, -1);
  }

  // Apply the first relocate or swap move that lowers the maximum route length. Returns true if one was applied.
  function improveLongest(depot, routes) {
    const lengths = routes.map((r) => routeLength(depot, r));
    const longest = lengths.indexOf(Math.max(...lengths));
    const currentMax = lengths[longest];

    for (let i = 0; i < routes[longest].length; i++) {
      const p = routes[longest][i];
      const shortened = routes[longest].filter((_, j) => j !== i);
      const shortenedLen = routeLength(depot, shortened);

      for (let k = 0; k < routes.length; k++) {
        if (k === longest) continue;
        const { index, delta } = bestInsertion(depot, routes[k], p);
        const others = lengths.filter((_, j) => j !== k && j !== longest);
        const newMax = Math.max(shortenedLen, lengths[k] + delta, ...others);
        if (newMax < currentMax - EPS) {
          routes[longest] = twoOpt(depot, shortened);
          routes[k].splice(index, 0, p);
          routes[k] = twoOpt(depot, routes[k]);
          return true;
        }

        // Swap p with each node q of route k, re-inserting both at their cheapest positions.
        for (let j = 0; j < routes[k].length; j++) {
          const q = routes[k][j];
          const a = shortened.slice(), b = routes[k].filter((_, t) => t !== j);
          const ia = bestInsertion(depot, a, q), ib = bestInsertion(depot, b, p);
          a.splice(ia.index, 0, q);
          b.splice(ib.index, 0, p);
          const lenA = routeLength(depot, a), lenB = routeLength(depot, b);
          if (Math.max(lenA, lenB, ...others) < currentMax - EPS) {
            routes[longest] = twoOpt(depot, a);
            routes[k] = twoOpt(depot, b);
            return true;
          }
        }
      }
    }
    return false;
  }

  const maxLength = (depot, routes) => Math.max(...routes.map((r) => routeLength(depot, r)));

  function solveFrom(depot, order, m) {
    const routes = construct(depot, order, m).map((r) => twoOpt(depot, r));
    for (let iter = 0; iter < 200 && improveLongest(depot, routes); iter++);
    return routes;
  }

  function solveMinMaxMTSP(depot, nodes, m, restarts = 30) {
    const farthestFirst = nodes.slice().sort((a, b) => dist(depot, b) - dist(depot, a));
    let best = solveFrom(depot, farthestFirst, m);
    for (let r = 0; r < restarts; r++) {
      const order = nodes.slice().sort(() => Math.random() - 0.5);
      const routes = solveFrom(depot, order, m);
      if (maxLength(depot, routes) < maxLength(depot, best) - EPS) best = routes;
    }
    return best;
  }

  root.MinMaxMTSP = { solve: solveMinMaxMTSP, routeLength };
})(typeof module !== "undefined" ? module.exports : window);
