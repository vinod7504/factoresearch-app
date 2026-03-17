const User = require("../models/User");
const Suggestion = require("../models/Suggestion");

const YAHOO_QUOTE_URL = "https://query1.finance.yahoo.com/v7/finance/quote";
const YAHOO_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart";
const YAHOO_SEARCH_URL = "https://query1.finance.yahoo.com/v1/finance/search";
const YAHOO_COOKIE_URL = "https://fc.yahoo.com";
const YAHOO_CRUMB_URL = "https://query1.finance.yahoo.com/v1/test/getcrumb";
const YAHOO_USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)";

const WATCHLIST_LIMIT = 30;
const METAL_GST_RATE = 0.03;
const OUNCE_TO_GRAM = 31.1034768;

const DEFAULT_MARKET_RATES = {
  goldUsdPerOunce: 2200,
  silverUsdPerOunce: 25,
  usdInr: 83
};

let yahooAuthCache = {
  cookie: "",
  crumb: "",
  expiresAt: 0
};

const DEFAULT_DASHBOARD_SYMBOLS = [
  "RELIANCE.NS",
  "TCS.NS",
  "INFY.NS",
  "HDFCBANK.NS",
  "ICICIBANK.NS",
  "SBIN.NS",
  "AAPL",
  "MSFT"
];

const MARKET_UNIVERSE = [
  "RELIANCE.NS",
  "TCS.NS",
  "INFY.NS",
  "HDFCBANK.NS",
  "ICICIBANK.NS",
  "SBIN.NS",
  "LT.NS",
  "ITC.NS",
  "AXISBANK.NS",
  "HINDUNILVR.NS",
  "AAPL",
  "MSFT",
  "GOOGL",
  "AMZN",
  "TSLA",
  "NVDA",
  "META"
];

const INDEX_CONFIG = [
  { key: "sensex", label: "SENSEX", symbols: ["^BSESN"] },
  { key: "nifty50", label: "NIFTY 50", symbols: ["^NSEI"] },
  { key: "niftyBank", label: "NIFTY BANK", symbols: ["^NSEBANK"] },
  { key: "niftyMidcap", label: "NIFTY MIDCAP", symbols: ["^NSEMDCP50", "NIFTYMIDCAP50.NS"] }
];

const ETF_CONFIG = [
  { key: "niftyBees", label: "NIFTYBEES", symbols: ["NIFTYBEES.NS"] },
  { key: "bankBees", label: "BANKBEES", symbols: ["BANKBEES.NS"] },
  { key: "goldBees", label: "GOLDBEES", symbols: ["GOLDBEES.NS"] },
  { key: "spy", label: "SPY", symbols: ["SPY"] },
  { key: "qqq", label: "QQQ", symbols: ["QQQ"] }
];

const COMMODITY_CONFIG = [
  { key: "gold", label: "Gold", symbols: ["GC=F"] },
  { key: "silver", label: "Silver", symbols: ["SI=F"] },
  { key: "crude", label: "Crude Oil", symbols: ["CL=F"] },
  { key: "naturalGas", label: "Natural Gas", symbols: ["NG=F"] }
];

const CURRENCY_CONFIG = [
  { key: "usdInr", label: "USD/INR", symbols: ["INR=X"] },
  { key: "eurInr", label: "EUR/INR", symbols: ["EURINR=X"] },
  { key: "gbpInr", label: "GBP/INR", symbols: ["GBPINR=X"] },
  { key: "jpyInr", label: "JPY/INR", symbols: ["JPYINR=X"] }
];

const METAL_CITY_FACTORS = [
  { city: "Mumbai", factor: 1.0 },
  { city: "Delhi", factor: 1.002 },
  { city: "Bengaluru", factor: 1.006 },
  { city: "Chennai", factor: 1.008 },
  { city: "Hyderabad", factor: 1.004 },
  { city: "Kolkata", factor: 1.001 }
];

const DASHBOARD_NEWS_QUERY = "Indian stock market NSE BSE";

const normalizeSymbol = (symbol) => {
  return String(symbol || "").trim().toUpperCase();
};

const toNumber = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }
  return value;
};

const roundMoney = (value, digits = 2) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }
  return Number(value.toFixed(digits));
};

const uniqueSymbols = (symbols) => {
  return [...new Set(symbols.map(normalizeSymbol).filter(Boolean))];
};

const flattenConfigSymbols = (configList) => {
  return configList.flatMap((item) => item.symbols || []);
};

