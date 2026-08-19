import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";

const ROOT = join(__dirname, "..");
const SCRIPT = join(ROOT, "src", "scripts", "glass-dodecahedron.js");

type Point = [number, number];
type CanvasCall = {
  type: "clearRect" | "fillRect" | "fill" | "stroke";
  fillStyle: string;
  strokeStyle: string;
  path: Point[];
  arcs: number;
};

type HarnessOptions = {
  dpr?: number;
  height?: number;
  reduceMotion?: boolean;
  rejectRelativeColors?: boolean;
  width?: number;
};

function createAnimation(options: HarnessOptions = {}) {
  const script = readFileSync(SCRIPT, "utf8");
  const calls: CanvasCall[] = [];
  const frames: Array<(timestamp: number) => void> = [];
  const listeners = new Map<
    string,
    { callback: () => void; options?: AddEventListenerOptions }
  >();
  let path: Point[] = [];
  let arcs = 0;

  const context = {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    lineCap: "butt",
    setTransform() {},
    clearRect() {
      record("clearRect");
    },
    fillRect() {
      record("fillRect");
    },
    beginPath() {
      path = [];
      arcs = 0;
    },
    moveTo(x: number, y: number) {
      path.push([x, y]);
    },
    lineTo(x: number, y: number) {
      path.push([x, y]);
    },
    closePath() {},
    arc() {
      arcs += 1;
    },
    fill() {
      record("fill");
    },
    stroke() {
      record("stroke");
    },
  };
  function record(type: CanvasCall["type"]) {
    calls.push({
      type,
      fillStyle: context.fillStyle,
      strokeStyle: context.strokeStyle,
      path: [...path],
      arcs,
    });
  }

  let cssWidth = options.width ?? 56;
  let cssHeight = options.height ?? 56;
  const canvas = {
    width: 0,
    height: 0,
    get clientWidth() {
      return cssWidth;
    },
    get clientHeight() {
      return cssHeight;
    },
    getBoundingClientRect: () => ({ width: cssWidth, height: cssHeight }),
    getContext: () => context,
  };
  const document = {
    getElementById: () => canvas,
    createElement: () => {
      let color = "";
      return {
        style: {
          get color() {
            return color;
          },
          set color(value: string) {
            if (options.rejectRelativeColors && value.startsWith("oklch(")) return;
            color = value;
          },
        },
      };
    },
    body: {
      appendChild() {},
      removeChild() {},
    },
  };
  const window = {
    devicePixelRatio: options.dpr ?? 1,
    innerWidth: 1280,
    innerHeight: 720,
    matchMedia: () => ({ matches: options.reduceMotion ?? false }),
    addEventListener(
      type: string,
      callback: () => void,
      eventOptions?: AddEventListenerOptions,
    ) {
      listeners.set(type, { callback, options: eventOptions });
    },
  };

  vm.runInNewContext(script, {
    document,
    window,
    performance: { now: () => 0 },
    getComputedStyle: (probe: { style: { color: string } }) => ({
      color: probe.style.color || "rgb(245, 245, 245)",
    }),
    requestAnimationFrame: (callback: (timestamp: number) => void) => {
      frames.push(callback);
    },
    Math,
  });

  return {
    calls,
    canvas,
    listener(type: string) {
      return listeners.get(type);
    },
    pendingFrames() {
      return frames.length;
    },
    resetCalls() {
      calls.length = 0;
    },
    resizeTo(width: number, height: number) {
      cssWidth = width;
      cssHeight = height;
      const resize = listeners.get("resize");
      expect(resize).toBeTruthy();
      resize!.callback();
    },
    runFrame(timestamp: number) {
      expect(frames).toHaveLength(1);
      frames.shift()!(timestamp);
    },
  };
}

test.describe("GlassDodecahedron header placement", () => {
  test("renders immediately after the site title inside the brand", () => {
    const layout = readFileSync(join(ROOT, "src", "layouts", "Layout.astro"), "utf8");

    expect(layout.match(/<GlassDodecahedron\s*\/>/g)).toHaveLength(1);
    expect(layout).toMatch(
      /<div class="site-brand">\s*<a[^>]*>\{siteTitle\}<\/a>\s*<GlassDodecahedron\s*\/>/,
    );
  });

  test("uses a flex-aligned inline canvas rather than a viewport background", () => {
    const component = readFileSync(
      join(ROOT, "src", "components", "GlassDodecahedron.astro"),
      "utf8",
    );
    const layoutCss = readFileSync(
      join(ROOT, "public", "styles", "partials", "layout.css"),
      "utf8",
    );

    expect(component).not.toContain("position: fixed");
    expect(component).not.toContain("100vw");
    expect(component).not.toContain("100vh");
    expect(component).toMatch(/width:\s*10rem/);
    expect(component).toMatch(/height:\s*10rem/);
    expect(component).toMatch(/max-width:/);
    expect(component).toMatch(/max-height:/);
    expect(layoutCss).toMatch(/\.site-brand\s*\{[^}]*display:\s*flex/s);
    expect(layoutCss).toMatch(/\.site-brand\s*\{[^}]*align-items:\s*center/s);
    expect(layoutCss).toMatch(/\.site-brand\s*\{[^}]*justify-content:\s*center/s);
    expect(layoutCss).toMatch(/\.site-brand\s*\{[^}]*gap:/s);
  });
});

test.describe("GlassDodecahedron inline renderer", () => {
  test("sizes from its own element and caps DPR at two", () => {
    const animation = createAnimation({ dpr: 3, width: 60, height: 48 });

    expect(animation.canvas.width).toBe(120);
    expect(animation.canvas.height).toBe(96);
    expect(animation.listener("resize")?.options).toMatchObject({ passive: true });

    animation.resizeTo(64, 52);
    expect(animation.canvas.width).toBe(128);
    expect(animation.canvas.height).toBe(104);
  });

  test("draws one current wireframe and one batched vertex fill per frame", () => {
    const animation = createAnimation();
    animation.resetCalls();
    animation.runFrame(0);

    expect(animation.calls.map(({ type }) => type)).toEqual([
      "clearRect",
      "stroke",
      "fill",
    ]);
    expect(animation.calls[1].path).toHaveLength(30 * 2);
    expect(animation.calls[2].arcs).toBe(20);
    expect(animation.listener("scroll")).toBeUndefined();

    animation.resetCalls();
    animation.runFrame(34);
    expect(animation.calls.map(({ type }) => type)).toEqual([
      "clearRect",
      "stroke",
      "fill",
    ]);
  });

  test("throttles animation to about 30fps", () => {
    const animation = createAnimation();
    animation.runFrame(0);
    animation.resetCalls();

    animation.runFrame(10);
    expect(animation.calls).toHaveLength(0);

    animation.runFrame(34);
    expect(animation.calls).toHaveLength(3);
  });

  test("renders one static frame for reduced motion", () => {
    const animation = createAnimation({ reduceMotion: true });

    expect(animation.pendingFrames()).toBe(0);
    expect(animation.calls.map(({ type }) => type)).toEqual([
      "clearRect",
      "stroke",
      "fill",
    ]);
    expect(animation.calls[2].arcs).toBe(20);
  });

  test("uses explicit color fallbacks when relative OKLCH is unsupported", () => {
    const animation = createAnimation({ rejectRelativeColors: true });
    animation.resetCalls();
    animation.runFrame(0);

    expect(animation.calls[1].strokeStyle).toBe("rgba(190, 120, 255, 0.65)");
    expect(animation.calls[2].fillStyle).toBe("rgba(120, 150, 255, 0.9)");
  });
});
