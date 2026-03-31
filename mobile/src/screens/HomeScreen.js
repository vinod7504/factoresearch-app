import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import api from "../api/client";
import { startContinuousRefresh } from "../constants/realtime";
import { useAppData } from "../context/AppDataContext";
import { useAuth } from "../context/AuthContext";

const hasNumber = (value) => typeof value === "number" && !Number.isNaN(value);

const normalizeSymbol = (value) => String(value || "").trim().toUpperCase();

const isIndianQuote = (item) => {
  const symbol = normalizeSymbol(item?.symbol);
  const exchange = String(item?.exchange || "").toUpperCase();
  const currency = String(item?.currency || "").toUpperCase();

  return symbol.endsWith(".NS") || symbol.endsWith(".BO") || exchange.includes("NSE") || exchange.includes("BSE") || currency === "INR";
};

const splitByMarket = (items = []) =>
  items.reduce(
    (acc, item) => {
      if (isIndianQuote(item)) {
        acc.india.push(item);
      } else {
        acc.us.push(item);
      }
      return acc;
    },
    { india: [], us: [] }
  );

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

const StockRow = ({ item, onPress }) => (
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

const QuoteTile = ({ item, onPress, compact = false, digits = 2 }) => {
  const canOpenDetail = Boolean(item?.symbol && hasNumber(item?.price));
  const title = item?.label || item?.name || item?.symbol || "-";
  const value = hasNumber(item?.price) ? number(item?.price, digits) : item?.value || item?.name || "-";

  return (
    <TouchableOpacity
      style={[styles.quoteTile, compact ? styles.quoteTileCompact : null]}
      onPress={canOpenDetail ? () => onPress(item.symbol) : undefined}
      disabled={!canOpenDetail}
      activeOpacity={0.85}
    >
      <Text style={styles.quoteTitle} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.quotePrice}>{value}</Text>
      <Text style={[styles.quoteChange, { color: changeColor(item?.changePercent) }]}>
        {hasNumber(item?.change) ? `${number(item?.change)} (${percent(item?.changePercent)})` : item?.meta || " "}
      </Text>
    </TouchableOpacity>
  );
};

const PulseValueChip = ({ label, value, onPress }) => (
  <TouchableOpacity style={styles.pulseChip} onPress={onPress} disabled={!onPress} activeOpacity={0.85}>
    <Text style={styles.pulseChipLabel}>{label}</Text>
    <Text style={styles.pulseChipValue}>{value}</Text>
  </TouchableOpacity>
);

