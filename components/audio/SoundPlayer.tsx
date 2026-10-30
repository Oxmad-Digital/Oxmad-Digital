"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowUp, Pause, Play, SkipBack, SkipForward, Volume2, VolumeX, X } from "lucide-react";
import { TRACKS, audioStore, getAnalyser, pause, play, setUiSounds, setVolume, skip, togglePlay, uiSound, type UiSound } from "@/lib/audio";
import { fitCanvas } from "@/lib/canvas";
import "./SoundPlayer.css";

// Same targets as the custom cursor: everything clickable gets a click sound.
const INTERACTIVE = "a, button, [role='button'], label, select, summary, [data-cursor]";
const SEEN_KEY = "ox-audio-seen";
const CELL = 6;

/** Pixel spectrum of the music bus, in the accent colour. */
function Visualizer({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#c6b703";
    // Layout size, not the rect: the closed panel is scaled down.
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    fitCanvas(canvas, ctx, w, h);
    const cols = Math.floor(w / CELL);
    const rows = Math.floor(h / CELL);
    const levels = new Float32Array(cols);
    let data: Uint8Array<ArrayBuffer> | null = null;
    let raf = 0;

    const draw = () => {
      const analyser = getAnalyser();
      if (analyser && active) {
        data ??= new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
      }
      ctx.clearRect(0, 0, w, h);
      for (let x = 0; x < cols; x++) {
        // Log-ish spread: the low bins carry most of the music.
        const bin = data ? data[Math.floor((x / cols) ** 1.6 * data.length * 0.7)] / 255 : 0;
        levels[x] = Math.max(bin, levels[x] * 0.9);
        const lit = Math.max(1, Math.round(levels[x] * rows));
        for (let y = 0; y < lit; y++) {
          ctx.globalAlpha = y === lit - 1 ? 1 : 0.35 + (y / rows) * 0.5;
          ctx.fillStyle = accent;
          ctx.fillRect(x * CELL, h - (y + 1) * CELL, CELL - 1, CELL - 1);
        }
      }
      ctx.globalAlpha = 1;
      if (active || levels.some((l) => l > 0.01)) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return <canvas className="ox-sound__viz" ref={ref} aria-hidden="true" />;
}

export default function SoundPlayer() {
  const { track, playing, volume, uiSounds } = useSyncExternalStore(audioStore.subscribe, audioStore.get, audioStore.getServer);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = TRACKS.find((t) => t.id === track)!;

  // Interface sounds for the whole site. Elements may pick theirs with data-sound
  // ("off" for none); the player's own buttons play their sound themselves.
  useEffect(() => {
    let hovered: Element | null = null;
    const soundOf = (el: Element) => el.closest<HTMLElement>("[data-sound]")?.dataset.sound;
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const el = (e.target as Element).closest?.(INTERACTIVE);
      if (!el) return;
      const kind = soundOf(el);
      if (kind !== "off") uiSound((kind as UiSound) ?? "click");
    };
    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const el = (e.target as Element).closest?.(INTERACTIVE) ?? null;
      if (el && el !== hovered && soundOf(el) !== "off") uiSound("hover");
      hovered = el;
    };
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerover", onOver);
    };
  }, []);

  // The floating squares rise above the hero paragraph and the footer whenever they would
  // cover them. Read on every scroll (Lenis drives the native scroll position).
  useEffect(() => {
    const root = rootRef.current!;
    const GAP = 16;
    let frame = 0;
    const update = () => {
      frame = 0;
      // Untranslated span of the two squares (the panel above them never counts).
      const first = root.querySelector(".ox-sound__fab")!.getBoundingClientRect();
      const box = root.lastElementChild!.getBoundingClientRect();
      const bottom = window.innerHeight - parseFloat(getComputedStyle(root).bottom);
      const top = bottom - (box.bottom - first.top);
      let lift = 0;
      for (const el of document.querySelectorAll<HTMLElement>(".hero-desc p, footer")) {
        const r = el.getBoundingClientRect();
        // The paragraph's right padding is the room it already leaves for the squares.
        const right = r.right - parseFloat(getComputedStyle(el).paddingRight);
        if (right > box.left && r.left < box.right && r.top < bottom + GAP && r.bottom > top) {
          lift = Math.max(lift, bottom + GAP - r.top);
        }
      }
      root.style.translate = lift ? `0 ${-lift}px` : "";
    };
    const schedule = () => { frame ||= requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  const close = () => {
    uiSound("close");
    setOpen(false);
  };

  // Escape or a click outside closes the player (it never traps the page).
  useEffect(() => {
    if (!open) return;
    const close = () => {
      uiSound("close");
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const toggleOpen = () => {
    if (open) return close();
    // Opening the player is the visitor's first "yes" to sound: interface sounds turn on once.
    try {
      if (!localStorage.getItem(SEEN_KEY)) {
        localStorage.setItem(SEEN_KEY, "1");
        setUiSounds(true);
      }
    } catch {}
    setOpen(true);
    // The store update above is synchronous, so this already plays when just enabled.
    uiSound("open");
  };

  return (
    <div className={`ox-sound${open ? " is-open" : ""}${playing ? " is-playing" : ""}`} ref={rootRef}>
      <div className="ox-sound__panel" role="dialog" aria-label="Ambiance sonore" aria-hidden={!open} inert={!open}>
        <div className="ox-sound__head">
          <span className="micro">Ambiance sonore</span>
          <button type="button" className="ox-sound__icon" aria-label="Fermer le lecteur" data-sound="off" onClick={close}><X size={15} /></button>
        </div>

        <Visualizer active={open && playing} />

        <div className="ox-sound__now">
          <div>
            <p className="ox-sound__title">{current.title}</p>
            <p className="ox-sound__mood">{current.mood}</p>
          </div>
          <div className="ox-sound__controls">
            <button type="button" className="ox-sound__icon" aria-label="Morceau précédent" data-sound="select" onClick={() => skip(-1)}><SkipBack size={15} /></button>
            <button type="button" className="ox-sound__play" aria-label={playing ? "Pause" : "Lecture"} data-sound="off" onClick={togglePlay}>
              {playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}
            </button>
            <button type="button" className="ox-sound__icon" aria-label="Morceau suivant" data-sound="select" onClick={() => skip(1)}><SkipForward size={15} /></button>
          </div>
        </div>

        <ol className="ox-sound__tracks">
          {TRACKS.map((t, i) => {
            const active = t.id === track;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  className={`ox-sound__track${active ? " is-active" : ""}`}
                  aria-current={active || undefined}
                  data-sound="select"
                  onClick={() => (active && playing ? pause() : play(t.id))}
                >
                  <span className="ox-sound__num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="ox-sound__name">{t.title}</span>
                  <span className="ox-sound__bpm">{t.bpm} BPM</span>
                  <span className="ox-sound__eq" aria-hidden="true"><i /><i /><i /></span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="ox-sound__settings">
          <div className="ox-sound__volume">
            <button type="button" className="ox-sound__icon" aria-label={volume ? "Couper le volume" : "Rétablir le volume"} onClick={() => setVolume(volume ? 0 : 0.6)}>
              {volume ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>
            <input
              type="range" min={0} max={1} step={0.01} value={volume} aria-label="Volume" data-cursor=""
              style={{ "--v": `${volume * 100}%` } as React.CSSProperties}
              onChange={(e) => setVolume(Number(e.target.value))}
            />
          </div>
          <label className="ox-sound__switch">
            <input type="checkbox" checked={uiSounds} onChange={(e) => setUiSounds(e.target.checked)} />
            <span className="ox-sound__toggle" aria-hidden="true" />
            <span className="micro">Sons au clic</span>
          </label>
        </div>

        <p className="ox-sound__note micro">Généré en temps réel · Web Audio API · 0 fichier</p>
      </div>

      <button
        type="button"
        className="ox-sound__fab"
        aria-label={open ? "Fermer l'ambiance sonore" : "Ouvrir l'ambiance sonore"}
        aria-expanded={open}
        data-cursor={open ? "" : "Ambiance"}
        data-sound="off"
        onClick={toggleOpen}
      >
        <span className="ox-sound__bars" aria-hidden="true"><i /><i /><i /><i /></span>
      </button>

      {/* Plain anchor to the header, so the smooth scroll glides back up. */}
      <a href="#haut" className="ox-sound__fab ox-sound__top" aria-label="Retour en haut" data-cursor="Haut">
        <ArrowUp size={16} />
      </a>
    </div>
  );
}
