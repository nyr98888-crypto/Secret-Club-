const KEY_PREFIX = "sc_lockout:";

type LockoutState = {
  failedAttempts: number;
  lockedUntil: number | null;
};

function read(key: string): LockoutState {
  if (typeof window === "undefined") {
    return { failedAttempts: 0, lockedUntil: null };
  }
  try {
    const raw = sessionStorage.getItem(KEY_PREFIX + key);
    if (!raw) return { failedAttempts: 0, lockedUntil: null };
    return JSON.parse(raw) as LockoutState;
  } catch {
    return { failedAttempts: 0, lockedUntil: null };
  }
}

function write(key: string, state: LockoutState) {
  sessionStorage.setItem(KEY_PREFIX + key, JSON.stringify(state));
}

export function getLockout(key: string) {
  const state = read(key);
  if (state.lockedUntil && Date.now() >= state.lockedUntil) {
    const reset = { failedAttempts: 0, lockedUntil: null };
    write(key, reset);
    return reset;
  }
  return state;
}

export function registerFailure(key: string) {
  const state = getLockout(key);
  const failedAttempts = state.failedAttempts + 1;
  const next: LockoutState = {
    failedAttempts,
    lockedUntil:
      failedAttempts >= 5 ? Date.now() + 60_000 : state.lockedUntil,
  };
  write(key, next);
  return next;
}

export function clearFailures(key: string) {
  write(key, { failedAttempts: 0, lockedUntil: null });
}

export function remainingLockMs(key: string) {
  const state = getLockout(key);
  if (!state.lockedUntil) return 0;
  return Math.max(0, state.lockedUntil - Date.now());
}