const LineAction = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.lineAction} onPress={onPress} activeOpacity={0.85}>
    <Ionicons name={icon} size={14} color="#1d4ed8" />
    <Text style={styles.lineActionText}>{label}</Text>
  </TouchableOpacity>
);

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { profile, riskProfile, selectedPlan, alerts, portfolio } = useAppData();
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
      await loadDashboard();
    } catch (error) {
      const message = error?.response?.data?.message || "Unable to refresh data";
      Alert.alert("Error", message);
    } finally {
      setRefreshing(false);
    }
  };

  const openStockDetails = (symbol) => {
    navigation.navigate("RecommendationDetail", { symbol });
  };

  const usdInr = useMemo(
    () => dashboard?.currencies?.find((item) => item.key === "usdInr") || dashboard?.currencies?.[0] || null,
    [dashboard]
  );
  const eurInr = useMemo(
    () => dashboard?.currencies?.find((item) => item.key === "eurInr") || dashboard?.currencies?.[1] || null,
    [dashboard]
  );
  const visibleIndices = useMemo(() => (dashboard.indices || []).filter((item) => hasNumber(item.price)), [dashboard.indices]);
  const visibleEtfs = useMemo(() => (dashboard.etfs || []).filter((item) => hasNumber(item.price)), [dashboard.etfs]);
  const visibleCommodities = useMemo(() => (dashboard.commodities || []).filter((item) => hasNumber(item.price)), [dashboard.commodities]);
  const visibleCurrencies = useMemo(() => (dashboard.currencies || []).filter((item) => hasNumber(item.price)), [dashboard.currencies]);
  const gainersByMarket = useMemo(() => splitByMarket(dashboard.topGainers || []), [dashboard.topGainers]);
  const losersByMarket = useMemo(() => splitByMarket(dashboard.topLosers || []), [dashboard.topLosers]);
  const snapshotByMarket = useMemo(() => splitByMarket(dashboard.stocks || []), [dashboard.stocks]);

  useEffect(() => {
    const stop = startContinuousRefresh(async () => {
      await loadDashboard();
    });

    return stop;
  }, [loadDashboard]);

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
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Welcome back, {user?.username || "Investor"}.</Text>
        <Text style={styles.hint}>Monitor onboarding, suitability, subscriptions, live recommendations, and tracked symbols in one place.</Text>
      </View>

      <View style={styles.statusGrid}>
        <TouchableOpacity style={styles.statusCard} onPress={() => navigation.navigate("KycProfile")}>
          <Text style={styles.statusTitle}>KYC</Text>
          <Text style={styles.statusValue}>{profile.kycStatus}</Text>
          <Text style={styles.statusHint}>Open onboarding</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statusCard} onPress={() => navigation.navigate("RiskProfile")}>
          <Text style={styles.statusTitle}>Risk Profile</Text>
          <Text style={styles.statusValue}>{riskProfile.level}</Text>
          <Text style={styles.statusHint}>Score {riskProfile.score}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statusCard} onPress={() => navigation.navigate("SubscriptionPlan")}>
          <Text style={styles.statusTitle}>Plan</Text>
          <Text style={styles.statusValue}>{selectedPlan.name}</Text>
          <Text style={styles.statusHint}>{selectedPlan.price}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statusCard} onPress={() => navigation.navigate("AlertsTab")}>
          <Text style={styles.statusTitle}>Alerts</Text>
          <Text style={styles.statusValue}>{alerts.length}</Text>
          <Text style={styles.statusHint}>Configured rules</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.pulseCard}>
        <View style={styles.pulseLine}>
          <Text style={styles.pulseLineLabel}>FX</Text>
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
          <Text style={styles.pulseLineLabel}>Actions</Text>
          <LineAction icon="checkmark-done-outline" label="KYC + Profile" onPress={() => navigation.navigate("KycProfile")} />
          <LineAction icon="pulse-outline" label="Risk" onPress={() => navigation.navigate("RiskProfile")} />
          <LineAction icon="newspaper-outline" label="News" onPress={() => navigation.navigate("MarketNews")} />
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.titleRow}>
          <Text style={styles.sectionTitle}>Recommendation Snapshot</Text>
          <TouchableOpacity onPress={() => navigation.navigate("RecommendationsTab")}>
            <Text style={styles.linkText}>View All</Text>
          </TouchableOpacity>
        </View>
        {dashboard.suggestions?.length === 0 ? (
          <Text style={styles.emptyText}>No live recommendations available.</Text>
        ) : (
          dashboard.suggestions.slice(0, 3).map((item) => (
            <TouchableOpacity key={item.id} style={styles.suggestionRow} onPress={() => openStockDetails(item.symbol)} activeOpacity={0.85}>
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
        <Text style={styles.sectionTitle}>Investor Summary</Text>
        <View style={styles.quoteGrid}>
          <QuoteTile item={{ label: "Portfolio Holdings", value: String(portfolio.length), meta: "Tracked positions" }} onPress={openStockDetails} compact />
          <QuoteTile item={{ label: "Watchlist Symbols", value: String(dashboard.watchlistQuotes?.length || 0), meta: "Market-linked" }} onPress={openStockDetails} compact />
          <QuoteTile item={{ label: "Plan", value: selectedPlan.name, meta: selectedPlan.price }} onPress={openStockDetails} compact />
          <QuoteTile item={{ label: "Risk Band", value: riskProfile.level, meta: `Score ${riskProfile.score}` }} onPress={openStockDetails} compact />
        </View>
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
        <Text style={styles.sectionTitle}>Watchlist Snapshot</Text>
        {dashboard.watchlistQuotes?.length === 0 ? (
          <Text style={styles.emptyText}>No watchlist symbols yet. Add from the Portfolio tab.</Text>
        ) : (
          dashboard.watchlistQuotes.map((item) => <StockRow key={`w-${item.symbol}`} item={item} onPress={openStockDetails} />)
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Top Gainers</Text>
        {gainersByMarket.india.length === 0 ? (
          <Text style={styles.emptyText}>No gainers data available.</Text>
        ) : (
          gainersByMarket.india.map((item) => <StockRow key={`g-${item.symbol}`} item={item} onPress={openStockDetails} />)
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Top Losers</Text>
        {losersByMarket.india.length === 0 ? (
          <Text style={styles.emptyText}>No losers data available.</Text>
        ) : (
          losersByMarket.india.map((item) => <StockRow key={`l-${item.symbol}`} item={item} onPress={openStockDetails} />)
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Market Snapshot</Text>
        {snapshotByMarket.india.length === 0 ? (
          <Text style={styles.emptyText}>No stock data available.</Text>
        ) : (
          snapshotByMarket.india.map((item) => <StockRow key={`i-${item.symbol}`} item={item} onPress={openStockDetails} />)
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Research Resources</Text>
        <Text style={styles.metaLine}>Access service information, disclosures, support, and the admin panel from More.</Text>
        <TouchableOpacity style={styles.openNewsButton} onPress={() => navigation.navigate("MoreTab")}>
          <Ionicons name="layers-outline" size={16} color="#ffffff" />
          <Text style={styles.openNewsButtonText}>Open Services Menu</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.studyCard} onPress={() => navigation.navigate("Study")} activeOpacity={0.88}>
        <View style={styles.studyLeft}>
          <View style={styles.studyIconWrap}>
            <Ionicons name="lock-closed" size={18} color="#1d4ed8" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.studyTitle}>Study</Text>
            <Text style={styles.studySubtitle}>Locked premium section. Upgrade for more features.</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#64748b" />
      </TouchableOpacity>

      {dashboard.updatedAt ? <Text style={styles.updateTime}>Updated: {new Date(dashboard.updatedAt).toLocaleString()}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#eef4ff" },
  content: { padding: 14, paddingBottom: 30 },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  heroCard: { backgroundColor: "#0f3b8f", borderRadius: 16, padding: 14, marginBottom: 10 },
  title: { fontSize: 23, fontWeight: "800", color: "#ffffff" },
  subtitle: { marginTop: 5, marginBottom: 3, color: "#dbeafe", fontSize: 13 },
  hint: { color: "#bfdbfe", fontSize: 12 },
  statusGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8, marginBottom: 10 },
  statusCard: { width: "48%", backgroundColor: "#ffffff", borderRadius: 14, borderWidth: 1, borderColor: "#d5e3ff", padding: 12 },
  statusTitle: { color: "#64748b", fontSize: 12, fontWeight: "700" },
  statusValue: { color: "#0f172a", fontSize: 18, fontWeight: "800", marginTop: 6 },
  statusHint: { color: "#1d4ed8", fontSize: 12, fontWeight: "700", marginTop: 6 },
  pulseCard: { backgroundColor: "#ffffff", borderRadius: 14, borderWidth: 1, borderColor: "#d5e3ff", padding: 12, marginBottom: 10, gap: 8 },
  pulseLine: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  pulseLineLabel: { width: 78, color: "#334155", fontWeight: "700", fontSize: 12 },
  pulseChip: { borderRadius: 999, borderWidth: 1, borderColor: "#bfdbfe", backgroundColor: "#eff6ff", paddingVertical: 6, paddingHorizontal: 10 },
  pulseChipLabel: { color: "#1e3a8a", fontWeight: "700", fontSize: 10 },
  pulseChipValue: { color: "#0f172a", fontWeight: "800", fontSize: 12, marginTop: 1 },
  lineAction: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 999, borderWidth: 1, borderColor: "#bfdbfe", backgroundColor: "#eff6ff", paddingVertical: 7, paddingHorizontal: 11 },
  lineActionText: { color: "#1e3a8a", fontWeight: "700", fontSize: 12 },
  card: { backgroundColor: "#ffffff", borderRadius: 14, borderWidth: 1, borderColor: "#d5e3ff", padding: 12, marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: "800", marginBottom: 8, color: "#0f172a" },
  quoteGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8 },
  compactGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8 },
  quoteTile: { width: "48%", borderRadius: 12, borderWidth: 1, borderColor: "#dbe7ff", backgroundColor: "#f8fbff", padding: 10 },
  quoteTileCompact: { minHeight: 84 },
  quoteTitle: { color: "#1e293b", fontSize: 12, fontWeight: "700" },
  quotePrice: { color: "#0f172a", fontSize: 16, fontWeight: "800", marginTop: 4 },
  quoteChange: { marginTop: 2, fontSize: 12, fontWeight: "700" },
  stockRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#edf2ff" },
  stockSymbol: { fontWeight: "800", color: "#0f172a" },
  stockName: { color: "#64748b", fontSize: 12 },
  stockPrice: { color: "#0f172a", fontWeight: "800" },
  stockChange: { fontSize: 12, fontWeight: "700" },
  emptyText: { color: "#64748b" },
  updateTime: { marginTop: 4, textAlign: "center", color: "#64748b", fontSize: 12 },
  suggestionRow: { flexDirection: "row", alignItems: "center", gap: 10, borderBottomWidth: 1, borderBottomColor: "#edf2ff", paddingVertical: 9 },
  suggestionNote: { fontSize: 12, color: "#64748b", marginTop: 2 },
  suggestionBadge: { borderRadius: 999, backgroundColor: "#1d4ed8", paddingVertical: 5, paddingHorizontal: 10 },
  suggestionBadgeText: { color: "#ffffff", fontWeight: "800", fontSize: 11 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  linkText: { color: "#1d4ed8", fontWeight: "800", fontSize: 12 },
  metaLine: { color: "#475569", marginBottom: 8, fontSize: 12 },
  openNewsButton: { backgroundColor: "#1d4ed8", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  openNewsButtonText: { color: "#ffffff", fontWeight: "800" },
  studyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d5e3ff",
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  studyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1
  },
  studyIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center"
  },
  studyTitle: {
    color: "#0f172a",
    fontWeight: "800",
    fontSize: 16
  },
  studySubtitle: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 3
  }
});
