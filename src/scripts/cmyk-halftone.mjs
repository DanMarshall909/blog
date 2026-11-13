export function separateCmyk(image, plates = Array.from({ length: 4 }, () => new Float32Array(image.width * image.height))) {
  for (let pixel = 0; pixel < image.width * image.height; pixel++) {
    const offset = pixel * 4;
    const maximum = Math.max(image.data[offset], image.data[offset + 1], image.data[offset + 2]);
    for (let channel = 0; channel < 3; channel++) {
      plates[channel][pixel] = maximum === 0 ? 0 : (maximum - image.data[offset + channel]) / maximum;
    }
    plates[3][pixel] = 1 - maximum / 255;
  }
  return plates;
}

// Circular dots grow into neighbouring dots in shadows. Account for the area
// clipped by the square screen cell so 95% coverage really deposits 95% ink.
const dotRadii = new Float32Array(256);
for (let level = 1; level < 255; level++) {
  let low = 0, high = Math.SQRT1_2;
  for (let iteration = 0; iteration < 20; iteration++) {
    const radius = (low + high) / 2;
    const square = radius * radius;
    const area = radius <= 0.5 ? Math.PI * square
      : Math.PI * square - 4 * (square * Math.acos(0.5 / radius) - 0.5 * Math.sqrt(square - 0.25));
    if (area < level / 255) low = radius;
    else high = radius;
  }
  dotRadii[level] = (low + high) / 2;
}
dotRadii[255] = 1;

export function createHalftoneScreens(width, height, pitch) {
  return [15, 75, 0, 45].map(angle => {
    const radians = angle * Math.PI / 180;
    const cos = Math.cos(radians), sin = Math.sin(radians);
    const corners = [[0, 0], [width, 0], [0, height], [width, height]];
    const us = corners.map(([x, y]) => (x * cos + y * sin) / pitch);
    const vs = corners.map(([x, y]) => (-x * sin + y * cos) / pitch);
    const minU = Math.floor(Math.min(...us)), minV = Math.floor(Math.min(...vs));
    const columns = Math.floor(Math.max(...us)) - minU + 1;
    const rows = Math.floor(Math.max(...vs)) - minV + 1;
    const cells = new Uint32Array(width * height);
    const distances = new Float32Array(width * height);
    const centersX = new Float32Array(columns * rows);
    const centersY = new Float32Array(columns * rows);
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const u = (minU + column + 0.5) * pitch, v = (minV + row + 0.5) * pitch;
        const cell = row * columns + column;
        centersX[cell] = (u * cos - v * sin) / width;
        centersY[cell] = (u * sin + v * cos) / height;
      }
    }
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const u = ((x + 0.5) * cos + (y + 0.5) * sin) / pitch;
        const v = (-(x + 0.5) * sin + (y + 0.5) * cos) / pitch;
        const column = Math.floor(u), row = Math.floor(v), pixel = y * width + x;
        cells[pixel] = (row - minV) * columns + column - minU;
        distances[pixel] = Math.hypot(u - column - 0.5, v - row - 0.5);
      }
    }
    return { angle, cells, distances, centersX, centersY, radii: new Float32Array(columns * rows) };
  });
}

function samplePlate(plate, width, height, nx, ny) {
  const x = Math.max(0, Math.min(width - 1, nx * width - 0.5));
  const y = Math.max(0, Math.min(height - 1, ny * height - 0.5));
  const left = Math.floor(x), top = Math.floor(y);
  const right = Math.min(width - 1, left + 1), bottom = Math.min(height - 1, top + 1);
  const fx = x - left, fy = y - top;
  return (plate[top * width + left] * (1 - fx) + plate[top * width + right] * fx) * (1 - fy)
    + (plate[bottom * width + left] * (1 - fx) + plate[bottom * width + right] * fx) * fy;
}

export function renderCmykHalftones(plates, sourceWidth, sourceHeight, screens, target) {
  screens.forEach((screen, channel) => {
    for (let cell = 0; cell < screen.radii.length; cell++) {
      const coverage = samplePlate(plates[channel], sourceWidth, sourceHeight, screen.centersX[cell], screen.centersY[cell]);
      screen.radii[cell] = dotRadii[Math.max(0, Math.min(255, Math.round(coverage * 255)))];
    }
  });
  const [cyan, magenta, yellow, key] = screens;
  for (let pixel = 0; pixel < target.width * target.height; pixel++) {
    const offset = pixel * 4;
    const black = key.distances[pixel] < key.radii[key.cells[pixel]];
    // Opaque, pure process inks multiply on white paper.
    target.data[offset] = black || cyan.distances[pixel] < cyan.radii[cyan.cells[pixel]] ? 0 : 255;
    target.data[offset + 1] = black || magenta.distances[pixel] < magenta.radii[magenta.cells[pixel]] ? 0 : 255;
    target.data[offset + 2] = black || yellow.distances[pixel] < yellow.radii[yellow.cells[pixel]] ? 0 : 255;
    target.data[offset + 3] = 255;
  }
}
