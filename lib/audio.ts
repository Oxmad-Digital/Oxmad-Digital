"use client";

/**
 * Oxmad sound engine: ambient tracks generated live with the Web Audio API, one
 * orchestral recording streamed on demand, and the short interface sounds played on clicks.
 * Nothing makes a sound until the visitor asks for it: the AudioContext is only
 * created from a click, and music never starts on its own.
 */

export type TrackId = "lagon" | "pirate" | "horizon" | "electro";
export type UiSound = "click" | "hover" | "open" | "close" | "select";

export type AudioState = { track: TrackId; playing: boolean; volume: number; uiSounds: boolean };

type Voice = { ctx: AudioContext; out: AudioNode; wet: AudioNode; time: number; stepDur: number };
type Track = {
  id: TrackId;
  title: string;
  mood: string;
  /** Shown in the list; recordings have none. */
  bpm?: number;
  /** Author of the recording, linked under the player. */
  credit?: { text: string; href: string };
  /** Delay of every other 16th, as a share of a step (lo-fi groove). */
  swing?: number;
  /** Continuous layers (sea, hiss…); returns their stop function. */
  setup?: (ctx: AudioContext, out: AudioNode) => (when: number) => void;
  /** Schedules the notes of one 16th-note step (generated tracks only). */
  step?: (v: Voice, step: number) => void;
};

// ─── Instruments ───

const freq = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
const pick = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];

type ToneOptions = {
  type: OscillatorType; midi: number; gain: number;
  dur?: number; attack?: number; release?: number; cutoff?: number; detune?: number; send?: number;
};

function tone(v: Voice, o: ToneOptions) {
  const { ctx, time } = v;
  const attack = o.attack ?? 0.005;
  const hold = Math.max(attack, o.dur ?? 0);
  const release = o.release ?? 0.1;
  const osc = ctx.createOscillator();
  osc.type = o.type;
  osc.frequency.value = freq(o.midi);
  osc.detune.value = o.detune ?? 0;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, time);
  g.gain.linearRampToValueAtTime(o.gain, time + attack);
  g.gain.setValueAtTime(o.gain, time + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, time + hold + release);
  let src: AudioNode = osc;
  if (o.cutoff) {
    const f = ctx.createBiquadFilter();
    f.frequency.value = o.cutoff;
    osc.connect(f);
    src = f;
  }
  src.connect(g).connect(v.out);
  if (o.send) {
    const s = ctx.createGain();
    s.gain.value = o.send;
    g.connect(s).connect(v.wet);
  }
  osc.start(time);
  osc.stop(time + hold + release + 0.05);
}

const chord = (v: Voice, notes: number[], o: Omit<ToneOptions, "midi">) => notes.forEach((midi) => tone(v, { ...o, midi }));

const noiseBuffers = new WeakMap<AudioContext, AudioBuffer>();
function noiseBuffer(ctx: AudioContext) {
  let buf = noiseBuffers.get(ctx);
  if (!buf) {
    buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noiseBuffers.set(ctx, buf);
  }
  return buf;
}

function noise(v: Voice, o: { gain: number; decay: number; filter: BiquadFilterType; freq: number; q?: number; send?: number }) {
  const { ctx, time } = v;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  const f = ctx.createBiquadFilter();
  f.type = o.filter;
  f.frequency.value = o.freq;
  f.Q.value = o.q ?? 1;
  const g = ctx.createGain();
  g.gain.setValueAtTime(o.gain, time);
  g.gain.exponentialRampToValueAtTime(0.0001, time + o.decay);
  src.connect(f).connect(g).connect(v.out);
  if (o.send) {
    const s = ctx.createGain();
    s.gain.value = o.send;
    g.connect(s).connect(v.wet);
  }
  src.start(time, Math.random());
  src.stop(time + o.decay + 0.05);
}

function kick(v: Voice, gain: number, from = 150) {
  const { ctx, time } = v;
  const osc = ctx.createOscillator();
  osc.frequency.setValueAtTime(from, time);
  osc.frequency.exponentialRampToValueAtTime(42, time + 0.13);
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, time);
  g.gain.exponentialRampToValueAtTime(0.0001, time + 0.42);
  osc.connect(g).connect(v.out);
  osc.start(time);
  osc.stop(time + 0.45);
}

const snare = (v: Voice, gain: number, send = 0.2) => {
  noise(v, { gain, decay: 0.18, filter: "bandpass", freq: 1900, q: 0.8, send });
  tone(v, { type: "triangle", midi: 53, gain: gain * 0.6, release: 0.08 });
};
const hat = (v: Voice, gain: number, decay = 0.04) => noise(v, { gain, decay, filter: "highpass", freq: 7500 });

