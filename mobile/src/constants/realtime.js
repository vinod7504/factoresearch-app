const parsedRefreshMs = Number(process.env.EXPO_PUBLIC_AUTO_REFRESH_MS);

const baseRefreshMs =
  Number.isFinite(parsedRefreshMs) && parsedRefreshMs >= 5000 ? parsedRefreshMs : 15000;

export const AUTO_REFRESH_MS = baseRefreshMs;
export const NEWS_REFRESH_MS = Math.max(baseRefreshMs * 2, 30000);
export const RATES_REFRESH_MS = Math.max(baseRefreshMs, 15000);
