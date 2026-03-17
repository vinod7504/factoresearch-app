import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Svg, { Defs, LinearGradient, Line, Polyline, Rect, Stop } from "react-native-svg";
import api from "../api/client";
import { AUTO_REFRESH_MS } from "../constants/realtime";

const CHART_WIDTH = Math.max(Dimensions.get("window").width - 50, 280);
const CHART_HEIGHT = 230;

const RANGE_OPTIONS = [
  { key: "1d", label: "1D", interval: "5m" },
  { key: "5d", label: "1W", interval: "15m" },
  { key: "1mo", label: "1M", interval: "1d" },
  { key: "3mo", label: "3M", interval: "1d" },
  { key: "6mo", label: "6M", interval: "1d" },
  { key: "1y", label: "1Y", interval: "1wk" }
];

const BROKER_APPS = [
  {
    id: "groww",
    name: "Groww",
    symbol: "G",
    appUrl: (stockSymbol) => `groww://stocks/${stockSymbol}`,
    webUrl: (stockSymbol) => `https://groww.in/stocks?query=${encodeURIComponent(stockSymbol)}`
  },
  {
    id: "zerodha",
    name: "Zerodha",
    symbol: "Z",
    appUrl: (stockSymbol) => `kite://search/${stockSymbol}`,
    webUrl: (stockSymbol) => `https://kite.zerodha.com/?q=${encodeURIComponent(stockSymbol)}`
  },
  {
    id: "upstox",
    name: "Upstox",
    symbol: "U",
    appUrl: (stockSymbol) => `upstox://stocks/${stockSymbol}`,
    webUrl: (stockSymbol) => `https://upstox.com/search?query=${encodeURIComponent(stockSymbol)}`
  },
  {
    id: "angel",
    name: "Angel One",
    symbol: "A",
    appUrl: (stockSymbol) => `angelone://search/${stockSymbol}`,
    webUrl: (stockSymbol) => `https://www.angelone.in/stocks/${encodeURIComponent(stockSymbol)}`
  }
];

const hasNumber = (value) => typeof value === "number" && !Number.isNaN(value);

