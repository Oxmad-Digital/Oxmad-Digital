"use client";

import { useEffect, useRef } from "react";
import { finePointer, gsap, heroState, introPending, isDesktop, reducedMotion } from "@/lib/motion";

const vertex = /* glsl */ `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }
`;

const fragment = /* glsl */ `
precision highp float;
uniform sampler2D tMap;
uniform vec2 uRes;    // canvas size, CSS px
uniform vec2 uImg;    // image size, px
uniform vec2 uMouse;  // 0..1, origin bottom-left
uniform float uHover; // pointer presence 0..1
uniform float uPixel; // global pixelation 0..1 (intro develop, scroll)
uniform float uDark;  // cell dissolve to black 0..1 (scroll)
varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

// object-fit: cover, centred, like the <img> it replaces.
vec2 cover(vec2 uv) {
  vec2 s = uRes / uImg;
  float scale = max(s.x, s.y);
  vec2 size = uImg * scale;
  return (uv * uRes - (uRes - size) * 0.5) / size;
}

void main() {
  vec2 px = vUv * uRes;
  // Global pixelation (develop / scroll) is uniform, so a continuous size is fine.
  float gcell = mix(1.0, 72.0, uPixel * uPixel);
  vec2 p = gcell > 1.5 ? (floor(px / gcell) + 0.5) * gcell : px;

  vec2 uv = cover(p / uRes);
  // Slight zoom leaves room for the pointer parallax.
  uv = (uv - 0.5) * 0.965 + 0.5 + (uMouse - 0.5) * vec2(-0.012, 0.008) * uHover;
  vec3 col = texture2D(tMap, uv).rgb;

  // Scroll: 28px cells switch off from the top, each with its own threshold.
  vec2 id = floor(px / 28.0);
  float threshold = hash(id) * 0.55 + (1.0 - vUv.y) * 0.45;
  // Off cells take the page black (#11120e), not pure black.
  col = mix(col, vec3(0.067, 0.071, 0.055), step(threshold, uDark));
  gl_FragColor = vec4(col, 1.0);
}
`;

/**
 * Desktop-only WebGL layer drawn over the hero <picture>, which stays the fallback.
 * Leans slightly with the pointer, develops from pixels after the intro and dissolves
 * cell by cell while scrolling (values fed through `heroState`). The pointer itself only
 * gets the cursor's pixel trail, to keep the hero calm.
 *
 * Performance: OGL is loaded after first paint, and a frame is only rendered when one
 * of its inputs changed (pointer, develop tween, scroll, resize). Idle = zero GPU work.
 */
