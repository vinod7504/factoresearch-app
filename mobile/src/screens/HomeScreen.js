import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import api from "../api/client";
import { AUTO_REFRESH_MS } from "../constants/realtime";

const hasNumber = (value) => typeof value === "number" && !Number.isNaN(value);

const number = (value, digits = 2) => {
  if (!hasNumber(value)) {
    return "-";
  }

  return value.toLocaleString(undefined, {
    maximumFractionDigits: digits
  });
};

const percent = (value) => {
  if (!hasNumber(value)) {
    return "-";
  }

  return `${value.toFixed(2)}%`;
};

const changeColor = (value) => {
  if (!hasNumber(value)) {
    return "#334155";
  }
  return value >= 0 ? "#16a34a" : "#dc2626";
};

const StockRow = ({ item, onPress }) => {
  return (
    <TouchableOpacity style={styles.stockRow} onPress={() => onPress(item.symbol)} activeOpacity={0.82}>
      <View style={{ flex: 1 }}>
        <Text style={styles.stockSymbol}>{item.symbol}</Text>
        <Text style={styles.stockName} numberOfLines={1}>
          {item.name}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={styles.stockPrice}>{number(item.price)}</Text>
        <Text style={[styles.stockChange, { color: changeColor(item.changePercent) }]}>
          {number(item.change)} ({percent(item.changePercent)})
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const QuoteTile = ({ item, onPress, compact = false, digits = 2 }) => {
  const canOpenDetail = Boolean(item?.symbol && hasNumber(item?.price));

  return (
    <TouchableOpacity
      style={[styles.quoteTile, compact ? styles.quoteTileCompact : null]}
      onPress={canOpenDetail ? () => onPress(item.symbol) : undefined}
      disabled={!canOpenDetail}
      activeOpacity={0.85}
    >
      <Text style={styles.quoteTitle} numberOfLines={1}>
        {item?.label || item?.name || item?.symbol || "-"}
      </Text>
      <Text style={styles.quotePrice}>{number(item?.price, digits)}</Text>
      <Text style={[styles.quoteChange, { color: changeColor(item?.changePercent) }]}>
        {number(item?.change)} ({percent(item?.changePercent)})
      </Text>
    </TouchableOpacity>
  );
};

const PulseValueChip = ({ label, value, onPress }) => {
  const clickable = typeof onPress === "function";

  return (
    <TouchableOpacity style={styles.pulseChip} onPress={onPress} disabled={!clickable} activeOpacity={0.85}>
      <Text style={styles.pulseChipLabel}>{label}</Text>
      <Text style={styles.pulseChipValue}>{value}</Text>
    </TouchableOpacity>
  );
};

const LineAction = ({ icon, label, onPress }) => {
  return (
    <TouchableOpacity style={styles.lineAction} onPress={onPress} activeOpacity={0.85}>
      <Ionicons name={icon} size={14} color="#1d4ed8" />
      <Text style={styles.lineActionText}>{label}</Text>
    </TouchableOpacity>
  );
};

export default function HomeScreen({ navigation }) {
  const [searchSymbol, setSearchSymbol] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [dashboard, setDashboard] = useState({
    welcomeMessage: "Welcome to Factoresearch",
    stocks: [],
    watchlistQuotes: [],
    suggestions: [],
    topGainers: [],
    topLosers: [],
    indices: [],
    etfs: [],
    commodities: [],
    currencies: [],
    news: []
  });

  const loadDashboard = useCallback(async () => {
    const { data } = await api.get("/market/dashboard");
    setDashboard(data);
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        setLoading(true);
        await loadDashboard();
      } catch (error) {
        const message = error?.response?.data?.message || "Unable to fetch market data";
        Alert.alert("Error", message);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [loadDashboard]);

  useFocusEffect(
    useCallback(() => {
      loadDashboard().catch(() => {});
    }, [loadDashboard])
  );

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      setSearchResult(null);
      await loadDashboard();
    } catch (error) {
      const message = error?.response?.data?.message || "Unable to refresh data";
      Alert.alert("Error", message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearch = async () => {
    const symbol = searchSymbol.trim().toUpperCase();

    if (!symbol) {
      Alert.alert("Validation", "Enter a stock symbol (example: RELIANCE.NS or AAPL)");
      return;
    }

    try {
      setSearchLoading(true);
      const { data } = await api.get(`/market/quote/${encodeURIComponent(symbol)}`);
      setSearchResult(data.quote);
    } catch (error) {
      setSearchResult(null);
      const message = error?.response?.data?.message || "Unable to fetch stock quote";
      Alert.alert("Search Failed", message);
    } finally {
      setSearchLoading(false);
    }
  };

  const openStockDetails = (symbol) => {
    navigation.navigate("StockDetails", { symbol });
  };

  const usdInr = useMemo(
    () => dashboard?.currencies?.find((item) => item.key === "usdInr") || dashboard?.currencies?.[0] || null,
    [dashboard]
  );

  const eurInr = useMemo(
    () => dashboard?.currencies?.find((item) => item.key === "eurInr") || dashboard?.currencies?.[1] || null,
    [dashboard]
  );

  const visibleIndices = useMemo(
    () => (dashboard.indices || []).filter((item) => hasNumber(item.price)),
    [dashboard.indices]
  );

  const visibleEtfs = useMemo(
    () => (dashboard.etfs || []).filter((item) => hasNumber(item.price)),
    [dashboard.etfs]
  );

  const visibleCommodities = useMemo(
    () => (dashboard.commodities || []).filter((item) => hasNumber(item.price)),
    [dashboard.commodities]
  );

  const visibleCurrencies = useMemo(
    () => (dashboard.currencies || []).filter((item) => hasNumber(item.price)),
    [dashboard.currencies]
  );

  useEffect(() => {
    const searchedSymbol = searchResult?.symbol;

    const timer = setInterval(() => {
      loadDashboard().catch(() => {});

      if (searchedSymbol) {
        api
          .get(`/market/quote/${encodeURIComponent(searchedSymbol)}`)
          .then(({ data }) => setSearchResult(data.quote))
          .catch(() => {});
      }
    }, AUTO_REFRESH_MS);

    return () => clearInterval(timer);
  }, [loadDashboard, searchResult?.symbol]);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.heroCard}>
        <Text style={styles.title}>{dashboard.welcomeMessage}</Text>
        <Text style={styles.subtitle}>Clear dashboard view for market tracking and analysis.</Text>
        <Text style={styles.hint}>
          Tap any stock card or row for details. Live values auto-refresh every {Math.round(AUTO_REFRESH_MS / 1000)}s.
        </Text>
      </View>

      <View style={styles.pulseCard}>
        <View style={styles.pulseLine}>
          <Text style={styles.pulseLineLabel}>Currencies</Text>
          <PulseValueChip
            label="USD/INR"
            value={number(usdInr?.price, 4)}
            onPress={usdInr?.symbol ? () => openStockDetails(usdInr.symbol) : undefined}
          />
          <PulseValueChip
            label="EUR/INR"
            value={number(eurInr?.price, 4)}
            onPress={eurInr?.symbol ? () => openStockDetails(eurInr.symbol) : undefined}
          />
        </View>

        <View style={styles.pulseLine}>
          <Text style={styles.pulseLineLabel}>Options</Text>
          <LineAction icon="menu-outline" label="More Options" onPress={() => navigation.navigate("MoreTab")} />
          <LineAction icon="person-outline" label="Profile" onPress={() => navigation.navigate("AccountDetails")} />
          <LineAction icon="newspaper-outline" label="News" onPress={() => navigation.navigate("MarketNews")} />
        </View>
      </View>

      <View style={styles.searchCard}>
        <Text style={styles.sectionTitle}>Stock Search</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Enter symbol (RELIANCE.NS / AAPL)"
            placeholderTextColor="#94a3b8"
            autoCapitalize="characters"
            value={searchSymbol}
            onChangeText={setSearchSymbol}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={searchLoading}>
            {searchLoading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.searchButtonText}>Search</Text>}
          </TouchableOpacity>
        </View>
        {searchResult ? <StockRow item={searchResult} onPress={openStockDetails} /> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Indian Indices</Text>
        {visibleIndices.length === 0 ? (
          <Text style={styles.emptyText}>Indices data unavailable.</Text>
        ) : (
          <View style={styles.quoteGrid}>
            {visibleIndices.map((item) => (
              <QuoteTile key={item.key || item.symbol} item={item} onPress={openStockDetails} />
            ))}
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>ETFs</Text>
        {visibleEtfs.length === 0 ? (
          <Text style={styles.emptyText}>ETF data unavailable.</Text>
        ) : (
          <View style={styles.compactGrid}>
            {visibleEtfs.map((item) => (
              <QuoteTile key={item.key || item.symbol} item={item} onPress={openStockDetails} compact />
            ))}
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Commodities</Text>
        {visibleCommodities.length === 0 ? (
          <Text style={styles.emptyText}>Commodities data unavailable.</Text>
        ) : (
          <View style={styles.compactGrid}>
            {visibleCommodities.map((item) => (
              <QuoteTile key={item.key || item.symbol} item={item} onPress={openStockDetails} compact />
            ))}
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Currencies</Text>
        {visibleCurrencies.length === 0 ? (
          <Text style={styles.emptyText}>Currencies data unavailable.</Text>
        ) : (
          <View style={styles.compactGrid}>
            {visibleCurrencies.map((item) => (
              <QuoteTile key={item.key || item.symbol} item={item} onPress={openStockDetails} compact digits={4} />
            ))}
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>News (Separate)</Text>
        <Text style={styles.metaLine}>Open market news in a separate dashboard option.</Text>
        <TouchableOpacity style={styles.openNewsButton} onPress={() => navigation.navigate("MarketNews")}>
          <Ionicons name="newspaper-outline" size={16} color="#ffffff" />
          <Text style={styles.openNewsButtonText}>Open Market News</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>My Watchlist</Text>
        {dashboard.watchlistQuotes?.length === 0 ? (
          <Text style={styles.emptyText}>No watchlist stocks yet. Add from Watchlist tab.</Text>
        ) : (
          dashboard.watchlistQuotes.map((item) => (
            <StockRow key={`w-${item.symbol}`} item={item} onPress={openStockDetails} />
          ))
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.titleRow}>
          <Text style={styles.sectionTitle}>Our Suggestions</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Suggestions")}>
            <Text style={styles.linkText}>View All</Text>
          </TouchableOpacity>
        </View>

        {dashboard.suggestions?.length === 0 ? (
          <Text style={styles.emptyText}>No active suggestions available.</Text>
        ) : (
          dashboard.suggestions.slice(0, 4).map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.suggestionRow}
              onPress={() => openStockDetails(item.symbol)}
              activeOpacity={0.85}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.stockSymbol}>{item.symbol}</Text>
                <Text style={styles.suggestionNote} numberOfLines={2}>
                  {item.note}
                </Text>
              </View>
              <View style={styles.suggestionBadge}>
                <Text style={styles.suggestionBadgeText}>{item.recommendation}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Top Gainers</Text>
        {dashboard.topGainers.length === 0 ? (
          <Text style={styles.emptyText}>No gainers data available.</Text>
        ) : (
          dashboard.topGainers.map((item) => (
            <StockRow key={`g-${item.symbol}`} item={item} onPress={openStockDetails} />
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Top Losers</Text>
        {dashboard.topLosers.length === 0 ? (
          <Text style={styles.emptyText}>No losers data available.</Text>
        ) : (
          dashboard.topLosers.map((item) => (
            <StockRow key={`l-${item.symbol}`} item={item} onPress={openStockDetails} />
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Stock Snapshot</Text>
        {dashboard.stocks.length === 0 ? (
          <Text style={styles.emptyText}>No stock data available.</Text>
        ) : (
          dashboard.stocks.map((item) => <StockRow key={item.symbol} item={item} onPress={openStockDetails} />)
        )}
      </View>

      {dashboard.updatedAt ? (
        <Text style={styles.updateTime}>Updated: {new Date(dashboard.updatedAt).toLocaleString()}</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef4ff"
  },
  content: {
    padding: 14,
    paddingBottom: 30
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  heroCard: {
    backgroundColor: "#0f3b8f",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10
  },
  title: {
    fontSize: 23,
    fontWeight: "800",
    color: "#ffffff"
  },
  subtitle: {
    marginTop: 5,
    marginBottom: 3,
    color: "#dbeafe",
    fontSize: 13
  },
  hint: {
    color: "#bfdbfe",
    fontSize: 12
  },
  pulseCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d5e3ff",
    padding: 12,
    marginBottom: 10,
    gap: 8
  },
  pulseLine: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8
  },
  pulseLineLabel: {
    width: 78,
    color: "#334155",
    fontWeight: "700",
    fontSize: 12
  },
  pulseChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    backgroundColor: "#eff6ff",
    paddingVertical: 6,
    paddingHorizontal: 10
  },
  pulseChipLabel: {
    color: "#1e3a8a",
    fontWeight: "700",
    fontSize: 10
  },
  pulseChipValue: {
    color: "#0f172a",
    fontWeight: "800",
    fontSize: 12,
    marginTop: 1
  },
  lineAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    backgroundColor: "#eff6ff",
    paddingVertical: 7,
    paddingHorizontal: 11
  },
  lineActionText: {
    color: "#1e3a8a",
    fontWeight: "700",
    fontSize: 12
  },
  searchCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d5e3ff",
    padding: 12,
    marginBottom: 10
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#f8fbff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d7e4fb",
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: "#0f172a"
  },
  searchButton: {
    backgroundColor: "#1d4ed8",
    borderRadius: 10,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  searchButtonText: {
    color: "#ffffff",
    fontWeight: "800"
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d5e3ff",
    padding: 12,
    marginBottom: 10
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 8,
    color: "#0f172a"
  },
  quoteGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8
  },
  compactGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8
  },
  quoteTile: {
    width: "48%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dbe7ff",
    backgroundColor: "#f8fbff",
    padding: 10
  },
  quoteTileCompact: {
    minHeight: 84
  },
  quoteTitle: {
    color: "#1e293b",
    fontSize: 12,
    fontWeight: "700"
  },
  quotePrice: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 4
  },
  quoteChange: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700"
  },
  stockRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#edf2ff"
  },
  stockSymbol: {
    fontWeight: "800",
    color: "#0f172a"
  },
  stockName: {
    color: "#64748b",
    fontSize: 12
  },
  stockPrice: {
    color: "#0f172a",
    fontWeight: "800"
  },
  stockChange: {
    fontSize: 12,
    fontWeight: "700"
  },
  emptyText: {
    color: "#64748b"
  },
  updateTime: {
    marginTop: 4,
    textAlign: "center",
    color: "#64748b",
    fontSize: 12
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#edf2ff",
    paddingVertical: 9
  },
  suggestionNote: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2
  },
  suggestionBadge: {
    borderRadius: 999,
    backgroundColor: "#1d4ed8",
    paddingVertical: 5,
    paddingHorizontal: 10
  },
  suggestionBadgeText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 11
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  linkText: {
    color: "#1d4ed8",
    fontWeight: "800",
    fontSize: 12
  },
  metaLine: {
    color: "#475569",
    marginBottom: 8,
    fontSize: 12
  },
  openNewsButton: {
    backgroundColor: "#1d4ed8",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  openNewsButtonText: {
    color: "#ffffff",
    fontWeight: "800"
  }
});