/** Looped filtered noise whose level follows a slow LFO (sea swell, vinyl hiss). */
function noiseBed(ctx: AudioContext, out: AudioNode, o: { gain: number; cutoff: number; lfo?: number; depth?: number }) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.frequency.value = o.cutoff;
  const g = ctx.createGain();
  g.gain.value = o.gain;
  src.connect(f).connect(g).connect(out);
  const lfo = ctx.createOscillator();
  if (o.lfo) {
    lfo.frequency.value = o.lfo;
    const depth = ctx.createGain();
    depth.gain.value = o.depth ?? o.gain * 0.8;
    lfo.connect(depth).connect(g.gain);
    lfo.start();
  }
  src.start();
  return (when: number) => {
    src.stop(when);
    if (o.lfo) lfo.stop(when);
  };
}

/** Streams a looped recording through the track bus (so volume, fades and the visualizer apply). */
function recording(src: string) {
  return (ctx: AudioContext, out: AudioNode) => {
    const el = new Audio(src);
    el.loop = true;
    const node = ctx.createMediaElementSource(el);
    node.connect(out);
    el.play().catch(() => {});
    return (when: number) => {
      setTimeout(() => {
        el.pause();
        el.removeAttribute("src");
        node.disconnect();
      }, Math.max(0, when - ctx.currentTime) * 1000);
    };
  };
}

// ─── Tracks ───
// Steps are 16th notes, so a bar is 16 steps.

const LAGON_CHORDS = [[53, 57, 60, 64], [57, 60, 64, 67], [50, 57, 60, 64], [46, 53, 57, 62]];
const LAGON_BELLS = [72, 74, 76, 79, 81, 84];

const HORIZON_CHORDS = [[52, 55, 59], [48, 52, 55], [55, 59, 62], [50, 54, 57]];
const HORIZON_LEAD = [[71, 0, 67, 0], [72, 0, 76, 74], [74, 0, 71, 0], [69, 0, 66, 69]];

const ELECTRO_ROOTS = [45, 41, 48, 43];
const ELECTRO_CHORDS = [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62]];
const ELECTRO_ARP = [0, 2, 1, 2, 0, 2, 1, 2];

export const TRACKS: readonly Track[] = [
  {
    id: "lagon",
    title: "Lagon",
    mood: "Nappes & houle · ambient",
    bpm: 64,
    setup: (ctx, out) => noiseBed(ctx, out, { gain: 0.035, cutoff: 480, lfo: 0.07 }),
    step(v, step) {
      const bar = Math.floor(step / 16) % 4;
      const notes = LAGON_CHORDS[bar];
      if (step % 16 === 0) {
        const dur = v.stepDur * 16;
        chord(v, notes, { type: "sawtooth", gain: 0.022, dur, attack: 1.6, release: 2.2, cutoff: 900, detune: -7, send: 0.7 });
        chord(v, notes, { type: "sawtooth", gain: 0.022, dur, attack: 1.6, release: 2.2, cutoff: 900, detune: 7, send: 0.7 });
        tone(v, { type: "sine", midi: notes[0] - 12, gain: 0.12, dur, attack: 0.6, release: 1.5 });
      }
      if (step % 2 === 0 && Math.random() < 0.22) {
        tone(v, { type: "sine", midi: pick(LAGON_BELLS), gain: 0.05, release: 2.4, send: 0.9 });
      }
    },
  },
  {
    id: "pirate",
    title: "Pirate Tavern",
    mood: "Ambiance taverne · pirate",
    credit: { text: "Magiksolo · Pixabay", href: "https://pixabay.com/music/main-title-pirate-tavern-full-version-167990/" },
    setup: recording("/sounds/pirate-tavern.mp3"),
  },
  {
    id: "horizon",
    title: "Horizon",
    mood: "Basse pulsée · synthwave",
    bpm: 98,
    step(v, step) {
      const s = step % 16;
      const bar = Math.floor(step / 16) % 4;
      const notes = HORIZON_CHORDS[bar];
      tone(v, { type: "sawtooth", midi: notes[0] - 24 + (s % 4 === 2 ? 12 : 0), gain: 0.05, dur: 0.06, release: 0.06, cutoff: 520 + (s % 8) * 60 });
      if (s === 0) {
        const dur = v.stepDur * 16;
        chord(v, notes, { type: "sawtooth", gain: 0.014, dur, attack: 0.5, release: 1, cutoff: 1500, detune: -9, send: 0.5 });
        chord(v, notes, { type: "sawtooth", gain: 0.014, dur, attack: 0.5, release: 1, cutoff: 1500, detune: 9, send: 0.5 });
      }
      if (s % 4 === 0) {
        const lead = HORIZON_LEAD[bar][s / 4];
        if (lead) tone(v, { type: "triangle", midi: lead, gain: 0.05, dur: v.stepDur * 3, attack: 0.03, release: 0.6, send: 0.7 });
        kick(v, 0.45);
      }
      if (s === 4 || s === 12) snare(v, 0.1, 0.8);
      if (s % 4 === 2) hat(v, 0.03);
    },
  },
  {
    id: "electro",
    title: "Neon Run",
    mood: "Four-on-the-floor · electro",
    bpm: 124,
    step(v, step) {
      const s = step % 16;
      const bar = Math.floor(step / 16) % 4;
      const notes = ELECTRO_CHORDS[bar];
      if (s % 4 === 0) kick(v, 0.55, 170);
      if (s === 4 || s === 12) snare(v, 0.09, 0.5);
      if (s % 4 === 2) hat(v, 0.05, 0.12);
      else if (s % 2 === 1) hat(v, 0.02, 0.03);
      // Rolling bass between the kicks, an octave jump on the last off-beats.
      if (s % 4 !== 0) {
        const lift = s % 8 === 6 ? 12 : 0;
        tone(v, { type: "sawtooth", midi: ELECTRO_ROOTS[bar] + lift, gain: 0.07, dur: v.stepDur * 0.7, release: 0.05, cutoff: 420 + bar * 90 + (s % 8) * 50 });
      }
      // Plucky saw arpeggio, louder on the beat.
      tone(v, { type: "sawtooth", midi: notes[ELECTRO_ARP[s % 8]] + 12 + (s >= 8 ? 12 : 0), gain: s % 4 === 0 ? 0.03 : 0.018, dur: v.stepDur * 0.5, release: 0.12, cutoff: 2600, send: 0.45 });
      if (s === 0) {
        const dur = v.stepDur * 16;
        chord(v, notes, { type: "sawtooth", gain: 0.012, dur, attack: 0.3, release: 0.8, cutoff: 1400, detune: -10, send: 0.6 });
        chord(v, notes, { type: "sawtooth", gain: 0.012, dur, attack: 0.3, release: 0.8, cutoff: 1400, detune: 10, send: 0.6 });
      }
    },
  },
];

