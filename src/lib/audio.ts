let stealth = false;
let ctx: AudioContext | null = null;
let unlocked = false;

export function loadStealthPreference() {
  if (typeof window === "undefined") return false;
  stealth = localStorage.getItem("sc_stealth") === "1";
  return stealth;
}

export function setStealthMode(on: boolean) {
  stealth = on;
  localStorage.setItem("sc_stealth", on ? "1" : "0");
}

export function isStealth() {
  return stealth;
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  return ctx;
}

/** Call on first user gesture so subsequent SFX can play. */
export async function ensureAudio(): Promise<void> {
  const audio = getCtx();
  if (!audio) return;
  if (audio.state === "suspended") {
    try {
      await audio.resume();
    } catch {
      /* ignore */
    }
  }
  unlocked = audio.state === "running";
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType,
  gainValue: number,
  slideTo?: number,
) {
  if (stealth || typeof window === "undefined") return;
  const audio = getCtx();
  if (!audio) return;
  void audio.resume().then(() => {
    const t0 = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration * 0.85);
    }
    gain.gain.setValueAtTime(gainValue, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  });
}

export function playPop() {
  tone(520, 0.07, "sine", 0.05);
  tone(780, 0.05, "triangle", 0.03);
}

export function playChime() {
  tone(660, 0.09, "sine", 0.045);
  tone(990, 0.12, "triangle", 0.035);
}

/** Gentle rising/falling marimba blip mapped from a 0–360 hue slider */
export function playMarimbaPitch(hue: number) {
  if (stealth || typeof window === "undefined") return;
  const audio = getCtx();
  if (!audio) return;
  const h = ((hue % 360) + 360) % 360;
  // Map hue → soft pentatonic-ish range (~220–880 Hz)
  const freq = 220 * Math.pow(2, (h / 360) * 2);
  void audio.resume().then(() => {
    const t0 = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t0);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.92, t0 + 0.14);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.055, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(t0);
    osc.stop(t0 + 0.18);
  });
}

/** Soft paper flutter for scrapbook page turns */
export function playPageTurn() {
  if (stealth || typeof window === "undefined") return;
  const audio = getCtx();
  if (!audio) return;
  void audio.resume().then(() => {
    const t0 = audio.currentTime;
    // Soft whoosh / flutter (filtered noise via layered triangles)
    const flutter = [
      { f: 180, d: 0.18, g: 0.04, type: "triangle" as const },
      { f: 320, d: 0.14, g: 0.03, type: "sine" as const },
      { f: 90, d: 0.22, g: 0.025, type: "sawtooth" as const },
    ];
    flutter.forEach((n, i) => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = n.type;
      osc.frequency.setValueAtTime(n.f, t0 + i * 0.02);
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(40, n.f * 0.55),
        t0 + n.d,
      );
      gain.gain.setValueAtTime(0.0001, t0 + i * 0.02);
      gain.gain.exponentialRampToValueAtTime(n.g, t0 + i * 0.02 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + n.d);
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start(t0 + i * 0.02);
      osc.stop(t0 + n.d + 0.04);
    });
  });
}

/** Satisfying camera shutter + soft chime for Add Snap */
export function playShutterClick() {
  if (stealth || typeof window === "undefined") return;
  const audio = getCtx();
  if (!audio) return;
  void audio.resume().then(() => {
    const t0 = audio.currentTime;
    // Mechanical click
    const click = audio.createOscillator();
    const clickGain = audio.createGain();
    click.type = "square";
    click.frequency.setValueAtTime(180, t0);
    click.frequency.exponentialRampToValueAtTime(60, t0 + 0.04);
    clickGain.gain.setValueAtTime(0.12, t0);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05);
    click.connect(clickGain);
    clickGain.connect(audio.destination);
    click.start(t0);
    click.stop(t0 + 0.06);
    // Soft confirmation chime
    [880, 1174].forEach((f, i) => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(f, t0 + 0.05 + i * 0.05);
      gain.gain.setValueAtTime(0.0001, t0 + 0.05 + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.06, t0 + 0.05 + i * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05 + i * 0.05 + 0.22);
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start(t0 + 0.05 + i * 0.05);
      osc.stop(t0 + 0.05 + i * 0.05 + 0.26);
    });
  });
}

export function playUnlockSound() {
  if (stealth || typeof window === "undefined") return;
  const audio = getCtx();
  if (!audio) return;
  void audio.resume().then(() => {
    const t0 = audio.currentTime;
    const notes = [262, 330, 392, 523, 784];
    notes.forEach((f, i) => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = i % 2 === 0 ? "triangle" : "sine";
      osc.frequency.setValueAtTime(f, t0 + i * 0.07);
      gain.gain.setValueAtTime(0.0001, t0 + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.07, t0 + i * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.07 + 0.28);
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start(t0 + i * 0.07);
      osc.stop(t0 + i * 0.07 + 0.32);
    });
  });
}

export function isAudioUnlocked() {
  return unlocked;
}