const formatSuggestion = (item) => ({
  id: item._id,
  symbol: item.symbol,
  recommendation: item.recommendation,
  note: item.note,
  targetPrice: item.targetPrice,
  stopLoss: item.stopLoss,
  createdAt: item.createdAt
});

const formatQuote = (quote) => ({
  symbol: quote.symbol,
  name: quote.shortName || quote.longName || quote.symbol,
  currency: quote.currency,
  exchange: quote.fullExchangeName || quote.exchange || quote.exchangeName,
  marketState: quote.marketState,
  price: quote.regularMarketPrice,
  change: quote.regularMarketChange,
  changePercent: quote.regularMarketChangePercent,
  marketTime: quote.regularMarketTime
});

const formatQuoteDetail = (quote) => ({
  symbol: quote.symbol,
  name: quote.longName || quote.shortName || quote.symbol,
  shortName: quote.shortName,
  exchange: quote.fullExchangeName || quote.exchange || quote.exchangeName,
  currency: quote.currency,
  marketState: quote.marketState,
  price: quote.regularMarketPrice,
  change: quote.regularMarketChange,
  changePercent: quote.regularMarketChangePercent,
  marketTime: quote.regularMarketTime,
  previousClose: quote.regularMarketPreviousClose,
  open: quote.regularMarketOpen,
  dayHigh: quote.regularMarketDayHigh,
  dayLow: quote.regularMarketDayLow,
  dayRange: quote.regularMarketDayRange,
  fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
  fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
  volume: quote.regularMarketVolume,
  averageVolume: quote.averageDailyVolume3Month,
  marketCap: quote.marketCap,
  trailingPE: quote.trailingPE,
  forwardPE: quote.forwardPE,
  epsTrailingTwelveMonths: quote.epsTrailingTwelveMonths,
  dividendYield: quote.dividendYield,
  bid: quote.bid,
  bidSize: quote.bidSize ?? quote.regularMarketBidSize,
  ask: quote.ask,
  askSize: quote.askSize ?? quote.regularMarketAskSize,
  source: "Yahoo Finance"
});

const extractCookieHeader = (response) => {
  if (typeof response.headers.getSetCookie === "function") {
    const cookies = response.headers.getSetCookie();
    return cookies.map((item) => item.split(";")[0]).join("; ");
  }

  const fallbackCookie = response.headers.get("set-cookie");
  if (!fallbackCookie) {
    return "";
  }

  return fallbackCookie.split(";")[0];
};

const fetchYahooAuth = async (forceRefresh = false) => {
  const now = Date.now();
  if (!forceRefresh && yahooAuthCache.cookie && yahooAuthCache.crumb && now < yahooAuthCache.expiresAt) {
    return yahooAuthCache;
  }

  const cookieResponse = await fetch(YAHOO_COOKIE_URL, {
    headers: {
      "User-Agent": YAHOO_USER_AGENT
    }
  });

  const cookie = extractCookieHeader(cookieResponse);
  if (!cookie) {
    throw new Error("Unable to obtain Yahoo cookie");
  }

  const crumbResponse = await fetch(YAHOO_CRUMB_URL, {
    headers: {
      Cookie: cookie,
      "User-Agent": YAHOO_USER_AGENT
    }
  });

  const crumb = (await crumbResponse.text()).trim();
  if (!crumb || crumb.includes("Unauthorized") || crumb.startsWith("{")) {
    throw new Error("Unable to obtain Yahoo crumb");
  }

  yahooAuthCache = {
    cookie,
    crumb,
    expiresAt: Date.now() + 10 * 60 * 1000
  };

  return yahooAuthCache;
};

const fetchRawQuotes = async (symbols) => {
  const normalized = uniqueSymbols(symbols);

  if (!normalized.length) {
    return [];
  }

  try {
    const query = encodeURIComponent(normalized.join(","));
    const readQuotes = async (forceRefresh) => {
      const auth = await fetchYahooAuth(forceRefresh);
      const url = `${YAHOO_QUOTE_URL}?symbols=${query}&crumb=${encodeURIComponent(auth.crumb)}`;
      return fetch(url, {
        headers: {
          Cookie: auth.cookie,
          "User-Agent": YAHOO_USER_AGENT
        }
      });
    };

    let response = await readQuotes(false);
    if (response.status === 401 || response.status === 429) {
      response = await readQuotes(true);
    }

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data?.quoteResponse?.result || [];
  } catch (_error) {
    return [];
  }
};

