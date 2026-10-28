"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useBookCall } from "@/components/BookCall/BookCallContext";
import { motionWindow } from "@/lib/motion";
import { createGame, score, step, PLAYER_SIZE, PLAYER_X, TICK_RATE, VIEW_W, type Game } from "./engine";
import { CUBE_PIXELS, createCubeSprite, draw, type Particle, type View } from "./render";
import "./XRun.css";

type Phase = "idle" | "playing" | "paused" | "over";
type ScoreEntry = { name: string; score: number };
type GameStats = { plays: number; seconds: number };
/** A finished run that can still be sent to the leaderboard. */
type Run = { token: string; inputs: number[]; score: number };
type Submit = { state: "idle" | "sending" | "error"; message?: string } | { state: "done"; rank: number; name: string; score: number };

const BEST_KEY = "ox-xrun-best";
const NAME_KEY = "ox-xrun-name";
const STEP_MS = 1000 / TICK_RATE;
/** Inputs right after a crash are ignored, so a late tap does not restart by accident. */
const RESTART_DELAY = 450;
const JUMP_KEYS = new Set(["Space", "ArrowUp", "KeyW", "Enter"]);

/** `lock` is missing from some DOM typings and from iOS, where the orientation cannot be forced. */
type LockableOrientation = ScreenOrientation & { lock?: (orientation: "landscape") => Promise<void>; unlock?: () => void };

const pad = (n: number) => String(n).padStart(6, "0");

function readBest() {
  try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch { return 0; }
}

/** "1 284 parties · 37 h 12 min de jeu" */
function formatStats({ plays, seconds }: GameStats) {
  const minutes = Math.floor(seconds / 60);
  const time = minutes >= 60 ? `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")} min` : minutes > 0 ? `${minutes} min` : `${seconds} s`;
  return `${plays.toLocaleString("fr-FR")} partie${plays > 1 ? "s" : ""} · ${time} de jeu cumulé`;
}

function readName() {
  try { return localStorage.getItem(NAME_KEY) || ""; } catch { return ""; }
}

