import { ensureAudio, isStealth } from "@/lib/audio";

/** All synthesizer IDs — includes legacy names so older scrapbooks still play. */
export type PokeSoundType =
  | "pop"
  | "knock"
  | "magic"
  | "fairy"
  | "sweet"
  | "camera"
  | "drip"
  | "purr"
  | "ding"
  | "twinkle"
  | "love"
  | "whisper"
  | "bell"
  | "marimba";

let pokeCtx: AudioContext | null = null;

function getPokeCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return null;
  if (!pokeCtx) pokeCtx = new AudioCtx();
  return pokeCtx;
}

function tone(
  ctx: AudioContext,
  {
    freq,
    type = "sine",
    start,
    dur,
    gain = 0.35,
    freqEnd,
  }: {
    freq: number;
    type?: OscillatorType;
    start: number;
    dur: number;
    gain?: number;
    freqEnd?: number;
  },
) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (freqEnd != null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), start + dur);
  }
  g.gain.setValueAtTime(Math.max(gain, 0.001), start);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

function noiseBurst(
  ctx: AudioContext,
  start: number,
  dur: number,
  gain = 0.2,
  filterFreq = 1200,
) {
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(filterFreq, start);
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur);
  src.connect(filter);
  filter.connect(g);
  g.connect(ctx.destination);
  src.start(start);
  src.stop(start + dur + 0.02);
}

function synthesize(ctx: AudioContext, soundType: PokeSoundType) {
  const now = ctx.currentTime;

  switch (soundType) {
    case "pop": {
      // Bestie Pop — bubbly rubber pop
      tone(ctx, {
        freq: 240,
        freqEnd: 900,
        type: "sine",
        start: now,
        dur: 0.1,
        gain: 0.4,
      });
      break;
    }
    case "knock": {
      // Secret Knock — two soft wooden knocks
      [0, 0.13].forEach((delay) => {
        tone(ctx, {
          freq: 165,
          type: "sine",
          start: now + delay,
          dur: 0.055,
          gain: 0.42,
        });
        noiseBurst(ctx, now + delay, 0.04, 0.12, 400);
      });
      break;
    }
    case "magic": {
      // Magic Wish — ascending sparkle chime
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        tone(ctx, {
          freq,
          type: "triangle",
          start: now + idx * 0.08,
          dur: 0.4,
          gain: 0.28,
        });
      });
      break;
    }
    case "fairy":
    case "bell": {
      // Fairy Chime / legacy bell — bright ringing overtones
      [880, 1320, 1760].forEach((freq, idx) => {
        tone(ctx, {
          freq,
          type: "sine",
          start: now + idx * 0.02,
          dur: 0.75 - idx * 0.12,
          gain: 0.32 - idx * 0.08,
        });
      });
      break;
    }
    case "sweet":
    case "marimba": {
      // Sweet Snick — candy click + soft marimba bounce
      tone(ctx, {
        freq: 920,
        freqEnd: 1400,
        type: "square",
        start: now,
        dur: 0.045,
        gain: 0.18,
      });
      [587.33, 880].forEach((freq, idx) => {
        tone(ctx, {
          freq,
          type: "triangle",
          start: now + 0.05 + idx * 0.09,
          dur: 0.25,
          gain: 0.3,
        });
      });
      break;
    }
    case "camera": {
      // Camera Snap — shutter click
      noiseBurst(ctx, now, 0.035, 0.35, 2800);
      tone(ctx, {
        freq: 1800,
        freqEnd: 400,
        type: "square",
        start: now + 0.01,
        dur: 0.05,
        gain: 0.12,
      });
      noiseBurst(ctx, now + 0.06, 0.02, 0.2, 1800);
      break;
    }
    case "drip": {
      // Drip Drop — two water plinks
      [0, 0.18].forEach((delay, i) => {
        tone(ctx, {
          freq: i === 0 ? 720 : 540,
          freqEnd: 220,
          type: "sine",
          start: now + delay,
          dur: 0.22,
          gain: 0.32,
        });
      });
      break;
    }
    case "purr": {
      // Kitten Purr — soft modulated rumble
      const osc = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const g = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(55, now);
      lfo.frequency.setValueAtTime(18, now);
      lfoGain.gain.setValueAtTime(12, now);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.12, now + 0.08);
      g.gain.linearRampToValueAtTime(0.001, now + 0.55);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now);
      lfo.start(now);
      osc.stop(now + 0.6);
      lfo.stop(now + 0.6);
      break;
    }
    case "ding": {
      // Ding Dong — doorbell pair
      tone(ctx, { freq: 740, type: "sine", start: now, dur: 0.45, gain: 0.35 });
      tone(ctx, {
        freq: 554,
        type: "sine",
        start: now + 0.28,
        dur: 0.55,
        gain: 0.32,
      });
      break;
    }
    case "twinkle": {
      // Star Twinkle — tiny glitter notes
      [1174.7, 1480, 1760, 2349].forEach((freq, idx) => {
        tone(ctx, {
          freq,
          type: "sine",
          start: now + idx * 0.07,
          dur: 0.28,
          gain: 0.22,
        });
      });
      break;
    }
    case "love": {
      // Love Sparkle — warm heart arpeggio
      [392, 523.25, 659.25, 784].forEach((freq, idx) => {
        tone(ctx, {
          freq,
          type: "triangle",
          start: now + idx * 0.1,
          dur: 0.45,
          gain: 0.28,
        });
      });
      break;
    }
    case "whisper": {
      // Secret Whisper — soft filtered hush + tiny ping
      noiseBurst(ctx, now, 0.35, 0.1, 900);
      tone(ctx, {
        freq: 980,
        type: "sine",
        start: now + 0.12,
        dur: 0.2,
        gain: 0.12,
      });
      break;
    }
    default: {
      tone(ctx, {
        freq: 660,
        type: "sine",
        start: now,
        dur: 0.2,
        gain: 0.25,
      });
    }
  }
}

/** Soft Web Audio SFX for sound charms. Instant — no network. Respects Stealth Mode. */
export function playPokeSound(soundType: PokeSoundType) {
  if (typeof window === "undefined" || isStealth()) return;

  void ensureAudio().then(() => {
    const ctx = getPokeCtx();
    if (!ctx) return;
    void ctx.resume().then(() => {
      try {
        synthesize(ctx, soundType);
      } catch {
        /* ignore synthesis glitches */
      }
    });
  });
}