const formatNumber = (value, digits = 2) => {
  if (!hasNumber(value)) {
    return "-";
  }

  return value.toLocaleString(undefined, {
    maximumFractionDigits: digits
  });
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

const Field = ({ label, value }) => {
  return (
    <View style={styles.fieldBox}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
};

const QuickMetric = ({ label, value }) => {
  return (
    <View style={styles.metricPill}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
};

const BrokerButton = ({ broker, onPress }) => {
  return (
    <TouchableOpacity style={styles.brokerButton} onPress={onPress} activeOpacity={0.83}>
      <View style={styles.brokerMark}>
        <Text style={styles.brokerMarkText}>{broker.symbol}</Text>
      </View>
      <Text style={styles.brokerLabel}>{broker.name}</Text>
    </TouchableOpacity>
  );
};

const PriceChart = ({ points, isPositive }) => {
  const path = useMemo(() => {
    if (!points.length) {
      return "";
    }

    const values = points.map((item) => item.price);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const diff = max - min || 1;

    return points
      .map((item, index) => {
        const x = (index / Math.max(points.length - 1, 1)) * (CHART_WIDTH - 18) + 9;
        const y = CHART_HEIGHT - ((item.price - min) / diff) * (CHART_HEIGHT - 20) - 10;
        return `${x},${y}`;
      })
      .join(" ");
  }, [points]);

  if (!points.length || !path) {
    return (
      <View style={styles.emptyChart}>
        <Text style={styles.emptyChartText}>No chart data available for this range.</Text>
      </View>
    );
  }

  return (
    <View style={styles.chartWrap}>
      <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
        <Defs>
          <LinearGradient id="chartBg" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#0f2344" stopOpacity="1" />
            <Stop offset="1" stopColor="#101b35" stopOpacity="1" />
          </LinearGradient>
        </Defs>

        <Rect x="0" y="0" width={CHART_WIDTH} height={CHART_HEIGHT} fill="url(#chartBg)" rx="12" ry="12" />

        {[1, 2, 3, 4].map((step) => {
          const y = (CHART_HEIGHT / 5) * step;
          return (
            <Line
              key={`line-${step}`}
              x1="0"
              y1={y}
              x2={CHART_WIDTH}
              y2={y}
              stroke="rgba(148, 163, 184, 0.18)"
              strokeWidth="1"
            />
          );
        })}

        <Polyline
          points={path}
          fill="none"
          stroke={isPositive ? "#38bdf8" : "#f87171"}
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

export default function StockDetailsScreen({ route }) {
  const symbol = String(route.params?.symbol || "").toUpperCase();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [watchlistSaving, setWatchlistSaving] = useState(false);
  const [detail, setDetail] = useState(null);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [rangeConfig, setRangeConfig] = useState(RANGE_OPTIONS[0]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartPoints, setChartPoints] = useState([]);

  const loadStock = useCallback(
    async ({ withChart = true } = {}) => {
      if (!symbol) {
        return;
      }

      const requests = [
        api.get(`/market/quote/${encodeURIComponent(symbol)}`),
        api.get("/market/watchlist"),
        api.get("/suggestions")
      ];

      if (withChart) {
        requests.push(
          api.get(
            `/market/chart/${encodeURIComponent(symbol)}?range=${rangeConfig.key}&interval=${rangeConfig.interval}`
          )
        );
      }

      const responses = await Promise.all(requests);

      const quoteRes = responses[0];
      const watchlistRes = responses[1];
      const suggestionsRes = responses[2];
      const chartRes = withChart ? responses[3] : null;

      const watchlist = watchlistRes.data?.watchlist || [];
      const allSuggestions = suggestionsRes.data?.suggestions || [];

      setDetail(quoteRes.data.quote);
      setInWatchlist(watchlist.includes(symbol));
      setSuggestions(allSuggestions.filter((item) => item.symbol === symbol));

      if (chartRes) {
        setChartPoints(chartRes.data?.points || []);
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
          const message = error?.response?.data?.message || "Unable to fetch stock details";
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

    const timer = setInterval(() => {
      loadStock({ withChart: true }).catch(() => {});
    }, AUTO_REFRESH_MS);

    return () => clearInterval(timer);
  }, [loadStock, symbol]);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadStock({ withChart: true });
    } catch (error) {
      const message = error?.response?.data?.message || "Unable to refresh stock";
      Alert.alert("Error", message);
    } finally {
      setRefreshing(false);
    }
  };

  const onChangeRange = async (config) => {
    try {
      setRangeConfig(config);
      setChartLoading(true);
      const { data } = await api.get(
        `/market/chart/${encodeURIComponent(symbol)}?range=${config.key}&interval=${config.interval}`
      );
      setChartPoints(data.points || []);
    } catch (error) {
      const message = error?.response?.data?.message || "Unable to load selected chart range";
      Alert.alert("Error", message);
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

      await loadStock({ withChart: false });
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
    const start = chartPoints[0]?.price;
    const end = chartPoints[chartPoints.length - 1]?.price;

    return {
      low: Math.min(...prices),
      high: Math.max(...prices),
      start,
      end
    };
  }, [chartPoints]);

  const marketDepth = useMemo(() => {
    const buyPrice = hasNumber(detail?.bid) ? detail.bid : null;
    const buyQty = hasNumber(detail?.bidSize) ? detail.bidSize : null;
    const sellPrice = hasNumber(detail?.ask) ? detail.ask : null;
    const sellQty = hasNumber(detail?.askSize) ? detail.askSize : null;
    const spread = hasNumber(buyPrice) && hasNumber(sellPrice) ? sellPrice - buyPrice : null;
    const midPrice = hasNumber(buyPrice) && hasNumber(sellPrice) ? (buyPrice + sellPrice) / 2 : null;

    return {
      buyPrice,
      buyQty,
      sellPrice,
      sellQty,
      spread,
      midPrice,
      available: hasNumber(buyPrice) || hasNumber(sellPrice)
    };
  }, [detail]);

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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.headerCard}>
        <Text style={styles.company}>{detail.name || detail.symbol}</Text>
        <Text style={styles.symbolLine}>
          {detail.symbol || "-"}
          {detail.exchange ? ` • ${detail.exchange}` : ""}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>
            {formatNumber(detail.price)} {detail.currency || ""}
          </Text>
          <Text style={[styles.change, { color: getChangeColor(detail.changePercent) }]}>
            {formatNumber(detail.change)} ({formatPercent(detail.changePercent)})
          </Text>
        </View>

        <Text style={styles.metaText}>
          Last update: {formatMarketTime(detail.marketTime)} • Auto-refresh {Math.round(AUTO_REFRESH_MS / 1000)}s
        </Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.watchlistButton, inWatchlist ? styles.removeBtn : styles.addBtn]}
            onPress={toggleWatchlist}
            disabled={watchlistSaving}
          >
            {watchlistSaving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.watchlistText}>{inWatchlist ? "Remove Watchlist" : "Add Watchlist"}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.metricRowWrap}>
        <QuickMetric label="Open" value={formatNumber(detail.open)} />
        <QuickMetric label="Prev Close" value={formatNumber(detail.previousClose)} />
        <QuickMetric label="Day High" value={formatNumber(detail.dayHigh)} />
        <QuickMetric label="Day Low" value={formatNumber(detail.dayLow)} />
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.sectionTitle}>Live Price Chart</Text>
        {chartLoading ? (
          <View style={styles.chartLoader}>
            <ActivityIndicator color="#1d4ed8" />
          </View>
        ) : (
          <PriceChart points={chartPoints} isPositive={(detail.changePercent || 0) >= 0} />
        )}

        {chartStats ? (
          <View style={styles.chartStatsRow}>
            <QuickMetric label="Range Low" value={formatNumber(chartStats.low)} />
            <QuickMetric label="Range High" value={formatNumber(chartStats.high)} />
            <QuickMetric label="Start" value={formatNumber(chartStats.start)} />
            <QuickMetric label="End" value={formatNumber(chartStats.end)} />
          </View>
        ) : null}

        <View style={styles.rangeRow}>
          {RANGE_OPTIONS.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.rangeChip, rangeConfig.key === item.key ? styles.rangeChipActive : null]}
              onPress={() => onChangeRange(item)}
            >
              <Text style={[styles.rangeText, rangeConfig.key === item.key ? styles.rangeTextActive : null]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.buyCard}>
        <Text style={styles.sectionTitle}>Buy This Stock</Text>
        <Text style={styles.subtext}>Open your broker app directly with this symbol.</Text>
        <View style={styles.brokersGrid}>
          {BROKER_APPS.map((broker) => (
            <BrokerButton key={broker.id} broker={broker} onPress={() => openBroker(broker)} />
          ))}
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Market Depth (Buy/Sell)</Text>
        <Text style={styles.depthNote}>Level 1 bid/ask depth from Yahoo Finance.</Text>
        {marketDepth.available ? (
          <>
            <View style={styles.depthHeaderRow}>
              <Text style={styles.depthHeaderCell}>Buy Qty</Text>
              <Text style={styles.depthHeaderCell}>Buy Price</Text>
              <Text style={styles.depthHeaderCell}>Sell Price</Text>
              <Text style={styles.depthHeaderCell}>Sell Qty</Text>
            </View>
            <View style={styles.depthRow}>
              <Text style={styles.depthCell}>{formatNumber(marketDepth.buyQty, 0)}</Text>
              <Text style={[styles.depthCell, styles.depthBuy]}>{formatNumber(marketDepth.buyPrice)}</Text>
              <Text style={[styles.depthCell, styles.depthSell]}>{formatNumber(marketDepth.sellPrice)}</Text>
              <Text style={styles.depthCell}>{formatNumber(marketDepth.sellQty, 0)}</Text>
            </View>

            <View style={styles.depthStatsRow}>
              <QuickMetric label="Spread" value={formatNumber(marketDepth.spread)} />
              <QuickMetric label="Mid Price" value={formatNumber(marketDepth.midPrice)} />
            </View>
          </>
        ) : (
          <Text style={styles.emptyText}>Bid/Ask depth currently unavailable for this symbol.</Text>
        )}
      </View>

      {suggestions.length ? (
        <View style={styles.suggestionCard}>
          <Text style={styles.sectionTitle}>Our Suggestion</Text>
          {suggestions.map((item) => (
            <View key={item.id} style={styles.suggestionRow}>
              <Text style={[styles.suggestionBadge, { color: normaliseRecommendationColor(item.recommendation) }]}>
                {item.recommendation}
              </Text>
              <Text style={styles.suggestionNote}>{item.note}</Text>
              <Text style={styles.suggestionMeta}>
                Target: {item.targetPrice ?? "-"} | Stop Loss: {item.stopLoss ?? "-"}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Performance</Text>
        <View style={styles.grid}>
          <Field label="Day Low" value={formatNumber(detail.dayLow)} />
          <Field label="Day High" value={formatNumber(detail.dayHigh)} />
          <Field label="52W Low" value={formatNumber(detail.fiftyTwoWeekLow)} />
          <Field label="52W High" value={formatNumber(detail.fiftyTwoWeekHigh)} />
          <Field label="Open" value={formatNumber(detail.open)} />
          <Field label="Prev Close" value={formatNumber(detail.previousClose)} />
          <Field label="Volume" value={formatNumber(detail.volume, 0)} />
          <Field label="Avg Volume" value={formatNumber(detail.averageVolume, 0)} />
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Fundamentals</Text>
        <View style={styles.grid}>
          <Field label="Market Cap" value={formatNumber(detail.marketCap, 0)} />
          <Field label="Trailing PE" value={formatNumber(detail.trailingPE)} />
          <Field label="Forward PE" value={formatNumber(detail.forwardPE)} />
          <Field label="EPS (TTM)" value={formatNumber(detail.epsTrailingTwelveMonths)} />
          <Field label="Dividend Yield" value={formatPercent(detail.dividendYield)} />
          <Field label="Bid" value={formatNumber(detail.bid)} />
          <Field label="Bid Qty" value={formatNumber(detail.bidSize, 0)} />
          <Field label="Ask" value={formatNumber(detail.ask)} />
          <Field label="Ask Qty" value={formatNumber(detail.askSize, 0)} />
          <Field label="Currency" value={detail.currency || "-"} />
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>About Company</Text>
        <View style={styles.grid}>
          <Field label="Company" value={detail.name || "-"} />
          <Field label="NSE/BSE Symbol" value={detail.symbol || "-"} />
          <Field label="Exchange" value={detail.exchange || "-"} />
          <Field label="Market State" value={detail.marketState || "-"} />
          <Field label="Source" value={detail.source || "Yahoo Finance"} />
          <Field label="Last Update" value={formatMarketTime(detail.marketTime)} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#edf3ff"
  },
  content: {
    padding: 12,
    paddingBottom: 28
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  headerCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d8e5ff",
    padding: 12,
    marginBottom: 10
  },
  company: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1e293b"
  },
  symbolLine: {
    marginTop: 3,
    color: "#475569",
    fontWeight: "700"
  },
  priceRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 10
  },
  price: {
    fontSize: 32,
    fontWeight: "800",
    color: "#0f172a"
  },
  change: {
    fontSize: 14,
    fontWeight: "800"
  },
  metaText: {
    marginTop: 6,
    color: "#64748b",
    fontSize: 12,
    fontWeight: "600"
  },
  headerActions: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "flex-end"
  },
  watchlistButton: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14
  },
  addBtn: {
    backgroundColor: "#1d4ed8"
  },
  removeBtn: {
    backgroundColor: "#dc2626"
  },
  watchlistText: {
    color: "#ffffff",
    fontWeight: "800"
  },
  metricRowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 10
  },
  metricPill: {
    width: "48%",
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#d8e5ff",
    backgroundColor: "#ffffff",
    padding: 9
  },
  metricLabel: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "700"
  },
  metricValue: {
    marginTop: 3,
    color: "#0f172a",
    fontWeight: "800"
  },
  chartCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d8e5ff",
    padding: 12,
    marginBottom: 10
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8
  },
  chartWrap: {
    borderRadius: 12,
    overflow: "hidden"
  },
  chartLoader: {
    height: CHART_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#f8fafc"
  },
  emptyChart: {
    height: CHART_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#f8fafc"
  },
  emptyChartText: {
    color: "#64748b"
  },
  chartStatsRow: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8
  },
  rangeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10
  },
  rangeChip: {
    backgroundColor: "#f8fafc",
    borderColor: "#dbe3ee",
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12
  },
  rangeChipActive: {
    backgroundColor: "#1d4ed8",
    borderColor: "#1d4ed8"
  },
  rangeText: {
    color: "#334155",
    fontWeight: "700",
    fontSize: 12
  },
  rangeTextActive: {
    color: "#ffffff"
  },
  buyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d8e5ff",
    padding: 12,
    marginBottom: 10
  },
  subtext: {
    color: "#64748b",
    marginBottom: 8
  },
  depthNote: {
    color: "#64748b",
    marginBottom: 8,
    fontSize: 12
  },
  depthHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 6,
    marginBottom: 6
  },
  depthHeaderCell: {
    flex: 1,
    color: "#64748b",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center"
  },
  depthRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 8,
    marginBottom: 8
  },
  depthCell: {
    flex: 1,
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center"
  },
  depthBuy: {
    color: "#16a34a"
  },
  depthSell: {
    color: "#dc2626"
  },
  depthStatsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8
  },
  emptyText: {
    color: "#64748b"
  },
  brokersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  brokerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#dbe3ee",
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 10,
    gap: 8
  },
  brokerMark: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: "#1d4ed8",
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
    color: "#0f172a"
  },
  suggestionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d8e5ff",
    padding: 12,
    marginBottom: 10
  },
  suggestionRow: {
    borderColor: "#e2e8f0",
    borderBottomWidth: 1,
    paddingBottom: 10,
    marginBottom: 10
  },
  suggestionBadge: {
    fontWeight: "800",
    marginBottom: 4
  },
  suggestionNote: {
    color: "#334155",
    lineHeight: 20
  },
  suggestionMeta: {
    color: "#64748b",
    marginTop: 6,
    fontSize: 12
  },
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d8e5ff",
    padding: 12,
    marginBottom: 10
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
    borderColor: "#dce6f8",
    borderRadius: 10,
    padding: 9,
    backgroundColor: "#f9fbff"
  },
  fieldLabel: {
    color: "#64748b",
    fontSize: 11,
    marginBottom: 2,
    fontWeight: "700"
  },
  fieldValue: {
    color: "#0f172a",
    fontWeight: "800"
  }
});