export default function XRun() {
  const { open: openBookCall, preload: preloadBookCall } = useBookCall();
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scoreRef = useRef<HTMLElement>(null);
  const bestRef = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState({ score: 0, best: 0, record: false });
  const [top, setTop] = useState<ScoreEntry[] | null>(null);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [run, setRun] = useState<Run | null>(null);
  const [name, setName] = useState("");
  const [submit, setSubmit] = useState<Submit>({ state: "idle" });
  const [fullscreen, setFullscreen] = useState(false);

  // Mutable game state shared by the loop and the input handlers.
  const sim = useRef({
    phase: "idle" as Phase,
    game: createGame(1),
    pressed: false,
    held: false,
    crashedAt: 0,
    lastScore: -1,
    /** Signed seed for the next run, fetched ahead so starting never waits on the network. */
    nextToken: null as string | null,
    token: null as string | null,
    /** Input changes of the current run, replayed by the server to check the score. */
    inputs: [] as number[],
    flags: 0,
  });

  /** Loads the leaderboard and the next run's token. Without a token, the next run is simply unranked. */
  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/game", { cache: "no-store" });
      const data = await res.json();
      setTop(data.top);
      setStats(data.stats);
      sim.current.nextToken = data.token;
    } catch {
      setTop((current) => current ?? []);
    }
  }, []);

  /** Counts a finished run in the stats, even if the player never enters the leaderboard. */
  const sendRun = useCallback(async (token: string, inputs: number[]) => {
    try {
      const res = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, inputs }),
        keepalive: inputs.length < 8000,
      });
      const data = await res.json();
      if (!res.ok) return;
      setTop(data.top);
      setStats(data.stats);
    } catch {}
  }, []);

  const setGamePhase = useCallback((next: Phase) => {
    sim.current.phase = next;
    setPhase(next);
  }, []);

  const start = useCallback(() => {
    const s = sim.current;
    s.token = s.nextToken;
    s.nextToken = null;
    s.game = createGame(s.token ? Number(s.token.split(".")[0]) : (Math.random() * 2 ** 32) >>> 0);
    s.pressed = false;
    s.lastScore = -1;
    s.inputs = [];
    s.flags = 0;
    setRun(null);
    setSubmit({ state: "idle" });
    refresh();
    // "Rejouer" unmounts with its button: keep the keyboard on the game, not the page.
    frameRef.current?.focus({ preventScroll: true });
    setGamePhase("playing");
  }, [refresh, setGamePhase]);

  /** One button does everything: start, resume, restart or jump. */
  const press = useCallback(() => {
    const s = sim.current;
    s.held = true;
    if (s.phase === "playing") s.pressed = true;
    else if (s.phase === "paused") setGamePhase("playing");
    else if (s.phase === "idle") start();
    else if (performance.now() - s.crashedAt > RESTART_DELAY) start();
  }, [setGamePhase, start]);

  const release = useCallback(() => { sim.current.held = false; }, []);

  /**
   * Android: real fullscreen, then the screen is locked in landscape.
   * iPhone has no fullscreen for anything but video: the stage then simply covers the viewport.
   */
  const enterFullscreen = useCallback(async () => {
    const stage = stageRef.current!;
    if (document.fullscreenEnabled && stage.requestFullscreen) {
      try {
        await stage.requestFullscreen({ navigationUI: "hide" });
        // Desktops reject the lock, which is fine: their screen is already landscape.
        await (screen.orientation as LockableOrientation | undefined)?.lock?.("landscape").catch(() => {});
      } catch {}
    }
    setFullscreen(true);
    frameRef.current?.focus({ preventScroll: true });
  }, []);

  const exitFullscreen = useCallback(() => {
    (screen.orientation as LockableOrientation | undefined)?.unlock?.();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    if (sim.current.phase === "playing") setGamePhase("paused");
    setFullscreen(false);
  }, [setGamePhase]);

  useEffect(() => {
    if (!fullscreen) return;
    // Leaving with the system gesture or Escape ends the native fullscreen without our button.
    const onChange = () => { if (!document.fullscreenElement) exitFullscreen(); };
    document.addEventListener("fullscreenchange", onChange);
    // The page must not scroll behind the covering stage (iPhone fallback).
    const lenis = motionWindow().__oxLenis;
    lenis?.stop();
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      lenis?.start();
      root.style.overflow = overflow;
    };
  }, [exitFullscreen, fullscreen]);

  useEffect(() => {
    const frame = frameRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    // Full-resolution canvas: the pixel art is scaled by the context, not by CSS, so
    // scrolling moves by screen pixels instead of jumping by whole game pixels.
    let scale = 1;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(frame.clientWidth * dpr);
      canvas.height = Math.round(frame.clientHeight * dpr);
      scale = canvas.width / VIEW_W;
      ctx.imageSmoothingEnabled = false;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(frame);
    const sprite = createCubeSprite();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const s = sim.current;
    // The record lives in this browser only, so it is written straight into the HUD.
    const showBest = (value: number) => { if (bestRef.current) bestRef.current.textContent = pad(value); };
    showBest(readBest());

    let particles: Particle[] = [];
    const trail: View["trail"] = [];
    let prev = { dist: s.game.dist, y: s.game.y, turn: s.game.turn };
    let acc = 0;
    let last = 0;
    let raf = 0;
    let visible = false;
    let shake = 0;

    const burst = (g: Game) => {
      const ox = PLAYER_X;
      const oy = g.y - PLAYER_SIZE;
      particles = CUBE_PIXELS.filter((_, i) => i % 2 === 0).map((p) => ({
        x: ox + p.x, y: oy + p.y, color: p.color, life: 1.4,
        vx: (p.x - PLAYER_SIZE / 2) * 0.12 + (Math.random() - 0.3) * 1.2,
        vy: (p.y - PLAYER_SIZE / 2) * 0.12 - Math.random() * 2.2,
      }));
      if (!reduceMotion) shake = 6;
    };

    const crash = () => {
      const g = s.game;
      const final = score(g);
      const previous = readBest();
      const record = final > previous;
      if (record) {
        try { localStorage.setItem(BEST_KEY, String(final)); } catch {}
        showBest(final);
      }
      s.crashedAt = performance.now();
      setRun(s.token && final > 0 ? { token: s.token, inputs: s.inputs, score: final } : null);
      setName((current) => current || readName());
      if (s.token) sendRun(s.token, s.inputs);
      setResult({ score: final, best: Math.max(final, previous), record });
      setGamePhase("over");
      burst(g);
    };

    const frameLoop = (now: number) => {
      raf = requestAnimationFrame(frameLoop);
      const dt = last ? Math.min(now - last, 100) : STEP_MS;
      last = now;
      const g = s.game;

      if (s.phase === "playing") {
        acc += dt;
        let steps = 0;
        while (acc >= STEP_MS && steps < 5) {
          prev = { dist: g.dist, y: g.y, turn: g.turn };
          const flags = (s.pressed ? 1 : 0) | (s.held ? 2 : 0);
          if (flags !== s.flags) {
            s.inputs.push(g.tick, flags);
            s.flags = flags;
          }
          const events = step(g, s.pressed, s.held);
          s.pressed = false;
          if (g.tick % 3 === 0) trail.unshift({ y: g.y, age: 0 });
          acc -= STEP_MS;
          steps++;
          if (events.includes("crash")) { crash(); break; }
        }
        for (const t of trail) t.age += dt / 50;
        while (trail.length && trail[trail.length - 1].age > 8) trail.pop();
      } else {
        acc = 0;
        prev = { dist: g.dist, y: g.y, turn: g.turn };
      }

      const k = dt / STEP_MS;
      for (const p of particles) {
        p.vy += 0.18 * k;
        p.x += p.vx * k;
        p.y += p.vy * k;
        p.life -= dt / 1000;
      }
      particles = particles.filter((p) => p.life > 0);

      // Interpolate between the last two ticks so high refresh screens stay smooth.
      const alpha = s.phase === "playing" ? acc / STEP_MS : 1;
      const idleBob = s.phase === "idle" ? Math.sin(now / 260) * 2 : 0;
      const view: View = {
        dist: prev.dist + (g.dist - prev.dist) * alpha,
        y: prev.y + (g.y - prev.y) * alpha + idleBob,
        turn: prev.turn + (g.turn - prev.turn) * alpha,
        crashed: s.phase === "over",
        time: now / 1000,
        trail: s.phase === "playing" ? trail : [],
      };

      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      if (shake > 0) {
        ctx.translate(Math.round((Math.random() - 0.5) * shake), Math.round((Math.random() - 0.5) * shake));
        shake = Math.max(0, shake - dt / 40);
      }
      draw(ctx, scale, g, sprite, view, particles);

      const current = score(g);
      if (current !== s.lastScore && scoreRef.current) {
        s.lastScore = current;
        scoreRef.current.textContent = pad(current);
      }
    };

    // The loop only runs while the game is on screen and the tab is visible.
    const run = () => {
      if (raf || !visible || document.hidden) return;
      last = 0;
      raf = requestAnimationFrame(frameLoop);
    };
    const halt = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      if (s.phase === "playing") setGamePhase("paused");
    };

    let loaded = false;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      frame.classList.toggle("is-offscreen", !visible);
      // The leaderboard is only requested once the game is actually seen.
      if (visible && !loaded) {
        loaded = true;
        preloadBookCall();
        refresh();
      }
      if (visible) run();
      else halt();
    });
    io.observe(frame);
    const onVisibility = () => (document.hidden ? halt() : run());
    document.addEventListener("visibilitychange", onVisibility);

    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);

    return () => {
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      cancelAnimationFrame(raf);
      frame.classList.remove("is-offscreen");
    };
  }, [preloadBookCall, refresh, release, sendRun, setGamePhase]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!run || submit.state === "sending") return;
    setSubmit({ state: "sending" });
    try {
      const res = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: run.token, inputs: run.inputs, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmit({ state: "error", message: data.error });
        return;
      }
      try { localStorage.setItem(NAME_KEY, name.trim()); } catch {}
      setTop(data.top);
      setStats(data.stats);
      setRun(null);
      setSubmit({ state: "done", rank: data.rank, name: name.trim(), score: data.score });
    } catch {
      setSubmit({ state: "error", message: "Connexion impossible. Merci de réessayer." });
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || (e.target as Element).closest("button, input")) return;
    e.preventDefault();
    frameRef.current?.focus({ preventScroll: true });
    press();
  };

  // Keys are only captured while the game has focus, so Space still scrolls the page otherwise.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && fullscreen) {
      exitFullscreen();
      return;
    }
    if (e.key === "Escape" && sim.current.phase === "playing") {
      setGamePhase("paused");
      return;
    }
    if (!JUMP_KEYS.has(e.code) || (e.target as Element).closest("button, input")) return;
    e.preventDefault();
    if (!e.repeat) press();
  };

  const onKeyUp = (e: React.KeyboardEvent) => {
    if (JUMP_KEYS.has(e.code) && !(e.target as Element).closest("input")) release();
  };

  /** Pause and resume from the on-screen button; focus goes back to the game for the keyboard. */
  const togglePause = () => {
    setGamePhase(sim.current.phase === "playing" ? "paused" : "playing");
    frameRef.current?.focus({ preventScroll: true });
  };

  const onBlur = (e: React.FocusEvent) => {
    // Focus moving to a control inside the game (fullscreen button) is not leaving it.
    if (frameRef.current?.contains(e.relatedTarget as Node | null)) return;
    if (sim.current.phase === "playing") setGamePhase("paused");
  };

  const mine = submit.state === "done" ? submit : null;

  return (
    <div className="xrun-wrap">
    <div ref={stageRef} className={`xrun-stage${fullscreen ? " is-fullscreen" : ""}`}>
    <div
      ref={frameRef}
      className={`xrun is-${phase}`}
      tabIndex={0}
      role="group"
      aria-label="Mini-jeu 0x-Run. Espace, flèche haut ou toucher l'écran pour sauter."
      data-cursor={phase === "playing" ? "" : "Jouer"}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      onBlur={onBlur}
    >
      <canvas ref={canvasRef} className="xrun-canvas" aria-hidden="true" />

      <div className="xrun-hud smallcap" aria-hidden="true">
        <span>Score <b ref={scoreRef}>{pad(0)}</b></span>
        <span>Record <b ref={bestRef}>{pad(0)}</b></span>
      </div>

      {phase === "idle" && (
        <div className="xrun-screen">
          <p className="xrun-title">0x-RUN</p>
          <p className="xrun-hint smallcap"><span className="xrun-blink">Appuyez sur Espace</span> ou touchez l&apos;écran pour jouer</p>
        </div>
      )}

      {phase === "paused" && (
        <div className="xrun-screen xrun-screen--dim">
          <p className="xrun-title">Pause</p>
          <p className="xrun-hint smallcap"><span className="xrun-blink">Cliquez ou appuyez sur Espace</span> pour reprendre</p>
        </div>
      )}

      {phase === "over" && (
        <div className="xrun-screen xrun-screen--dim" aria-live="polite">
          <p className="xrun-kicker smallcap">{result.record ? "Nouveau record !" : "Build failed"}</p>
          <p className="xrun-title">{pad(result.score)}</p>
          {run ? (
            <form className="xrun-form" onSubmit={send}>
              <input
                className="xrun-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre pseudo"
                aria-label="Pseudo pour le classement"
                minLength={2}
                maxLength={16}
                required
                autoComplete="nickname"
                enterKeyHint="send"
              />
              <button type="submit" className="xrun-btn" disabled={submit.state === "sending"}>
                {submit.state === "sending" ? "Envoi…" : "Classer mon score"}
              </button>
            </form>
          ) : (
            <p className="xrun-hint smallcap">
              {mine ? `Classé n°${mine.rank} au classement` : `Record : ${pad(result.best)}`}
            </p>
          )}
          {submit.state === "error" && <p className="xrun-error smallcap" role="alert">{submit.message}</p>}
          <div className="xrun-actions">
            <button type="button" className="xrun-btn xrun-btn--accent" onClick={start}>Rejouer</button>
            <button type="button" className="xrun-btn" onClick={openBookCall}>Construisons le vôtre</button>
          </div>
        </div>
      )}

      <div className="xrun-controls">
        {(phase === "playing" || phase === "paused") && (
          <button type="button" className="xrun-ctrl" onClick={togglePause} aria-label={phase === "playing" ? "Pause" : "Reprendre"}>
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
              {phase === "playing" ? <path d="M4 2h3v12H4zM9 2h3v12H9z" fill="currentColor" /> : <path d="M4 2l10 6-10 6z" fill="currentColor" />}
            </svg>
          </button>
        )}
        <button
          type="button"
          className="xrun-ctrl"
          onClick={fullscreen ? exitFullscreen : enterFullscreen}
          aria-label={fullscreen ? "Quitter le plein écran" : "Jouer en plein écran"}
          aria-pressed={fullscreen}
        >
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
            <path
              d={fullscreen ? "M6 1v5H1M10 1v5h5M6 15v-5H1M10 15v-5h5" : "M1 6V1h5M15 6V1h-5M1 10v5h5M15 10v5h-5"}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            />
          </svg>
          {fullscreen && <span className="smallcap">Quitter</span>}
        </button>
      </div>
    </div>
    {fullscreen && <p className="xrun-rotate smallcap" aria-hidden="true">Tournez votre téléphone pour jouer en grand</p>}
    </div>

    <aside className="xrun-board" aria-label="Classement 0x-Run">
      <p className="xrun-board-title smallcap">Classement</p>
      {top === null ? (
        <p className="xrun-board-empty">Chargement…</p>
      ) : top.length === 0 ? (
        <p className="xrun-board-empty">Aucun score pour l&apos;instant. À vous de jouer !</p>
      ) : (
        <ol className="xrun-board-list">
          {top.map((entry, i) => (
            <li
              key={entry.name.toLowerCase()}
              className={mine && entry.name.toLowerCase() === mine.name.toLowerCase() ? "is-me" : undefined}
            >
              <span className="xrun-board-rank">{String(i + 1).padStart(2, "0")}</span>
              <span className="xrun-board-name">{entry.name}</span>
              <b>{pad(entry.score)}</b>
            </li>
          ))}
        </ol>
      )}
      {stats && stats.plays > 0 && <p className="xrun-board-stats">{formatStats(stats)}</p>}
    </aside>
    </div>
  );
}
