import AsyncStorage from "@react-native-async-storage/async-storage";

const MARKET_CACHE_KEY = "factoresearch_market_cache_v1";
const MAX_SYMBOL_ENTRIES = 180;

const emptyCache = () => ({
  quotesBySymbol: {},
  snapshotsBySymbol: {}
});

const normalizeSymbol = (value) => String(value || "").trim().toUpperCase();

const parseStoredCache = (raw) => {
  if (!raw) {
    return emptyCache();
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      quotesBySymbol: parsed?.quotesBySymbol && typeof parsed.quotesBySymbol === "object" ? parsed.quotesBySymbol : {},
      snapshotsBySymbol: parsed?.snapshotsBySymbol && typeof parsed.snapshotsBySymbol === "object" ? parsed.snapshotsBySymbol : {}
    };
  } catch (_error) {
    return emptyCache();
  }
};

const sortKeysByUpdatedAtDesc = (record) => {
  return Object.keys(record).sort((a, b) => {
    const aTime = new Date(record[a]?.updatedAt || 0).getTime();
    const bTime = new Date(record[b]?.updatedAt || 0).getTime();
    return bTime - aTime;
  });
};

const pruneRecord = (record, maxEntries) => {
  const keys = sortKeysByUpdatedAtDesc(record);
  if (keys.length <= maxEntries) {
    return record;
  }

  const next = {};
  keys.slice(0, maxEntries).forEach((key) => {
    next[key] = record[key];
  });
  return next;
};

const buildQuoteFromDetail = (detail) => {
  if (!detail?.symbol) {
    return null;
  }

  return {
    symbol: detail.symbol,
    name: detail.name || detail.shortName || detail.symbol,
    price: detail.price,
    change: detail.change,
    changePercent: detail.changePercent,
    exchange: detail.exchange,
    currency: detail.currency,
    marketTime: detail.marketTime
  };
};

const readCache = async () => {
  const raw = await AsyncStorage.getItem(MARKET_CACHE_KEY);
  return parseStoredCache(raw);
};

const writeCache = async (cache) => {
  const payload = {
    quotesBySymbol: pruneRecord(cache.quotesBySymbol || {}, MAX_SYMBOL_ENTRIES),
    snapshotsBySymbol: pruneRecord(cache.snapshotsBySymbol || {}, MAX_SYMBOL_ENTRIES)
  };

  await AsyncStorage.setItem(MARKET_CACHE_KEY, JSON.stringify(payload));
};

export const getCachedQuote = async (symbol) => {
  const normalized = normalizeSymbol(symbol);
  if (!normalized) {
    return null;
  }

  const cache = await readCache();
  const direct = cache.quotesBySymbol?.[normalized]?.quote || null;

  if (direct) {
    return direct;
  }

  const snapshotDetail = cache.snapshotsBySymbol?.[normalized]?.detail || null;
  return buildQuoteFromDetail(snapshotDetail);
};

export const getCachedStockSnapshot = async (symbol) => {
  const normalized = normalizeSymbol(symbol);
  if (!normalized) {
    return null;
  }

  const cache = await readCache();
  return cache.snapshotsBySymbol?.[normalized] || null;
};

export const saveCachedStockSnapshot = async ({ symbol, detail, rangeKey, points }) => {
  const normalized = normalizeSymbol(symbol || detail?.symbol);
  if (!normalized) {
    return;
  }

  const cache = await readCache();
  const nowIso = new Date().toISOString();

  const existing = cache.snapshotsBySymbol?.[normalized] || {
    detail: null,
    charts: {},
    updatedAt: null
  };

  const nextDetail = detail || existing.detail;
  const nextCharts = {
    ...(existing.charts || {})
  };

  if (rangeKey && Array.isArray(points) && points.length) {
    nextCharts[rangeKey] = {
      points,
      updatedAt: nowIso
    };
  }

  cache.snapshotsBySymbol[normalized] = {
    detail: nextDetail,
    charts: nextCharts,
    updatedAt: nowIso
  };

  const quoteFromDetail = buildQuoteFromDetail(nextDetail);
  if (quoteFromDetail) {
    cache.quotesBySymbol[normalized] = {
      quote: quoteFromDetail,
      updatedAt: nowIso
    };
  }

  await writeCache(cache);
};