export default function HeroGL() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const hero = canvas.closest<HTMLElement>(".hero")!;
    const img = hero.querySelector<HTMLImageElement>(".hero-background img");
    if (!img || reducedMotion() || !isDesktop() || !finePointer()) return;

    let disposed = false;
    let teardown = () => {};

    import("ogl").then(({ Mesh, Program, Renderer, Texture, Triangle }) => {
      if (disposed) return;
      let renderer: InstanceType<typeof Renderer>;
      try {
        renderer = new Renderer({ canvas, dpr: Math.min(window.devicePixelRatio, 1.5), alpha: false, antialias: false });
      } catch {
        return;
      }
      const gl = renderer.gl;
      // A lost context (GPU reset, or a canvas reused after one) cannot compile shaders.
      if (!gl || gl.isContextLost()) return;
      const texture = new Texture(gl, { generateMipmaps: false, minFilter: gl.LINEAR });
      const uniforms = {
        tMap: { value: texture },
        uRes: { value: [1, 1] },
        uImg: { value: [1, 1] },
        uMouse: { value: [0.5, 0.5] },
        uHover: { value: 0 },
        uPixel: { value: 0 },
        uDark: { value: 0 },
      };
      const program = new Program(gl, { vertex, fragment, uniforms });
      // OGL only warns when the shaders fail to compile or link: keep the static <picture> then.
      if (!(program as unknown as { uniformLocations?: Map<unknown, unknown> }).uniformLocations) return;
      const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

      let dirty = true;
      let ready = false;
      const resize = () => {
        const { width, height } = hero.getBoundingClientRect();
        renderer.setSize(width, height);
        uniforms.uRes.value = [width, height];
        dirty = true;
        // Below the desktop breakpoint the <picture> switches to the mobile artwork:
        // hide the desktop texture so that framing shows through.
        if (ready) gsap.set(canvas, { autoAlpha: isDesktop() ? 1 : 0 });
      };
      resize();
      window.addEventListener("resize", resize);

      const pointer = { x: 0.5, y: 0.5, inside: 0 };
      const onMove = (e: PointerEvent) => {
        const r = hero.getBoundingClientRect();
        pointer.x = (e.clientX - r.left) / r.width;
        pointer.y = 1 - (e.clientY - r.top) / r.height;
        pointer.inside = e.clientY >= r.top && e.clientY <= r.bottom ? 1 : 0;
      };
      const onLeave = () => { pointer.inside = 0; };
      window.addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);

      let visible = true;
      const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) dirty = true; });
      io.observe(hero);

      const develop = { value: 0 };
      let failed = false;
      // Converges, then snaps: a value within `eps` of its goal stops requesting frames.
      const settle = (value: number, goal: number, ease: number, eps = 0.0007) => {
        const next = value + (goal - value) * ease;
        if (Math.abs(goal - next) > eps) { dirty = true; return next; }
        if (next !== goal) dirty = true;
        return goal;
      };
      const render = () => {
        if (failed || !visible) return;
        const m = uniforms.uMouse.value;
        m[0] = settle(m[0], pointer.x, 0.16);
        m[1] = settle(m[1], pointer.y, 0.16);
        uniforms.uHover.value = settle(uniforms.uHover.value, pointer.inside, 0.06, 0.01);
        const pixel = Math.max(develop.value, heroState.pixel);
        if (pixel !== uniforms.uPixel.value || heroState.dark !== uniforms.uDark.value) dirty = true;
        uniforms.uPixel.value = pixel;
        uniforms.uDark.value = heroState.dark;
        if (!dirty) return;
        dirty = false;
        try {
          renderer.render({ scene: mesh });
        } catch {
          fail();
        }
      };
      const fail = () => {
        failed = true;
        gsap.ticker.remove(render);
        hero.classList.remove("has-gl");
        gsap.set(canvas, { autoAlpha: 0 });
      };
      canvas.addEventListener("webglcontextlost", fail);

      // Load the exact responsive source the browser already picked (cached), decoded off
      // the main thread into an ImageBitmap so the GPU upload is a plain copy. ImageBitmaps
      // ignore UNPACK_FLIP_Y, so the flip is baked in at creation instead.
      const source = new Image();
      source.decoding = "async";
      const toTexture = async (): Promise<{ image: HTMLImageElement | ImageBitmap; w: number; h: number }> => {
        await source.decode();
        if (typeof createImageBitmap === "function") {
          try {
            const bitmap = await createImageBitmap(source, { imageOrientation: "flipY" });
            texture.flipY = false;
            return { image: bitmap, w: bitmap.width, h: bitmap.height };
          } catch {}
        }
        return { image: source, w: source.naturalWidth, h: source.naturalHeight };
      };
      const start = () => {
        source.src = img.currentSrc || img.src;
        toTexture().then(({ image, w, h }) => {
          if (failed || disposed) return;
          // OGL's types omit ImageBitmap, which texImage2D accepts like an <img>.
          texture.image = image as HTMLImageElement;
          uniforms.uImg.value = [w, h];
          hero.classList.add("has-gl");
          ready = true;
          gsap.ticker.add(render);
          // After the intro the image "develops" from coarse pixels; otherwise it appears unchanged.
          // Only while the curtain still covers the page; once it opens, show the image as is.
          const developing = introPending() && !document.documentElement.classList.contains("intro-leaving");
          if (developing) {
            develop.value = 1;
            window.addEventListener("ox:intro-reveal", () => {
              gsap.to(develop, { value: 0, duration: 1.6, ease: "power3.out", delay: 0.15 });
            }, { once: true });
          }
          gsap.to(canvas, { autoAlpha: 1, duration: developing ? 0 : 0.4 });
        }).catch(() => {});
      };
      if (img.complete) start();
      else img.addEventListener("load", start, { once: true });

      teardown = () => {
        gsap.ticker.remove(render);
        io.disconnect();
        window.removeEventListener("resize", resize);
        window.removeEventListener("pointermove", onMove);
        document.documentElement.removeEventListener("pointerleave", onLeave);
        img.removeEventListener("load", start);
        canvas.removeEventListener("webglcontextlost", fail);
        failed = true;
        // No loseContext() here: React's dev double mount reuses this canvas, and a lost
        // context would make the next mount fail. The context is freed with the canvas.
      };
    }).catch(() => {});

    return () => {
      disposed = true;
      teardown();
      hero.classList.remove("has-gl");
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-gl" aria-hidden="true" />;
}
