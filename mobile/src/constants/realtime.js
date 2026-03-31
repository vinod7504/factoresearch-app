const LIVE_ERROR_BACKOFF_MS = 1000;
const LIVE_SUCCESS_TICK_MS = Math.max(500, Number(process.env.EXPO_PUBLIC_LIVE_TICK_MS || 1000));

export const startContinuousRefresh = (task, options = {}) => {
  const { enabled = true, successTickMs = LIVE_SUCCESS_TICK_MS, errorBackoffMs = LIVE_ERROR_BACKOFF_MS } = options;

  if (!enabled || typeof task !== "function") {
    return () => {};
  }

  let cancelled = false;
  let timeoutId = null;

  const schedule = (delayMs = 0) => {
    timeoutId = setTimeout(run, Math.max(0, delayMs));
  };

  const run = async () => {
    if (cancelled) {
      return;
    }

    try {
      await task();
      schedule(successTickMs);
    } catch (_error) {
      schedule(errorBackoffMs);
    }
  };

  schedule(0);

  return () => {
    cancelled = true;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
};