const parseChartPayload = (payload) => {
  const result = payload?.chart?.result?.[0];
  const timestamps = result?.timestamp || [];
  const closes = result?.indicators?.quote?.[0]?.close || [];
  const meta = result?.meta || null;

  const points = timestamps
    .map((timestamp, index) => {
      const close = closes[index];
      if (typeof close !== "number" || Number.isNaN(close)) {
        return null;
      }

      const date = new Date(timestamp * 1000);
      return {
        timestamp,
        price: close,
        label: date.toISOString(),
        shortLabel: date.toLocaleString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          day: "2-digit",
          month: "short"
        })
      };
    })
    .filter(Boolean);

  return {
    points,
    meta
  };
};

const fetchChartData = async (symbol, range = "1d", interval = "5m") => {
  const normalized = normalizeSymbol(symbol);
  if (!normalized) {
    return { points: [], meta: null, range, interval };
  }

  try {
    const readChart = async (selectedRange, selectedInterval, forceRefresh) => {
      const auth = await fetchYahooAuth(forceRefresh);
      const url = `${YAHOO_CHART_URL}/${encodeURIComponent(normalized)}?range=${encodeURIComponent(
        selectedRange
      )}&interval=${encodeURIComponent(selectedInterval)}&crumb=${encodeURIComponent(auth.crumb)}`;

      return fetch(url, {
        headers: {
          Cookie: auth.cookie,
          "User-Agent": YAHOO_USER_AGENT
        }
      });
    };

    const loadChart = async (selectedRange, selectedInterval) => {
      let response = await readChart(selectedRange, selectedInterval, false);
      if (response.status === 401 || response.status === 429) {
        response = await readChart(selectedRange, selectedInterval, true);
      }

      if (!response.ok) {
        return {
          points: [],
          meta: null,
          range: selectedRange,
          interval: selectedInterval
        };
      }

      const parsed = parseChartPayload(await response.json());
      return {
        points: parsed.points,
        meta: parsed.meta,
        range: selectedRange,
        interval: selectedInterval
      };
    };

    let result = await loadChart(range, interval);

    if (!result.points.length) {
      const fallbackInterval = range === "1d" ? "15m" : "1d";
      if (fallbackInterval !== interval) {
        result = await loadChart(range, fallbackInterval);
      }
    }

    if (!result.points.length && range !== "1mo") {
      result = await loadChart("1mo", "1d");
    }

    return result;
  } catch (_error) {
    return { points: [], meta: null, range, interval };
  }
};

const fetchQuotes = async (symbols) => {
  const rawQuotes = await fetchRawQuotes(symbols);
  return rawQuotes.map(formatQuote).filter((item) => item.symbol);
};

