(function () {
  var canvas = document.getElementById("gd-canvas");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Seed the property with a valid fallback first. Browsers that reject
  // relative OKLCH leave that value intact instead of inheriting text color.
  function resolveWithAlpha(varName, alpha, fallback) {
    var probe = document.createElement("span");
    probe.style.color = fallback;
    probe.style.color = "oklch(from var(" + varName + ") l c h / " + alpha + ")";
    document.body.appendChild(probe);
    var computed = getComputedStyle(probe).color;
    document.body.removeChild(probe);
    return computed && computed !== "" ? computed : fallback;
  }

  function resolveHueShifted(varName, hueDelta, alpha, fallback) {
    var probe = document.createElement("span");
    probe.style.color = fallback;
    probe.style.color = "oklch(from var(" + varName + ") l c calc(h + " + hueDelta + ") / " + alpha + ")";
    document.body.appendChild(probe);
    var computed = getComputedStyle(probe).color;
    document.body.removeChild(probe);
    return computed && computed !== "" ? computed : fallback;
  }

  var strokeWire = resolveHueShifted("--color-accent", 55, 0.165, "rgba(190, 120, 255, 0.65)");
  var fillVertices = resolveWithAlpha("--color-accent", 0.5, "rgba(120, 150, 255, 0.9)");
  var strokePlane = resolveWithAlpha("--color-border", 0.28, "rgba(120, 130, 155, 0.28)");
  var fillPlane = resolveWithAlpha("--color-surface", 0.2, "rgba(30, 35, 48, 0.2)");

  var phi = (1 + Math.sqrt(5)) / 2;

  function createEdges(vertices) {
    var pairs = [];
    var minDistance = Infinity;
    for (var i = 0; i < vertices.length; i++) {
      for (var j = i + 1; j < vertices.length; j++) {
        var dx = vertices[i][0] - vertices[j][0];
        var dy = vertices[i][1] - vertices[j][1];
        var dz = vertices[i][2] - vertices[j][2];
        var distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        pairs.push([i, j, distance]);
        if (distance < minDistance) minDistance = distance;
      }
    }
    return pairs.filter(function (pair) {
      return pair[2] < minDistance * 1.01;
    }).map(function (pair) {
      return [pair[0], pair[1]];
    });
  }

  function createSolid(name, raw) {
    var radius = Math.sqrt(raw.reduce(function (sum, vertex) {
      return Math.max(sum, vertex[0] * vertex[0] + vertex[1] * vertex[1] + vertex[2] * vertex[2]);
    }, 0));
    var vertices = raw.map(function (vertex) {
      return [vertex[0] / radius, vertex[1] / radius, vertex[2] / radius];
    });
    return { name: name, vertices: vertices, edges: createEdges(vertices) };
  }

  var tetrahedron = [
    [1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1],
  ];
  var cube = [];
  [1, -1].forEach(function (sx) { [1, -1].forEach(function (sy) { [1, -1].forEach(function (sz) {
    cube.push([sx, sy, sz]);
  }); }); });
  var octahedron = [
    [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1],
  ];
  var icosahedron = [];
  [1, -1].forEach(function (sy) { [1, -1].forEach(function (sz) {
    icosahedron.push([0, sy, sz * phi]);
  }); });
  [1, -1].forEach(function (sx) { [1, -1].forEach(function (sy) {
    icosahedron.push([sx, sy * phi, 0]);
  }); });
  [1, -1].forEach(function (sx) { [1, -1].forEach(function (sz) {
    icosahedron.push([sx * phi, 0, sz]);
  }); });

  var dodecahedron = [];
  [1, -1].forEach(function (sx) { [1, -1].forEach(function (sy) { [1, -1].forEach(function (sz) {
    dodecahedron.push([sx, sy, sz]);
  }); }); });
  [1, -1].forEach(function (sy) { [1, -1].forEach(function (sz) {
    dodecahedron.push([0, sy / phi, sz * phi]);
  }); });
  [1, -1].forEach(function (sx) { [1, -1].forEach(function (sy) {
    dodecahedron.push([sx / phi, sy * phi, 0]);
  }); });
  [1, -1].forEach(function (sx) { [1, -1].forEach(function (sz) {
    dodecahedron.push([sx * phi, 0, sz / phi]);
  }); });

  // The five regular Platonic solids, normalized to the same unit sphere.
  var solids = [
    createSolid("tetrahedron", tetrahedron),
    createSolid("cube", cube),
    createSolid("octahedron", octahedron),
    createSolid("dodecahedron", dodecahedron),
    createSolid("icosahedron", icosahedron),
  ];

  var sceneObjects = [
    { solid: solids[0], position: [-5, -1.1, 0.8], phase: 0.2, speed: 0.82, motion: [0.8, 0.5, 0.6], seed: 11 },
    { solid: solids[1], position: [-2.5, 0.4, 0.35], phase: 1.7, speed: 1.16, motion: [0.7, 0.65, 0.8], seed: 23 },
    { solid: solids[2], position: [0, 1.1, 0], phase: 3.1, speed: 0.94, motion: [0.75, 0.55, 0.7], seed: 37 },
    { solid: solids[3], position: [2.5, 0.4, 0.35], phase: 4.4, speed: 1.28, motion: [0.65, 0.6, 0.75], seed: 41 },
    { solid: solids[4], position: [5, -1.1, 0.8], phase: 5.6, speed: 0.72, motion: [0.85, 0.5, 0.65], seed: 59 },
  ];

  var cameraPath = [
    [-9, -0.4, 6], [-6, -1, 3], [-3, 0.6, 2], [0, 1.3, 2],
    [3, 0.6, 2], [6, -1, 3], [9, -0.4, 6],
  ];
  var targetPath = [
    [-7, -0.7, 0.8], [-5, -1.1, 0.8], [-2.5, 0.4, 0.35], [0, 1.1, 0],
    [2.5, 0.4, 0.35], [5, -1.1, 0.8], [7, -0.7, 0.8],
  ];

  function rotX(v, angle) {
    var c = Math.cos(angle), s = Math.sin(angle);
    return [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c];
  }
  function rotY(v, angle) {
    var c = Math.cos(angle), s = Math.sin(angle);
    return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c];
  }
  function rotZ(v, angle) {
    var c = Math.cos(angle), s = Math.sin(angle);
    return [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]];
  }

  var FREQ_X = 2 * Math.PI / 37000;
  var FREQ_Y = 2 * Math.PI / 53000;
  var FREQ_Z = 2 * Math.PI / 71000;
  var AMP = Math.PI;
  var FRAME_INTERVAL_MS = 1000 / 30;
  var DOT_RADIUS = 1.25;

  var dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
  var w = 1, h = 1, cx = 0.5, cy = 0.5, focalLength = 1;

  function resize() {
    var rect = canvas.getBoundingClientRect();
    w = Math.max(1, rect.width || canvas.clientWidth || 1);
    h = Math.max(1, rect.height || canvas.clientHeight || 1);
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = w * 0.62;
    cy = h / 2;
    focalLength = Math.min(w, h) * 0.9;
  }

  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  function cross(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }

  function normalize(v) {
    var length = Math.sqrt(dot(v, v)) || 1;
    return [v[0] / length, v[1] / length, v[2] / length];
  }

  function splineAt(points, progress) {
    var wrappedProgress = ((progress % 1) + 1) % 1;
    var scaled = wrappedProgress * points.length;
    var index = Math.floor(scaled);
    var local = scaled - index;
    var p0 = points[(index - 1 + points.length) % points.length];
    var p1 = points[index % points.length];
    var p2 = points[(index + 1) % points.length];
    var p3 = points[(index + 2) % points.length];
    var local2 = local * local;
    var local3 = local2 * local;
    return [0, 1, 2].map(function (axis) {
      return 0.5 * (
        2 * p1[axis] +
        (-p0[axis] + p2[axis]) * local +
        (2 * p0[axis] - 5 * p1[axis] + 4 * p2[axis] - p3[axis]) * local2 +
        (-p0[axis] + 3 * p1[axis] - 3 * p2[axis] + p3[axis]) * local3
      );
    });
  }

  function cameraAt(t) {
    return splineAt(cameraPath, t * 0.000018);
  }

  function targetAt(t) {
    return splineAt(targetPath, t * 0.000018);
  }

  var trackedTarget = [0, 0, 0];
  var targetTime = null;

  function laggedTargetAt(t) {
    var desired = targetAt(t);
    if (targetTime === null) {
      trackedTarget = desired;
      targetTime = t;
      return trackedTarget;
    }

    var elapsed = Math.max(0, t - targetTime);
    var followRate = 1 - Math.exp(-elapsed / 320);
    trackedTarget = trackedTarget.map(function (value, index) {
      return value + (desired[index] - value) * followRate;
    });
    targetTime = t;
    return trackedTarget;
  }

  function createView(camera, target) {
    var forward = normalize([
      target[0] - camera[0],
      target[1] - camera[1],
      target[2] - camera[2],
    ]);
    var right = normalize(cross(forward, [0, 1, 0]));
    var up = cross(right, forward);
    return { camera: camera, right: right, up: up, forward: forward };
  }

  function project(v, view) {
    var relative = [
      v[0] - view.camera[0],
      v[1] - view.camera[1],
      v[2] - view.camera[2],
    ];
    var depth = dot(relative, view.forward);
    if (depth <= 0.1) return null;
    return [
      cx + dot(relative, view.right) * focalLength / depth,
      cy + dot(relative, view.up) * focalLength / depth,
    ];
  }

  function pseudoRandom(seed) {
    var value = Math.sin(seed * 12.9898) * 43758.5453;
    return value - Math.floor(value);
  }

  function randomWaypoint(sceneObject, segment) {
    var seed = sceneObject.seed + segment * 17;
    return [0, 1, 2].map(function (axis) {
      return (pseudoRandom(seed + axis * 31) * 2 - 1) * sceneObject.motion[axis];
    });
  }

  function smoothStep(value) {
    return value * value * (3 - 2 * value);
  }

  function randomOffsetAt(t, sceneObject) {
    var wanderTime = t * 0.000045 * sceneObject.speed;
    var segment = Math.floor(wanderTime);
    var progress = smoothStep(wanderTime - segment);
    var from = randomWaypoint(sceneObject, segment);
    var to = randomWaypoint(sceneObject, segment + 1);
    return from.map(function (value, axis) {
      return value + (to[axis] - value) * progress;
    });
  }

  function currentPositions(t, view, sceneObject) {
    var phase = sceneObject.phase;
    var speed = sceneObject.speed;
    var angleX = Math.sin(t * FREQ_X * speed + phase) * AMP;
    var angleY = Math.sin(t * FREQ_Y * speed + phase * 1.3) * AMP;
    var angleZ = Math.sin(t * FREQ_Z * speed + phase * 0.7) * AMP;
    var randomOffset = randomOffsetAt(t, sceneObject);
    var position = [
      sceneObject.position[0] + randomOffset[0],
      sceneObject.position[1] + randomOffset[1],
      sceneObject.position[2] + randomOffset[2],
    ];
    return sceneObject.solid.vertices.map(function (v) {
      var point = rotX(v, angleX);
      point = rotY(point, angleY);
      point = rotZ(point, angleZ);
      point = [
        point[0] + position[0],
        point[1] + position[1],
        point[2] + position[2],
      ];
      return project(point, view);
    });
  }

  function drawFloor(view) {
    var floorY = -1.25;
    var floorCorners = [
      [-14, floorY, -5],
      [14, floorY, -5],
      [14, floorY, 18],
      [-14, floorY, 18],
    ].map(function (point) { return project(point, view); });

    if (floorCorners.every(function (point) { return point; })) {
      ctx.fillStyle = fillPlane;
      ctx.beginPath();
      ctx.moveTo(floorCorners[0][0], floorCorners[0][1]);
      floorCorners.slice(1).forEach(function (point) {
        ctx.lineTo(point[0], point[1]);
      });
      ctx.closePath();
      ctx.fill();
    }

    ctx.strokeStyle = strokePlane;
    ctx.lineWidth = 1;
    for (var x = -14; x <= 14; x += 1) {
      drawFloorLine(view, [x, floorY, -5], [x, floorY, 18]);
    }
    for (var z = -5; z <= 18; z += 1) {
      drawFloorLine(view, [-14, floorY, z], [14, floorY, z]);
    }
  }

  function drawFloorLine(view, start, end) {
    var startPoint = project(start, view);
    var endPoint = project(end, view);
    if (!startPoint || !endPoint) return;
    ctx.beginPath();
    ctx.moveTo(startPoint[0], startPoint[1]);
    ctx.lineTo(endPoint[0], endPoint[1]);
    ctx.stroke();
  }

  function render(t) {
    var view = createView(cameraAt(t), laggedTargetAt(t));
    ctx.clearRect(0, 0, w, h);

    drawFloor(view);
    sceneObjects.forEach(function (sceneObject) {
      drawSolid(t, view, sceneObject);
    });
  }

  function drawSolid(t, view, sceneObject) {
    var positions = currentPositions(t, view, sceneObject);
    ctx.lineWidth = 1;
    ctx.lineCap = "round";
    ctx.strokeStyle = strokeWire;
    ctx.beginPath();
    sceneObject.solid.edges.forEach(function (edge) {
      if (!positions[edge[0]] || !positions[edge[1]]) return;
      ctx.moveTo(positions[edge[0]][0], positions[edge[0]][1]);
      ctx.lineTo(positions[edge[1]][0], positions[edge[1]][1]);
    });
    ctx.stroke();

    ctx.fillStyle = fillVertices;
    ctx.beginPath();
    positions.forEach(function (point) {
      if (!point) return;
      ctx.moveTo(point[0] + DOT_RADIUS, point[1]);
      ctx.arc(point[0], point[1], DOT_RADIUS, 0, Math.PI * 2);
    });
    ctx.fill();
  }

  resize();
  window.addEventListener("resize", function () {
    resize();
    if (reduceMotion) render(0);
  }, { passive: true });

  if (reduceMotion) {
    render(0);
    return;
  }

  var lastFrameAt = -Infinity;
  function frame(t) {
    requestAnimationFrame(frame);
    if (t - lastFrameAt < FRAME_INTERVAL_MS) return;
    lastFrameAt = t;
    render(t);
  }
  requestAnimationFrame(frame);
})();