// ─── Engine ───

const STORAGE_KEY = "ox-audio";
const DEFAULT_STATE: AudioState = { track: "lagon", playing: false, volume: 0.6, uiSounds: false };

let state = DEFAULT_STATE;
if (typeof window !== "undefined") {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    // Music is never resumed on load: only the preferences are restored.
    state = { ...DEFAULT_STATE, ...saved, playing: false };
    if (!TRACKS.some((t) => t.id === state.track)) state.track = DEFAULT_STATE.track;
  } catch {}
}

const listeners = new Set<() => void>();
function setState(patch: Partial<AudioState>) {
  state = { ...state, ...patch };
  try {
    const { track, volume, uiSounds } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ track, volume, uiSounds }));
  } catch {}
  listeners.forEach((l) => l());
}

export const audioStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  get: () => state,
  getServer: () => DEFAULT_STATE,
};

type Graph = { ctx: AudioContext; master: GainNode; music: GainNode; ui: GainNode; reverb: ConvolverNode; analyser: AnalyserNode };
let graph: Graph | null = null;

/** Short decaying-noise impulse: a cheap, warm room for the tracks. */
function impulse(ctx: AudioContext, seconds: number) {
  const buf = ctx.createBuffer(2, ctx.sampleRate * seconds, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const data = buf.getChannelData(c);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 3;
  }
  return buf;
}

/** Creates the audio graph on first use; must be called from a user gesture. */
function ensureGraph() {
  if (!graph) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    const ctx = new AC();
    const master = ctx.createGain();
    master.gain.value = state.volume;
    const music = ctx.createGain();
    const ui = ctx.createGain();
    ui.gain.value = 0.7;
    const reverb = ctx.createConvolver();
    reverb.buffer = impulse(ctx, 2.8);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.82;
    const comp = ctx.createDynamicsCompressor();
    reverb.connect(music);
    music.connect(analyser).connect(master);
    ui.connect(master);
    master.connect(comp).connect(ctx.destination);
    graph = { ctx, master, music, ui, reverb, analyser };
  }
  if (graph.ctx.state === "suspended") graph.ctx.resume().catch(() => {});
  return graph;
}

export const getAnalyser = () => graph?.analyser ?? null;

let current: { timer: number; bus: GainNode; wet: GainNode; stopSetup?: (when: number) => void } | null = null;

function stopMusic() {
  if (!current || !graph) return;
  const { timer, bus, wet, stopSetup } = current;
  const now = graph.ctx.currentTime;
  clearInterval(timer);
  bus.gain.setTargetAtTime(0, now, 0.12);
  wet.gain.setTargetAtTime(0, now, 0.2);
  stopSetup?.(now + 0.8);
  setTimeout(() => {
    bus.disconnect();
    wet.disconnect();
  }, 2500);
  current = null;
}