const fetchYahooNews = async (query = DASHBOARD_NEWS_QUERY, count = 8) => {
  try {
    const url = `${YAHOO_SEARCH_URL}?q=${encodeURIComponent(query)}&quotesCount=0&newsCount=${count}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": YAHOO_USER_AGENT
      }
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return (data?.news || [])
      .map((item) => ({
        id: item?.uuid || item?.link || item?.title,
        title: item?.title,
        publisher: item?.publisher,
        link: item?.link,
        publishedAt: item?.providerPublishTime
          ? new Date(item.providerPublishTime * 1000).toISOString()
          : null,
        type: item?.type || "STORY"
      }))
      .filter((item) => item.id && item.title && item.link)
      .slice(0, count);
  } catch (_error) {
    return [];
  }
};

const buildSymbolMap = (quotes) => {
  return quotes.reduce((acc, item) => {
    acc.set(normalizeSymbol(item.symbol), item);
    return acc;
  }, new Map());
};

const mapSymbolsToQuotes = (symbols, quoteMap) => {
  return uniqueSymbols(symbols)
    .map((symbol) => quoteMap.get(normalizeSymbol(symbol)))
    .filter(Boolean);
};

const pickConfiguredQuotes = (config, quoteMap) => {
  return config.map((item) => {
    let foundQuote = null;

    for (const symbol of item.symbols) {
      const current = quoteMap.get(normalizeSymbol(symbol));
      if (current) {
        foundQuote = current;
        break;
      }
    }

    if (!foundQuote) {
      return {
        key: item.key,
        label: item.label,
        symbol: item.symbols[0],
        name: item.label,
        price: null,
        change: null,
        changePercent: null,
        currency: null,
        exchange: null
      };
    }

    return {
      ...foundQuote,
      key: item.key,
      label: item.label
    };
  });
};

const getMetalReferencePrice = (quoteMap, symbol, fallback) => {
  const raw = quoteMap.get(normalizeSymbol(symbol))?.price;
  return toNumber(raw) ?? fallback;
};

const withGst = (value) => {
  return roundMoney(value * (1 + METAL_GST_RATE), 0);
};

const withoutGst = (value) => {
  return roundMoney(value, 0);
};

const buildMetalRates = (quoteMap) => {
  const goldUsdPerOunce = getMetalReferencePrice(
    quoteMap,
    "GC=F",
    DEFAULT_MARKET_RATES.goldUsdPerOunce
  );
  const silverUsdPerOunce = getMetalReferencePrice(
    quoteMap,
    "SI=F",
    DEFAULT_MARKET_RATES.silverUsdPerOunce
  );
  const usdInr = getMetalReferencePrice(quoteMap, "INR=X", DEFAULT_MARKET_RATES.usdInr);

  const fallbackUsed =
    !toNumber(quoteMap.get(normalizeSymbol("GC=F"))?.price) ||
    !toNumber(quoteMap.get(normalizeSymbol("SI=F"))?.price) ||
    !toNumber(quoteMap.get(normalizeSymbol("INR=X"))?.price);

  const gold24kPer10g = (goldUsdPerOunce * usdInr * 10) / OUNCE_TO_GRAM;
  const gold22kPer10g = gold24kPer10g * (22 / 24);
  const silverPerKg = (silverUsdPerOunce * usdInr * 1000) / OUNCE_TO_GRAM;

  const makeRateSet = (baseValue) => ({
    withoutGst: withoutGst(baseValue),
    withGst: withGst(baseValue)
  });

  return {
    source: "Derived from Yahoo Finance commodities/currency quotes",
    isEstimated: fallbackUsed,
    gstRate: METAL_GST_RATE,
    units: {
      gold: "INR / 10g",
      silver: "INR / kg"
    },
    baseRates: {
      gold24k: makeRateSet(gold24kPer10g),
      gold22k: makeRateSet(gold22kPer10g),
      silver: makeRateSet(silverPerKg)
    },
    cities: METAL_CITY_FACTORS.map((cityData) => {
      const cityGold24 = gold24kPer10g * cityData.factor;
      const cityGold22 = gold22kPer10g * cityData.factor;
      const citySilver = silverPerKg * cityData.factor;

      return {
        city: cityData.city,
        gold24k: makeRateSet(cityGold24),
        gold22k: makeRateSet(cityGold22),
        silver: makeRateSet(citySilver)
      };
    })
  };
};

const getUserWatchlistSymbols = (user) => {
  return uniqueSymbols(user?.watchlist || []).slice(0, WATCHLIST_LIMIT);
};

const saveUserWatchlist = async (user, symbols) => {
  user.watchlist = uniqueSymbols(symbols).slice(0, WATCHLIST_LIMIT);
  await user.save();
  return user.watchlist;
};

const getDashboard = async (req, res) => {
  try {
    const symbols =
      req.query.symbols
        ?.split(",")
        .map((item) => item.trim())
        .filter(Boolean) || DEFAULT_DASHBOARD_SYMBOLS;

    const user = await User.findById(req.user.id).select("watchlist");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const watchlist = getUserWatchlistSymbols(user);

    const dashboardUniverse = uniqueSymbols([
      ...symbols,
      ...watchlist,
      ...MARKET_UNIVERSE,
      ...flattenConfigSymbols(INDEX_CONFIG),
      ...flattenConfigSymbols(ETF_CONFIG),
      ...flattenConfigSymbols(COMMODITY_CONFIG),
      ...flattenConfigSymbols(CURRENCY_CONFIG)
    ]);

    const [allQuotes, suggestions, news] = await Promise.all([
      fetchQuotes(dashboardUniverse),
      Suggestion.find({ active: true }).sort({ createdAt: -1 }).limit(10),
      fetchYahooNews(DASHBOARD_NEWS_QUERY, 10)
    ]);

    const quoteMap = buildSymbolMap(allQuotes);

    const stockQuotes = mapSymbolsToQuotes(symbols, quoteMap);
    const watchlistQuotes = mapSymbolsToQuotes(watchlist, quoteMap);

    const movers = mapSymbolsToQuotes(MARKET_UNIVERSE, quoteMap).filter(
      (item) => typeof item.changePercent === "number"
    );

    const topGainers = [...movers]
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 5);

    const topLosers = [...movers]
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 5);

    const indices = pickConfiguredQuotes(INDEX_CONFIG, quoteMap);
    const etfs = pickConfiguredQuotes(ETF_CONFIG, quoteMap);
    const commodities = pickConfiguredQuotes(COMMODITY_CONFIG, quoteMap);
    const currencies = pickConfiguredQuotes(CURRENCY_CONFIG, quoteMap);

    const metalRates = buildMetalRates(quoteMap);

    return res.json({
      welcomeMessage: "Welcome to Factoresearch",
      stocks: stockQuotes,
      watchlist,
      watchlistQuotes,
      suggestions: suggestions.map(formatSuggestion),
      topGainers,
      topLosers,
      indices,
      etfs,
      commodities,
      currencies,
      metalRates,
      news,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to fetch market data" });
  }
};

const getNews = async (req, res) => {
  try {
    const query = String(req.query.q || DASHBOARD_NEWS_QUERY).trim() || DASHBOARD_NEWS_QUERY;
    const requestedCount = Number.parseInt(req.query.count, 10);
    const count = Number.isNaN(requestedCount) ? 20 : Math.max(1, Math.min(requestedCount, 50));

    const news = await fetchYahooNews(query, count);

    return res.json({
      query,
      count: news.length,
      news,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to fetch market news" });
  }
};

const getQuote = async (req, res) => {
  try {
    const symbol = normalizeSymbol(req.params.symbol);

    if (!symbol) {
      return res.status(400).json({ message: "Symbol is required" });
    }

    const rawQuote = (await fetchRawQuotes([symbol]))[0];

    if (!rawQuote) {
      return res.status(404).json({ message: "Quote not found" });
    }

    return res.json({ quote: formatQuoteDetail(rawQuote) });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to fetch quote" });
  }
};

const getChart = async (req, res) => {
  try {
    const symbol = normalizeSymbol(req.params.symbol);

    if (!symbol) {
      return res.status(400).json({ message: "Symbol is required" });
    }

    const allowedRanges = new Set(["1d", "5d", "1mo", "3mo", "6mo", "1y"]);
    const allowedIntervals = new Set(["5m", "15m", "30m", "60m", "1d", "1wk"]);

    const range = allowedRanges.has(req.query.range) ? req.query.range : "1d";
    const interval = allowedIntervals.has(req.query.interval) ? req.query.interval : "5m";

    const chart = await fetchChartData(symbol, range, interval);

    return res.json({
      symbol,
      range: chart.range,
      interval: chart.interval,
      points: chart.points,
      meta: chart.meta
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to fetch chart data" });
  }
};

const getWatchlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("watchlist");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const watchlist = getUserWatchlistSymbols(user);

    if (String(user.watchlist || []) !== String(watchlist)) {
      await saveUserWatchlist(user, watchlist);
    }

    const quotes = await fetchQuotes(watchlist);

    return res.json({
      watchlist,
      quotes,
      count: watchlist.length
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to fetch watchlist" });
  }
};

const addToWatchlist = async (req, res) => {
  try {
    const symbol = normalizeSymbol(req.body.symbol);

    if (!symbol) {
      return res.status(400).json({ message: "symbol is required" });
    }

    const user = await User.findById(req.user.id).select("watchlist");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentWatchlist = getUserWatchlistSymbols(user);

    if (currentWatchlist.includes(symbol)) {
      return res.json({
        message: "Symbol already in watchlist",
        watchlist: currentWatchlist,
        quotes: await fetchQuotes(currentWatchlist)
      });
    }

    if (currentWatchlist.length >= WATCHLIST_LIMIT) {
      return res.status(400).json({
        message: `Watchlist limit reached (${WATCHLIST_LIMIT})`
      });
    }

    const nextWatchlist = [...currentWatchlist, symbol];
    await saveUserWatchlist(user, nextWatchlist);

    return res.status(201).json({
      message: "Added to watchlist",
      watchlist: user.watchlist,
      quotes: await fetchQuotes(user.watchlist)
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to add watchlist symbol" });
  }
};

const removeFromWatchlist = async (req, res) => {
  try {
    const symbol = normalizeSymbol(req.params.symbol);

    if (!symbol) {
      return res.status(400).json({ message: "symbol is required" });
    }

    const user = await User.findById(req.user.id).select("watchlist");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentWatchlist = getUserWatchlistSymbols(user);

    if (!currentWatchlist.includes(symbol)) {
      return res.status(404).json({ message: "Symbol not found in watchlist" });
    }

    const nextWatchlist = currentWatchlist.filter((item) => item !== symbol);
    await saveUserWatchlist(user, nextWatchlist);

    return res.json({
      message: "Removed from watchlist",
      watchlist: user.watchlist,
      quotes: await fetchQuotes(user.watchlist)
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to remove watchlist symbol" });
  }
};

module.exports = {
  getDashboard,
  getNews,
  getQuote,
  getChart,
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist
};
