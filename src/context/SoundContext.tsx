import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type SoundName = "whistle" | "cheer" | "champion" | "click";

interface SoundContextValue {
  muted: boolean;
  toggleMute: () => void;
  setMuted: (m: boolean) => void;
  play: (name: SoundName, opts?: { volume?: number }) => void;
}

const SoundContext = createContext<SoundContextValue | undefined>(undefined);

const STORAGE_KEY = "sportsbracket:muted";

/**
 * Lightweight WebAudio-based sound effects — no external assets.
 * Procedurally generated whistle, crowd cheer, champion fanfare, and click.
 * Respects a global mute toggle persisted in localStorage.
 */
export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [muted, setMutedState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "1";
  });
  const ctxRef = useRef<AudioContext | null>(null);

  const setMuted = useCallback((m: boolean) => {
    setMutedState(m);
    try {
      localStorage.setItem(STORAGE_KEY, m ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleMute = useCallback(() => setMuted(!muted), [muted, setMuted]);

  const ensureCtx = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctxRef.current = new Ctor();
    }
    if (ctxRef.current.state === "suspended") {
      void ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const play = useCallback(
    (name: SoundName, opts?: { volume?: number }) => {
      if (muted) return;
      const ctx = ensureCtx();
      if (!ctx) return;
      const baseVol = opts?.volume ?? 0.35;
      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.value = baseVol;
      master.connect(ctx.destination);

      if (name === "whistle") {
        // Sharp two-note referee whistle
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(2400, now);
        osc.frequency.linearRampToValueAtTime(2700, now + 0.08);
        osc.frequency.linearRampToValueAtTime(2500, now + 0.35);
        // tremolo for "trill"
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 28;
        lfoGain.gain.value = 80;
        lfo.connect(lfoGain).connect(osc.frequency);
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(0.6, now + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
        osc.connect(g).connect(master);
        osc.start(now);
        lfo.start(now);
        osc.stop(now + 0.5);
        lfo.stop(now + 0.5);
      } else if (name === "cheer") {
        // Filtered noise burst → crowd
        const bufferSize = ctx.sampleRate * 1.6;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          // pink-ish noise with slight modulation
          data[i] = (Math.random() * 2 - 1) * (0.6 + Math.sin(i / 800) * 0.3);
        }
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 900;
        filter.Q.value = 0.7;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(0.55, now + 0.25);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
        src.connect(filter).connect(g).connect(master);
        src.start(now);
        src.stop(now + 1.7);
      } else if (name === "champion") {
        // Triumphant arpeggio + cheer underlay
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
        notes.forEach((freq, i) => {
          const t = now + i * 0.12;
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.value = freq;
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(0.5, t + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
          osc.connect(g).connect(master);
          osc.start(t);
          osc.stop(t + 0.65);
        });
        // crowd underlay
        const bufferSize = ctx.sampleRate * 2.2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.7;
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 1100;
        filter.Q.value = 0.6;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(0.4, now + 0.4);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
        src.connect(filter).connect(g).connect(master);
        src.start(now);
        src.stop(now + 2.3);
      } else if (name === "click") {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "square";
        osc.frequency.value = 660;
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(0.25, now + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
        osc.connect(g).connect(master);
        osc.start(now);
        osc.stop(now + 0.08);
      }
    },
    [muted, ensureCtx]
  );

  // Resume audio context on first user interaction (browser autoplay policy)
  useEffect(() => {
    const handler = () => ensureCtx();
    window.addEventListener("pointerdown", handler, { once: true });
    window.addEventListener("keydown", handler, { once: true });
    return () => {
      window.removeEventListener("pointerdown", handler);
      window.removeEventListener("keydown", handler);
    };
  }, [ensureCtx]);

  const value = useMemo<SoundContextValue>(
    () => ({ muted, toggleMute, setMuted, play }),
    [muted, toggleMute, setMuted, play]
  );

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
};

export const useSound = () => {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error("useSound must be used within SoundProvider");
  return ctx;
};
