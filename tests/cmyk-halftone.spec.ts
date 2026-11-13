import { expect, test } from "@playwright/test";
import { createHalftoneScreens, renderCmykHalftones, separateCmyk } from "../src/scripts/cmyk-halftone.mjs";

const colours = [
  { rgb: [255, 255, 255], cmyk: [0, 0, 0, 0] },
  { rgb: [0, 0, 0], cmyk: [0, 0, 0, 1] },
  { rgb: [0, 255, 255], cmyk: [1, 0, 0, 0] },
  { rgb: [255, 0, 255], cmyk: [0, 1, 0, 0] },
  { rgb: [255, 255, 0], cmyk: [0, 0, 1, 0] },
  { rgb: [0, 0, 255], cmyk: [1, 1, 0, 0] },
  { rgb: [255, 0, 0], cmyk: [0, 1, 1, 0] },
  { rgb: [0, 255, 0], cmyk: [1, 0, 1, 0] },
  { rgb: [128, 128, 128], cmyk: [0, 0, 0, 127 / 255] },
];

test("RGB image pixels separate into cyan, magenta, yellow and black coverage", () => {
  const image = { width: colours.length, height: 1, data: new Uint8ClampedArray(colours.flatMap(({ rgb }) => [...rgb, 255])) };
  const plates = separateCmyk(image);
  for (const [pixel, { cmyk }] of colours.entries()) {
    for (let channel = 0; channel < 4; channel++) expect(plates[channel][pixel]).toBeCloseTo(cmyk[channel], 6);
  }
});

test("solid RGB primaries, overlaps, paper and black survive halftone printing", () => {
  const screens = createHalftoneScreens(64, 64, 8);
  const target = { width: 64, height: 64, data: new Uint8ClampedArray(64 * 64 * 4) };
  for (const { rgb } of colours.slice(0, 8)) {
    const plates = separateCmyk({ width: 1, height: 1, data: new Uint8ClampedArray([...rgb, 255]) });
    renderCmykHalftones(plates, 1, 1, screens, target);
    const expected = [...rgb, 255];
    expect(target.data.every((value, index) => value === expected[index % 4]), `RGB ${rgb}`).toBe(true);
  }
});

test("halftone dot area reproduces midtones and dense shadows", () => {
  const screens = createHalftoneScreens(256, 256, 10);
  const target = { width: 256, height: 256, data: new Uint8ClampedArray(256 * 256 * 4) };
  for (const grey of [128, 13]) {
    const plates = separateCmyk({ width: 1, height: 1, data: new Uint8ClampedArray([grey, grey, grey, 255]) });
    renderCmykHalftones(plates, 1, 1, screens, target);
    let black = 0;
    for (let index = 0; index < target.data.length; index += 4) if (target.data[index] === 0) black++;
    expect(Math.abs(black / (target.width * target.height) - (1 - grey / 255))).toBeLessThan(0.035);
  }
});