// A hot reload in development re-runs this module with a fresh, paused state while the
// previous instance keeps playing out of reach: silence it before taking over.
if (typeof window !== "undefined") {
  const w = window as Window & { __oxAudioDispose?: () => void };
  w.__oxAudioDispose?.();
  w.__oxAudioDispose = () => {
    stopMusic();
    graph?.ctx.close().catch(() => {});
    graph = null;
  };
}

function startMusic(id: TrackId) {
  const g = ensureGraph();
  if (!g) return;
  stopMusic();
  const track = TRACKS.find((t) => t.id === id)!;
  const { ctx } = g;
  const bus = ctx.createGain();
  bus.gain.setValueAtTime(0, ctx.currentTime);
  bus.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.2);
  bus.connect(g.music);
  // Reverb send of this track only, faded with the bus so a pause leaves no tail behind.
  const wet = ctx.createGain();
  wet.connect(g.reverb);

  const stepDur = 60 / (track.bpm ?? 120) / 4;
  let next = ctx.currentTime + 0.08;
  let step = 0;
  // Look further ahead in a background tab, whose timers only fire about once a second.
  const schedule = () => {
    const horizon = ctx.currentTime + (document.hidden ? 1.5 : 0.15);
    while (track.step && next < horizon) {
      const swing = step % 2 ? (track.swing ?? 0) * stepDur : 0;
      track.step!({ ctx, out: bus, wet, time: next + swing, stepDur }, step);
      next += stepDur;
      step++;
    }
  };
  const stopSetup = track.setup?.(ctx, bus);
  schedule();
  current = { timer: window.setInterval(schedule, 25), bus, wet, stopSetup };
}

export function play(id: TrackId = state.track) {
  startMusic(id);
  setState({ track: id, playing: !!graph });
}

export function pause() {
  stopMusic();
  setState({ playing: false });
}

export const togglePlay = () => (state.playing ? pause() : play());

export function skip(dir: 1 | -1) {
  const i = TRACKS.findIndex((t) => t.id === state.track);
  const id = TRACKS[(i + dir + TRACKS.length) % TRACKS.length].id;
  if (state.playing) play(id);
  else setState({ track: id });
}

export function setVolume(volume: number) {
  if (graph) graph.master.gain.setTargetAtTime(volume, graph.ctx.currentTime, 0.03);
  setState({ volume });
}

export const setUiSounds = (uiSounds: boolean) => setState({ uiSounds });

let lastHover = 0;

/** Interface sounds; silent unless the visitor turned them on. */
export function uiSound(kind: UiSound) {
  if (!state.uiSounds) return;
  if (kind === "hover") {
    // Hovers never create the context (not a gesture) and are throttled.
    if (!graph || graph.ctx.state !== "running" || performance.now() - lastHover < 60) return;
    lastHover = performance.now();
  }
  const g = ensureGraph();
  if (!g) return;
  const v: Voice = { ctx: g.ctx, out: g.ui, wet: g.ui, time: g.ctx.currentTime + 0.005, stepDur: 0 };
  const at = (delay: number) => ({ ...v, time: v.time + delay });

  switch (kind) {
    case "click": {
      const osc = g.ctx.createOscillator();
      const gain = g.ctx.createGain();
      const f = 1250 * (0.94 + Math.random() * 0.12);
      osc.type = "triangle";
      osc.frequency.setValueAtTime(f, v.time);
      osc.frequency.exponentialRampToValueAtTime(f / 2.2, v.time + 0.05);
      gain.gain.setValueAtTime(0.16, v.time);
      gain.gain.exponentialRampToValueAtTime(0.0001, v.time + 0.07);
      osc.connect(gain).connect(g.ui);
      osc.start(v.time);
      osc.stop(v.time + 0.08);
      noise(v, { gain: 0.05, decay: 0.012, filter: "highpass", freq: 4000 });
      break;
    }
    case "hover":
      tone(v, { type: "sine", midi: 98 + Math.floor(Math.random() * 3), gain: 0.018, release: 0.03 });
      break;
    case "open":
      [84, 88, 91].forEach((midi, i) => tone(at(i * 0.045), { type: "sine", midi, gain: 0.07, release: 0.18 }));
      break;
    case "close":
      [91, 88, 84].forEach((midi, i) => tone(at(i * 0.04), { type: "sine", midi, gain: 0.06, release: 0.14 }));
      break;
    case "select":
      tone(v, { type: "square", midi: 79, gain: 0.03, release: 0.05, cutoff: 3000 });
      tone(at(0.05), { type: "square", midi: 86, gain: 0.03, release: 0.09, cutoff: 3000 });
      break;
  }
}
