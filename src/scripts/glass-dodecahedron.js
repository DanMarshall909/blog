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
  var solidStrokes = [
    resolveWithAlpha("--jetbrains-violet", 0.58, strokeWire),
    resolveWithAlpha("--jetbrains-orange", 0.58, strokeWire),
    resolveWithAlpha("--jetbrains-cyan", 0.58, strokeWire),
    strokeWire,
    resolveWithAlpha("--jetbrains-violet", 0.42, strokeWire),
  ];
  var solidFills = [
    resolveWithAlpha("--jetbrains-violet", 0.46, fillVertices),
    resolveWithAlpha("--jetbrains-orange", 0.46, fillVertices),
    resolveWithAlpha("--jetbrains-cyan", 0.46, fillVertices),
    fillVertices,
    resolveWithAlpha("--jetbrains-violet", 0.34, fillVertices),
  ];

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

  function createFaces(vertices) {
    var planes = {};
    var epsilon = 0.0001;
    for (var i = 0; i < vertices.length; i++) {
      for (var j = i + 1; j < vertices.length; j++) {
        for (var k = j + 1; k < vertices.length; k++) {
          var a = vertices[i], b = vertices[j], c = vertices[k];
          var normal = normalize(cross([
            b[0] - a[0], b[1] - a[1], b[2] - a[2],
          ], [
            c[0] - a[0], c[1] - a[1], c[2] - a[2],
          ]));
          if (dot(normal, normal) < epsilon) continue;
          var firstSign = normal.find(function (value) { return Math.abs(value) > epsilon; });
          if (firstSign < 0) normal = normal.map(function (value) { return -value; });
          var distance = dot(normal, a);
          var isHull = vertices.every(function (vertex) {
            return dot(normal, vertex) <= distance + epsilon;
          });
          if (!isHull) continue;
          var indices = vertices.map(function (vertex, index) {
            return Math.abs(dot(normal, vertex) - distance) < epsilon ? index : -1;
          }).filter(function (index) { return index >= 0; });
          var key = normal.map(function (value) { return value.toFixed(4); }).join(",") + ":" + distance.toFixed(4);
          planes[key] = { normal: normal, indices: indices };
        }
      }
    }

    return Object.keys(planes).map(function (key) {
      var face = planes[key];
      var center = face.indices.reduce(function (sum, index) {
        return [sum[0] + vertices[index][0], sum[1] + vertices[index][1], sum[2] + vertices[index][2]];
      }, [0, 0, 0]).map(function (value) { return value / face.indices.length; });
      var axis = Math.abs(face.normal[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
      var right = normalize(cross(axis, face.normal));
      var up = cross(face.normal, right);
      return face.indices.sort(function (left, rightIndex) {
        var leftVector = [vertices[left][0] - center[0], vertices[left][1] - center[1], vertices[left][2] - center[2]];
        var rightVector = [vertices[rightIndex][0] - center[0], vertices[rightIndex][1] - center[1], vertices[rightIndex][2] - center[2]];
        return Math.atan2(dot(leftVector, up), dot(leftVector, right)) - Math.atan2(dot(rightVector, up), dot(rightVector, right));
      });
    });
  }

  function createSolid(name, raw) {
    var radius = Math.sqrt(raw.reduce(function (sum, vertex) {
      return Math.max(sum, vertex[0] * vertex[0] + vertex[1] * vertex[1] + vertex[2] * vertex[2]);
    }, 0));
    var vertices = raw.map(function (vertex) {
      return [vertex[0] / radius, vertex[1] / radius, vertex[2] / radius];
    });
    return { name: name, vertices: vertices, edges: createEdges(vertices), faces: createFaces(vertices) };
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
    { solid: solids[0], position: [-6, -1.5, 1.6], phase: 0.2, speed: 0.82, motion: [1.8, 1.2, 1.5], seed: 11 },
    { solid: solids[1], position: [-2.8, 1.4, -1.1], phase: 1.7, speed: 1.16, motion: [1.4, 1.7, 1.2], seed: 23 },
    { solid: solids[2], position: [0.2, -0.4, 1.4], phase: 3.1, speed: 0.94, motion: [1.6, 1.1, 1.8], seed: 37 },
    { solid: solids[3], position: [3.2, 1.2, -1.3], phase: 4.4, speed: 1.28, motion: [1.3, 1.5, 1.6], seed: 41 },
    { solid: solids[4], position: [6.2, -1.2, 0.4], phase: 5.6, speed: 0.72, motion: [1.9, 1.3, 1.4], seed: 59 },
  ];

  var cameraPath = [
    [-9, -0.4, 6], [-6, -1, 3], [-3, 0.6, 2], [0, 1.3, 2],
    [3, 0.6, 2], [6, -1, 3], [9, -0.4, 6],
  ];
  var targetPath = [
    [-8, -1.2, 1.6], [-6, -1.5, 1.6], [-2.8, 1.4, -1.1], [0.2, -0.4, 1.4],
    [3.2, 1.2, -1.3], [6.2, -1.2, 0.4], [8, -0.8, 0.5],
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
  var ANIMATION_SPEED = 2.2;
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
      depth,
    ];
  }

  function depthVisibility(depth) {
    return Math.max(0.08, Math.min(1, 1.08 - depth / 13));
  }

  function lightAt(t) {
    var phase = t * 0.00032;
    return [
      Math.sin(phase) * 7,
      4 + Math.sin(phase * 1.7) * 2,
      4 + Math.cos(phase * 0.8) * 4,
    ];
  }

  function vertexLight(normalPoint, worldPoint, light) {
    var normal = normalize(normalPoint);
    var toLight = [
      light[0] - worldPoint[0],
      light[1] - worldPoint[1],
      light[2] - worldPoint[2],
    ];
    var distance = Math.sqrt(dot(toLight, toLight)) || 1;
    var diffuse = Math.max(0, dot(normal, normalize(toLight)));
    var attenuation = Math.max(0.25, 1 - distance / 13);
    return Math.min(1, 0.2 + diffuse * attenuation * 1.1);
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
    var light = lightAt(t);
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
      var projected = project(point, view);
      if (!projected) return null;
      projected[3] = vertexLight([
        point[0] - position[0],
        point[1] - position[1],
        point[2] - position[2],
      ], point, light);
      return projected;
    });
  }

  function drawFloor(view) {
    [-10.25, -3.3, -5.35].forEach(function (floorY, planeIndex) {
      drawGridPlane(view, floorY, -5, 18, planeIndex === 0 ? 0.9 : 0.45, false);
    });
    drawGridPlane(view, 2.8, -5, 18, 0.28, true);
  }

  function drawGridPlane(view, planeY, farZ, nearZ, planeOpacity, vertical) {
    var corners = vertical ? [
      [-14, -4, farZ], [14, -4, farZ], [14, 4, farZ], [-14, 4, farZ],
    ] : [
      [-14, planeY, farZ], [14, planeY, farZ], [14, planeY, nearZ], [-14, planeY, nearZ],
    ];
    var projectedCorners = corners.map(function (point) { return project(point, view); });

    if (projectedCorners.every(function (point) { return point; })) {
      ctx.fillStyle = fillPlane;
      ctx.globalAlpha = planeOpacity;
      ctx.beginPath();
      ctx.moveTo(projectedCorners[0][0], projectedCorners[0][1]);
      projectedCorners.slice(1).forEach(function (point) {
        ctx.lineTo(point[0], point[1]);
      });
      ctx.closePath();
      ctx.fill();
    }

    ctx.strokeStyle = strokePlane;
    ctx.lineWidth = 1;
    for (var x = -14; x <= 14; x += 1) {
      drawFloorLine(view, vertical ? [x, -4, farZ] : [x, planeY, farZ], vertical ? [x, 4, farZ] : [x, planeY, nearZ], planeOpacity);
    }
    for (var z = vertical ? -4 : -5; z <= (vertical ? 4 : 18); z += 1) {
      drawFloorLine(view, vertical ? [-14, z, farZ] : [-14, planeY, z], vertical ? [14, z, farZ] : [14, planeY, z], planeOpacity);
    }
    ctx.globalAlpha = 1;
  }

  function drawFloorLine(view, start, end, planeOpacity) {
    var startPoint = project(start, view);
    var endPoint = project(end, view);
    if (!startPoint || !endPoint) return;
    ctx.globalAlpha = planeOpacity * Math.min(depthVisibility(startPoint[2]), depthVisibility(endPoint[2]));
    ctx.beginPath();
    ctx.moveTo(startPoint[0], startPoint[1]);
    ctx.lineTo(endPoint[0], endPoint[1]);
    ctx.stroke();
  }

  function render(t) {
    var view = createView(cameraAt(t), laggedTargetAt(t));
    ctx.clearRect(0, 0, w, h);

    drawFloor(view);
    sceneObjects.forEach(function (sceneObject, objectIndex) {
      drawSolid(t, view, sceneObject, objectIndex);
    });
  }

  function drawSolid(t, view, sceneObject, objectIndex) {
    var positions = currentPositions(t, view, sceneObject);
    var visibleFaces = sceneObject.solid.faces.map(function (face) {
      var points = face.map(function (index) { return positions[index]; });
      if (points.some(function (point) { return !point; })) return null;
      return {
        points: points,
        depth: points.reduce(function (sum, point) { return sum + point[2]; }, 0) / points.length,
        light: points.reduce(function (sum, point) { return sum + point[3]; }, 0) / points.length,
      };
    }).filter(Boolean).sort(function (left, right) {
      return right.depth - left.depth;
    });

    ctx.fillStyle = solidFills[objectIndex];
    visibleFaces.forEach(function (face) {
      ctx.globalAlpha = depthVisibility(face.depth) * face.light * 0.75;
      ctx.beginPath();
      ctx.moveTo(face.points[0][0], face.points[0][1]);
      face.points.slice(1).forEach(function (point) {
        ctx.lineTo(point[0], point[1]);
      });
      ctx.closePath();
      ctx.fill();
    });

    ctx.lineWidth = 1;
    ctx.lineCap = "round";
    ctx.strokeStyle = solidStrokes[objectIndex];
    sceneObject.solid.edges.forEach(function (edge) {
      if (!positions[edge[0]] || !positions[edge[1]]) return;
      ctx.globalAlpha = Math.min(
        depthVisibility(positions[edge[0]][2]),
        depthVisibility(positions[edge[1]][2]),
        (positions[edge[0]][3] + positions[edge[1]][3]) / 2,
      );
      ctx.beginPath();
      ctx.moveTo(positions[edge[0]][0], positions[edge[0]][1]);
      ctx.lineTo(positions[edge[1]][0], positions[edge[1]][1]);
      ctx.stroke();
    });

    ctx.fillStyle = solidFills[objectIndex];
    positions.forEach(function (point) {
      if (!point) return;
      ctx.globalAlpha = depthVisibility(point[2]) * point[3];
      ctx.beginPath();
      ctx.moveTo(point[0] + DOT_RADIUS, point[1]);
      ctx.arc(point[0], point[1], DOT_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
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
    render(t * ANIMATION_SPEED);
  }
  requestAnimationFrame(frame);
})();
