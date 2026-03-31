import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Defs, LinearGradient, Line, Polyline, Polygon, Rect, Stop, Text as SvgText } from "react-native-svg";
import api from "../api/client";
import { startContinuousRefresh } from "../constants/realtime";
import { getCachedStockSnapshot, saveCachedStockSnapshot } from "../utils/marketCache";

const CHART_WIDTH = Math.max(Dimensions.get("window").width - 50, 280);
const CHART_HEIGHT = 230;
const TITLE_FONT = Platform.select({ ios: "AvenirNext-Bold", android: "sans-serif-condensed" });
const BODY_FONT = Platform.select({ ios: "AvenirNext-Medium", android: "sans-serif-medium" });

const RANGE_OPTIONS = [
  { key: "1d", label: "1D", interval: "5m" },
  { key: "5d", label: "1W", interval: "15m" },
  { key: "1mo", label: "1M", interval: "1d" },
  { key: "3mo", label: "3M", interval: "1d" },
  { key: "6mo", label: "6M", interval: "1d" },
  { key: "1y", label: "1Y", interval: "1wk" }
];

const GRAPH_TYPE_OPTIONS = [
  { key: "line", label: "Line" },
  { key: "area", label: "Area" },
  { key: "bars", label: "Bars" }
];

const BROKER_APPS = [
  { id: "groww", name: "Groww", symbol: "G", appUrl: (stockSymbol) => `groww://stocks/${stockSymbol}`, webUrl: (stockSymbol) => `https://groww.in/stocks?query=${encodeURIComponent(stockSymbol)}` },
  { id: "zerodha", name: "Zerodha", symbol: "Z", appUrl: (stockSymbol) => `kite://search/${stockSymbol}`, webUrl: (stockSymbol) => `https://kite.zerodha.com/?q=${encodeURIComponent(stockSymbol)}` },
  { id: "upstox", name: "Upstox", symbol: "U", appUrl: (stockSymbol) => `upstox://stocks/${stockSymbol}`, webUrl: (stockSymbol) => `https://upstox.com/search?query=${encodeURIComponent(stockSymbol)}` },
  { id: "angel", name: "Angel One", symbol: "A", appUrl: (stockSymbol) => `angelone://search/${stockSymbol}`, webUrl: (stockSymbol) => `https://www.angelone.in/stocks/${encodeURIComponent(stockSymbol)}` }
];

const hasNumber = (value) => typeof value === "number" && !Number.isNaN(value);

const formatNumber = (value, digits = 2) => {
  if (!hasNumber(value)) {
    return "-";
  }
  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
};

const formatPercent = (value) => {
  if (!hasNumber(value)) {
    return "-";
  }
  return `${value.toFixed(2)}%`;
};

const formatMarketTime = (value) => {
  if (!hasNumber(value)) {
    return "-";
  }
  return new Date(value * 1000).toLocaleString();
};

const getChangeColor = (value) => {
  if (!hasNumber(value)) {
    return "#334155";
  }
  return value >= 0 ? "#16a34a" : "#dc2626";
};

const normaliseRecommendationColor = (recommendation) => {
  if (recommendation === "BUY") {
    return "#16a34a";
  }
  if (recommendation === "SELL") {
    return "#dc2626";
  }
  return "#2563eb";
};

const rangeKey = (range, interval) => `${range}|${interval}`;

const pickBestCachedChart = (snapshot, preferredKey) => {
  const charts = snapshot?.charts || {};
  const preferred = charts?.[preferredKey];
  if (preferred?.points?.length) {
    return preferred;
  }

  const ordered = Object.values(charts)
    .filter((item) => Array.isArray(item?.points) && item.points.length)
    .sort((a, b) => new Date(b?.updatedAt || 0).getTime() - new Date(a?.updatedAt || 0).getTime());

  return ordered[0] || null;
};

const Field = ({ label, value }) => (
  <View style={styles.fieldBox}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={styles.fieldValue}>{value}</Text>
  </View>
);

