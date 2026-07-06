const activeTimers = new Map<string, number>();

function isDevEnvironment() {
  if (!import.meta.env.DEV) return false;
  try {
    return window.localStorage.getItem("debug:timing") === "1";
  } catch {
    return false;
  }
}

export function startDevTimer(label: string) {
  if (!isDevEnvironment()) return;
  activeTimers.set(label, performance.now());
}

export function endDevTimer(label: string, fallbackMessage?: string) {
  if (!isDevEnvironment()) return;
  const startedAt = activeTimers.get(label);
  if (startedAt == null) return;

  activeTimers.delete(label);
  const duration = performance.now() - startedAt;
  console.log(fallbackMessage || `${label}: ${duration} ms`);
}

export function restartDevTimer(label: string) {
  if (!isDevEnvironment()) return;
  startDevTimer(label);
}