const QuickMetric = ({ label, value }) => (
  <View style={styles.metricPill}>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricValue}>{value}</Text>
  </View>
);

const BrokerButton = ({ broker, onPress }) => (
  <TouchableOpacity style={styles.brokerButton} onPress={onPress} activeOpacity={0.83}>
    <View style={styles.brokerMark}>
      <Text style={styles.brokerMarkText}>{broker.symbol}</Text>
    </View>
    <Text style={styles.brokerLabel}>{broker.name}</Text>
  </TouchableOpacity>
);

const PriceChart = ({ points, isPositive, graphType }) => {
  const chartData = useMemo(() => {
    if (!points.length) {
      return null;
    }

    const values = points.map((item) => item.price).filter(hasNumber);
    if (!values.length) {
      return null;
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const diff = max - min || 1;
    const baselineY = CHART_HEIGHT - 10;

    const coords = points
      .map((item, index) => {
        if (!hasNumber(item.price)) {
          return null;
        }
        const x = (index / Math.max(points.length - 1, 1)) * (CHART_WIDTH - 18) + 9;
        const y = baselineY - ((item.price - min) / diff) * (CHART_HEIGHT - 20);
        return { x, y, price: item.price };
      })
      .filter(Boolean);

    if (!coords.length) {
      return null;
    }

    const linePoints = coords.map((item) => `${item.x},${item.y}`).join(" ");
    const areaPoints = `${linePoints} ${coords[coords.length - 1].x},${baselineY} ${coords[0].x},${baselineY}`;

    return {
      min,
      max,
      baselineY,
      coords,
      linePoints,
      areaPoints
    };
  }, [points]);

  if (!chartData) {
    return (
      <View style={styles.emptyChart}>
        <Text style={styles.emptyChartText}>No chart data available for this range.</Text>
      </View>
    );
  }

  const strokeColor = isPositive ? "#06b6d4" : "#ef4444";
  const barStrokeWidth = Math.max(1.5, Math.min(8, (CHART_WIDTH - 18) / Math.max(chartData.coords.length * 1.8, 1)));

  return (
    <View style={styles.chartWrap}>
      <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
        <Defs>
          <LinearGradient id="chartBg" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#f8fbff" stopOpacity="1" />
            <Stop offset="1" stopColor="#eef8ff" stopOpacity="1" />
          </LinearGradient>
          <LinearGradient id="chartArea" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={strokeColor} stopOpacity="0.28" />
            <Stop offset="1" stopColor={strokeColor} stopOpacity="0.03" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={CHART_WIDTH} height={CHART_HEIGHT} fill="url(#chartBg)" rx="12" ry="12" />
        {[1, 2, 3, 4].map((step) => {
          const y = (CHART_HEIGHT / 5) * step;
          return <Line key={`line-${step}`} x1="0" y1={y} x2={CHART_WIDTH} y2={y} stroke="rgba(100, 116, 139, 0.15)" strokeWidth="1" />;
        })}
        {[1, 2, 3, 4].map((step) => {
          const x = (CHART_WIDTH / 5) * step;
          return <Line key={`vline-${step}`} x1={x} y1="0" x2={x} y2={CHART_HEIGHT} stroke="rgba(100, 116, 139, 0.1)" strokeWidth="1" />;
        })}

        {graphType === "area" ? <Polygon points={chartData.areaPoints} fill="url(#chartArea)" /> : null}

        {graphType === "bars"
          ? chartData.coords.map((item, index) => (
              <Line
                key={`bar-${index}`}
                x1={item.x}
                y1={chartData.baselineY}
                x2={item.x}
                y2={item.y}
                stroke={strokeColor}
                strokeWidth={barStrokeWidth}
                strokeLinecap="round"
              />
            ))
          : null}

        {graphType !== "bars" ? (
          <Polyline points={chartData.linePoints} fill="none" stroke={strokeColor} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        ) : null}

        <SvgText x={CHART_WIDTH - 8} y={13} fill="rgba(51, 65, 85, 0.85)" fontSize="10" textAnchor="end">
          {formatNumber(chartData.max)}
        </SvgText>
        <SvgText x={CHART_WIDTH - 8} y={CHART_HEIGHT - 10} fill="rgba(51, 65, 85, 0.85)" fontSize="10" textAnchor="end">
          {formatNumber(chartData.min)}
        </SvgText>
      </Svg>
    </View>
  );
};

export default function StockDetailsScreen({ route }) {
  const symbol = String(route.params?.symbol || "").toUpperCase();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [watchlistSaving, setWatchlistSaving] = useState(false);
  const [usingCachedQuote, setUsingCachedQuote] = useState(false);
  const [usingCachedChart, setUsingCachedChart] = useState(false);
  const [cachedSnapshotTime, setCachedSnapshotTime] = useState(null);
  const [detail, setDetail] = useState(null);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [rangeConfig, setRangeConfig] = useState(RANGE_OPTIONS[0]);
  const [graphType, setGraphType] = useState(GRAPH_TYPE_OPTIONS[0].key);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartPoints, setChartPoints] = useState([]);
  const usingCachedData = usingCachedQuote || usingCachedChart;
  const screenAnim = useRef(new Animated.Value(0)).current;

  const loadStock = useCallback(
    async ({ withChart = true } = {}) => {
      if (!symbol) {
        return;
      }

      const currentRangeKey = rangeKey(rangeConfig.key, rangeConfig.interval);
      const requests = [api.get(`/market/quote/${encodeURIComponent(symbol)}`), api.get("/market/watchlist"), api.get("/suggestions")];
      if (withChart) {
        requests.push(api.get(`/market/chart/${encodeURIComponent(symbol)}?range=${rangeConfig.key}&interval=${rangeConfig.interval}`));
      }

      const [quoteRes, watchlistRes, suggestionsRes, chartRes] = await Promise.allSettled(requests);
      const cachedSnapshot = await getCachedStockSnapshot(symbol);
      const liveDetail = quoteRes.status === "fulfilled" ? quoteRes.value?.data?.quote || null : null;
      const fallbackDetail = cachedSnapshot?.detail || null;
      const nextDetail = liveDetail || fallbackDetail;

      if (!nextDetail) {
        const message =
          quoteRes.status === "rejected"
            ? quoteRes.reason?.response?.data?.message || quoteRes.reason?.message
            : "Quote not found";
        throw new Error(message || "Unable to fetch stock details");
      }

      setDetail(nextDetail);

      if (watchlistRes.status === "fulfilled") {
        const watchlist = watchlistRes.value?.data?.watchlist || [];
        setInWatchlist(watchlist.includes(symbol));
      }

      if (suggestionsRes.status === "fulfilled") {
        const allSuggestions = suggestionsRes.value?.data?.suggestions || [];
        setSuggestions(allSuggestions.filter((item) => item.symbol === symbol));
      }

      let usedCachedChart = false;
      if (withChart) {
        const livePoints = chartRes?.status === "fulfilled" ? chartRes.value?.data?.points || [] : [];
        const fallbackChart = pickBestCachedChart(cachedSnapshot, currentRangeKey);
        const fallbackPoints = fallbackChart?.points || [];
        const nextPoints = livePoints.length ? livePoints : fallbackPoints;
        usedCachedChart = !livePoints.length && Boolean(fallbackPoints.length);
        setChartPoints(nextPoints);
      }

      const usedCachedQuote = !liveDetail;
      const currentlyUsingCache = usedCachedQuote || usedCachedChart;
      setUsingCachedQuote(usedCachedQuote);
      setUsingCachedChart(usedCachedChart);
      setCachedSnapshotTime(currentlyUsingCache ? cachedSnapshot?.updatedAt || null : null);

      if (liveDetail || (withChart && chartRes?.status === "fulfilled")) {
        const livePoints = withChart && chartRes?.status === "fulfilled" ? chartRes.value?.data?.points || [] : null;
        saveCachedStockSnapshot({
          symbol,
          detail: liveDetail || nextDetail,
          rangeKey: withChart && livePoints?.length ? currentRangeKey : null,
          points: livePoints
        }).catch(() => {});
      }
    },
    [rangeConfig.interval, rangeConfig.key, symbol]
  );

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const run = async () => {
        try {
          setLoading(true);
          await loadStock({ withChart: true });
        } catch (error) {
          const message = error?.response?.data?.message || error?.message || "Unable to fetch stock details";
          Alert.alert("Error", message);
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

      run();
      return () => {
        mounted = false;
      };
    }, [loadStock])
  );

  useEffect(() => {
    if (!symbol) {
      return undefined;
    }
    const stop = startContinuousRefresh(async () => {
      await loadStock({ withChart: true });
    }, { enabled: Boolean(symbol) });
    return stop;
  }, [loadStock, symbol]);

  useEffect(() => {
    screenAnim.setValue(0);
    Animated.timing(screenAnim, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start();
  }, [screenAnim, symbol]);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadStock({ withChart: true });
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || "Unable to refresh stock";
      Alert.alert("Error", message);
    } finally {
      setRefreshing(false);
    }
  };

  const onChangeRange = async (config) => {
    const nextRangeKey = rangeKey(config.key, config.interval);
    try {
      setRangeConfig(config);
      setChartLoading(true);
      const { data } = await api.get(`/market/chart/${encodeURIComponent(symbol)}?range=${config.key}&interval=${config.interval}`);
      const nextPoints = data.points || [];

      if (nextPoints.length) {
        setChartPoints(nextPoints);
        setUsingCachedChart(false);
        if (!usingCachedQuote) {
          setCachedSnapshotTime(null);
        }
        saveCachedStockSnapshot({
          symbol,
          detail,
          rangeKey: nextRangeKey,
          points: nextPoints
        }).catch(() => {});
      } else {
        const cached = await getCachedStockSnapshot(symbol);
        const fallbackPoints = pickBestCachedChart(cached, nextRangeKey)?.points || [];
        if (fallbackPoints.length) {
          setChartPoints(fallbackPoints);
          setUsingCachedChart(true);
          setCachedSnapshotTime(cached?.updatedAt || cachedSnapshotTime || null);
        } else {
          setChartPoints([]);
          setUsingCachedChart(false);
          if (!usingCachedQuote) {
            setCachedSnapshotTime(null);
          }
        }
      }
    } catch (error) {
      const cached = await getCachedStockSnapshot(symbol);
      const fallbackPoints = pickBestCachedChart(cached, nextRangeKey)?.points || [];
      if (fallbackPoints.length) {
        setChartPoints(fallbackPoints);
        setUsingCachedChart(true);
        setCachedSnapshotTime(cached?.updatedAt || cachedSnapshotTime || null);
      } else {
        setUsingCachedChart(false);
        if (!usingCachedQuote) {
          setCachedSnapshotTime(null);
        }
        const message = error?.response?.data?.message || "Unable to load selected chart range";
        Alert.alert("Error", message);
      }
    } finally {
      setChartLoading(false);
    }
  };

  const toggleWatchlist = async () => {
    try {
      setWatchlistSaving(true);
      if (inWatchlist) {
        await api.delete(`/market/watchlist/${encodeURIComponent(symbol)}`);
      } else {
        await api.post("/market/watchlist", { symbol });
      }
      await loadStock({ withChart: true });
    } catch (error) {
      const message = error?.response?.data?.message || "Unable to update watchlist";
      Alert.alert("Error", message);
    } finally {
      setWatchlistSaving(false);
    }
  };

  const openBroker = async (broker) => {
    try {
      const appUrl = broker.appUrl(symbol);
      const webUrl = broker.webUrl(symbol);
      const canOpenApp = await Linking.canOpenURL(appUrl);
      if (canOpenApp) {
        await Linking.openURL(appUrl);
        return;
      }
      await Linking.openURL(webUrl);
    } catch (_error) {
      Alert.alert("Unable to open", `Could not open ${broker.name}.`);
    }
  };

  const chartStats = useMemo(() => {
    if (!chartPoints.length) {
      return null;
    }
    const prices = chartPoints.map((item) => item.price);
    return {
      low: Math.min(...prices),
      high: Math.max(...prices),
      start: chartPoints[0]?.price,
      end: chartPoints[chartPoints.length - 1]?.price
    };
  }, [chartPoints]);

  const marketDepth = useMemo(() => {
    const buyPrice = hasNumber(detail?.bid) ? detail.bid : null;
    const sellPrice = hasNumber(detail?.ask) ? detail.ask : null;
    return {
      buyPrice,
      buyQty: hasNumber(detail?.bidSize) ? detail.bidSize : null,
      sellPrice,
      sellQty: hasNumber(detail?.askSize) ? detail.askSize : null,
      spread: hasNumber(buyPrice) && hasNumber(sellPrice) ? sellPrice - buyPrice : null,
      midPrice: hasNumber(buyPrice) && hasNumber(sellPrice) ? (buyPrice + sellPrice) / 2 : null,
      available: hasNumber(buyPrice) || hasNumber(sellPrice)
    };
  }, [detail]);

  const entryStyle = {
    opacity: screenAnim,
    transform: [
      {
        translateY: screenAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [14, 0]
        })
      }
    ]
  };

  const topSuggestion = suggestions?.[0] || null;

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={styles.loader}>
        <Text style={{ color: "#64748b" }}>No stock details available.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Animated.View style={[styles.heroCard, entryStyle]}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroTitleBlock}>
            <Text style={styles.company}>{detail.name || detail.symbol}</Text>
            <Text style={styles.symbolLine}>
              {detail.symbol || "-"}
              {detail.exchange ? ` • ${detail.exchange}` : ""}
            </Text>
          </View>
          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.iconButton} onPress={onRefresh} accessibilityLabel="Refresh quote">
              <Ionicons name="refresh-outline" size={18} color="#1f2937" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, inWatchlist ? styles.iconButtonActive : null]}
              onPress={toggleWatchlist}
              disabled={watchlistSaving}
              accessibilityLabel={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
            >
              {watchlistSaving ? (
                <ActivityIndicator color="#1f2937" size="small" />
              ) : (
                <Ionicons name={inWatchlist ? "bookmark" : "bookmark-outline"} size={18} color="#1f2937" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.price}>
          {formatNumber(detail.price)} {detail.currency || ""}
        </Text>
        <Text style={[styles.change, { color: getChangeColor(detail.changePercent) }]}>
          {formatNumber(detail.change)} ({formatPercent(detail.changePercent)})
        </Text>
        <Text style={styles.metaText}>
          Last update: {formatMarketTime(detail.marketTime)} |{" "}
          {usingCachedData
            ? `Snapshot mode${cachedSnapshotTime ? ` (${new Date(cachedSnapshotTime).toLocaleString()})` : ""}`
            : "Live continuous refresh"}
        </Text>
      </Animated.View>

      <Animated.View style={[styles.chartCard, entryStyle]}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.sectionTitle}>Price Chart</Text>
          <Text style={styles.sectionHint}>{graphType.toUpperCase()} view</Text>
        </View>
        {usingCachedData ? <Text style={styles.cachedChartNote}>Live feed unavailable. Showing last saved chart snapshot.</Text> : null}
        {chartLoading ? (
          <View style={styles.chartLoader}>
            <ActivityIndicator color="#0f766e" />
          </View>
        ) : (
          <PriceChart points={chartPoints} isPositive={(detail.changePercent || 0) >= 0} graphType={graphType} />
        )}

        <View style={styles.graphTypeRow}>
          {GRAPH_TYPE_OPTIONS.map((item) => (
            <TouchableOpacity key={item.key} style={[styles.rangeChip, graphType === item.key ? styles.rangeChipActive : null]} onPress={() => setGraphType(item.key)}>
              <Text style={[styles.rangeText, graphType === item.key ? styles.rangeTextActive : null]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.rangeRow}>
          {RANGE_OPTIONS.map((item) => (
            <TouchableOpacity key={item.key} style={[styles.rangeChip, rangeConfig.key === item.key ? styles.rangeChipActive : null]} onPress={() => onChangeRange(item)}>
              <Text style={[styles.rangeText, rangeConfig.key === item.key ? styles.rangeTextActive : null]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {chartStats ? (
          <View style={styles.metricRowWrap}>
            <QuickMetric label="Low" value={formatNumber(chartStats.low)} />
            <QuickMetric label="High" value={formatNumber(chartStats.high)} />
            <QuickMetric label="Start" value={formatNumber(chartStats.start)} />
            <QuickMetric label="End" value={formatNumber(chartStats.end)} />
          </View>
        ) : null}
      </Animated.View>

      <Animated.View style={[styles.sectionCard, entryStyle]}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.sectionTitle}>Key Levels</Text>
          <Text style={styles.sectionHint}>{detail.marketState || "Market"}</Text>
        </View>
        <View style={styles.metricRowWrap}>
          <QuickMetric label="52W High" value={formatNumber(detail.fiftyTwoWeekHigh)} />
          <QuickMetric label="52W Low" value={formatNumber(detail.fiftyTwoWeekLow)} />
          <QuickMetric label="Open" value={formatNumber(detail.open)} />
          <QuickMetric label="Prev Close" value={formatNumber(detail.previousClose)} />
        </View>
      </Animated.View>

      <Animated.View style={[styles.suggestionCard, entryStyle]}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.sectionTitle}>Recommendation</Text>
          <Text style={[styles.signalTag, { color: normaliseRecommendationColor(topSuggestion?.recommendation) }]}>
            {topSuggestion?.recommendation || "NO SIGNAL"}
          </Text>
        </View>
        <Text style={styles.suggestionNote}>
          {topSuggestion?.note || "No active admin recommendation attached to this stock yet. Live quote and chart details are still available above."}
        </Text>
        <View style={styles.metaDivider} />
        <View style={styles.metricRowWrap}>
          <QuickMetric label="Target" value={topSuggestion?.targetPrice ?? "-"} />
          <QuickMetric label="Stop Loss" value={topSuggestion?.stopLoss ?? "-"} />
        </View>
      </Animated.View>

      <Animated.View style={[styles.sectionCard, entryStyle]}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.sectionTitle}>Market Depth</Text>
          <Text style={styles.sectionHint}>Bid / Ask</Text>
        </View>
        {marketDepth.available ? (
          <>
            <View style={styles.depthHeaderRow}>
              <Text style={styles.depthHeaderCell}>Buy Qty</Text>
              <Text style={styles.depthHeaderCell}>Buy</Text>
              <Text style={styles.depthHeaderCell}>Sell</Text>
              <Text style={styles.depthHeaderCell}>Sell Qty</Text>
            </View>
            <View style={styles.depthRow}>
              <Text style={styles.depthCell}>{formatNumber(marketDepth.buyQty, 0)}</Text>
              <Text style={[styles.depthCell, styles.depthBuy]}>{formatNumber(marketDepth.buyPrice)}</Text>
              <Text style={[styles.depthCell, styles.depthSell]}>{formatNumber(marketDepth.sellPrice)}</Text>
              <Text style={styles.depthCell}>{formatNumber(marketDepth.sellQty, 0)}</Text>
            </View>
            <View style={styles.metricRowWrap}>
              <QuickMetric label="Spread" value={formatNumber(marketDepth.spread)} />
              <QuickMetric label="Mid Price" value={formatNumber(marketDepth.midPrice)} />
            </View>
          </>
        ) : (
          <Text style={styles.emptyText}>Bid/ask depth is not available for this symbol right now.</Text>
        )}
      </Animated.View>

      <Animated.View style={[styles.buyCard, entryStyle]}>
        <Text style={styles.sectionTitle}>Broker Shortcuts</Text>
        <Text style={styles.subtext}>Open this symbol directly inside your broker app.</Text>
        <View style={styles.brokersGrid}>
          {BROKER_APPS.map((broker) => (
            <BrokerButton key={broker.id} broker={broker} onPress={() => openBroker(broker)} />
          ))}
        </View>
      </Animated.View>

      <Animated.View style={[styles.sectionCard, entryStyle]}>
        <Text style={styles.sectionTitle}>Company Details</Text>
        <View style={styles.grid}>
          <Field label="Company" value={detail.name || "-"} />
          <Field label="Symbol" value={detail.symbol || "-"} />
          <Field label="Exchange" value={detail.exchange || "-"} />
          <Field label="Source" value={detail.source || "Yahoo Finance"} />
          <Field label="Market Cap" value={formatNumber(detail.marketCap, 0)} />
          <Field label="Volume" value={formatNumber(detail.volume, 0)} />
          <Field label="P/E (TTM)" value={formatNumber(detail.trailingPE)} />
          <Field label="EPS (TTM)" value={formatNumber(detail.epsTrailingTwelveMonths)} />
        </View>
      </Animated.View>

      <View style={styles.tradeRow}>
        <TouchableOpacity
          style={styles.sellButton}
          onPress={() => Alert.alert("Sell", "Select a broker shortcut above to place a sell order for this stock.")}
          accessibilityLabel="Sell stock"
        >
          <Text style={styles.tradeText}>SELL</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.buyButton}
          onPress={() => Alert.alert("Buy", "Select a broker shortcut above to place a buy order for this stock.")}
          accessibilityLabel="Buy stock"
        >
          <Text style={styles.tradeText}>BUY</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef7f4"
  },
  content: {
    padding: 14,
    paddingBottom: 26
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  heroCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#d5ece4",
    padding: 16,
    marginBottom: 12
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  heroTitleBlock: {
    flex: 1,
    paddingRight: 10
  },
  heroActions: {
    flexDirection: "row",
    gap: 8
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#dbe6e2",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center"
  },
  iconButtonActive: {
    backgroundColor: "#dff4ed",
    borderColor: "#9ad9c2"
  },
  company: {
    color: "#082f2c",
    fontSize: 26,
    fontWeight: "800",
    fontFamily: TITLE_FONT
  },
  symbolLine: {
    color: "#3f5751",
    fontWeight: "700",
    marginTop: 2,
    fontSize: 12,
    fontFamily: BODY_FONT
  },
  price: {
    color: "#031a16",
    fontSize: 34,
    fontWeight: "800",
    marginTop: 8,
    letterSpacing: 0.2,
    fontFamily: TITLE_FONT
  },
  change: {
    fontWeight: "800",
    fontSize: 14,
    marginTop: 2,
    fontFamily: BODY_FONT
  },
  metaText: {
    marginTop: 7,
    color: "#41534f",
    fontSize: 12,
    fontWeight: "600"
  },
  chartCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#d5ece4",
    padding: 14,
    marginBottom: 12
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8
  },
  sectionTitle: {
    color: "#082f2c",
    fontSize: 17,
    fontWeight: "800",
    fontFamily: TITLE_FONT
  },
  sectionHint: {
    color: "#4b635d",
    fontSize: 11,
    fontWeight: "700",
    fontFamily: BODY_FONT
  },
  cachedChartNote: {
    color: "#9a3412",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8
  },
  chartWrap: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#d6e8e1"
  },
  chartLoader: {
    height: CHART_HEIGHT,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d6e8e1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f4fbf8"
  },
  emptyChart: {
    height: CHART_HEIGHT,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d6e8e1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f4fbf8"
  },
  emptyChartText: {
    color: "#4f655f",
    fontWeight: "600"
  },
  graphTypeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12
  },
  rangeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10
  },
  rangeChip: {
    backgroundColor: "#f3f8f6",
    borderColor: "#d6e8e1",
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12
  },
  rangeChipActive: {
    backgroundColor: "#0f766e",
    borderColor: "#0f766e"
  },
  rangeText: {
    color: "#2f4640",
    fontWeight: "800",
    fontSize: 12,
    fontFamily: BODY_FONT
  },
  rangeTextActive: {
    color: "#ffffff"
  },
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#d5ece4",
    padding: 14,
    marginBottom: 12
  },
  suggestionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#d5ece4",
    padding: 14,
    marginBottom: 12
  },
  signalTag: {
    fontWeight: "800",
    fontSize: 12,
    fontFamily: BODY_FONT
  },
  suggestionNote: {
    color: "#304742",
    lineHeight: 20,
    fontSize: 13,
    fontFamily: BODY_FONT
  },
  metaDivider: {
    height: 1,
    backgroundColor: "#e3efe9",
    marginVertical: 10
  },
  metricRowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 10
  },
  metricPill: {
    width: "48%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d8ebe3",
    backgroundColor: "#f8fcfa",
    paddingVertical: 10,
    paddingHorizontal: 10
  },
  metricLabel: {
    color: "#58706a",
    fontSize: 11,
    fontWeight: "700",
    fontFamily: BODY_FONT
  },
  metricValue: {
    marginTop: 4,
    color: "#0a2722",
    fontWeight: "800",
    fontSize: 13,
    fontFamily: BODY_FONT
  },
  depthHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e0ebe6",
    paddingBottom: 7
  },
  depthHeaderCell: {
    flex: 1,
    color: "#55706a",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center"
  },
  depthRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e0ebe6",
    paddingVertical: 10
  },
  depthCell: {
    flex: 1,
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center"
  },
  depthBuy: {
    color: "#059669"
  },
  depthSell: {
    color: "#dc2626"
  },
  emptyText: {
    color: "#4c615b",
    fontWeight: "600"
  },
  buyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#d5ece4",
    padding: 14,
    marginBottom: 12
  },
  subtext: {
    color: "#516863",
    marginBottom: 9,
    fontSize: 12,
    fontWeight: "600"
  },
  brokersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  brokerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f8f6",
    borderWidth: 1,
    borderColor: "#d6e8e1",
    borderRadius: 11,
    paddingVertical: 9,
    paddingHorizontal: 10,
    gap: 8
  },
  brokerMark: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: "#0f766e",
    alignItems: "center",
    justifyContent: "center"
  },
  brokerMarkText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 12
  },
  brokerLabel: {
    fontWeight: "700",
    color: "#1f3a35",
    fontFamily: BODY_FONT
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8
  },
  fieldBox: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#d8ebe3",
    borderRadius: 12,
    padding: 10,
    backgroundColor: "#f8fcfa"
  },
  fieldLabel: {
    color: "#5b736d",
    fontSize: 11,
    marginBottom: 3,
    fontWeight: "700",
    fontFamily: BODY_FONT
  },
  fieldValue: {
    color: "#0b2823",
    fontWeight: "800",
    fontFamily: BODY_FONT
  },
  tradeRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2
  },
  sellButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "#ea4b36",
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center"
  },
  buyButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "#16a34a",
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center"
  },
  tradeText: {
    color: "#ffffff",
    fontWeight: "900",
    letterSpacing: 0.3,
    fontFamily: TITLE_FONT
  }
});
