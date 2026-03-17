import React, { useCallback, useEffect, useState } from "react";
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
import { useFocusEffect } from "@react-navigation/native";
import api from "../api/client";
import { AUTO_REFRESH_MS } from "../constants/realtime";

const recommendationColor = (value) => {
  if (value === "BUY") {
    return "#16a34a";
  }
  if (value === "SELL") {
    return "#dc2626";
  }
  return "#2563eb";
};

const SuggestionCard = ({ item, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(item.symbol)} activeOpacity={0.85}>
      <View style={styles.cardHeader}>
        <Text style={styles.symbol}>{item.symbol}</Text>
        <Text style={[styles.recommendation, { color: recommendationColor(item.recommendation) }]}>
          {item.recommendation}
        </Text>
      </View>

      <Text style={styles.note}>{item.note}</Text>

      <View style={styles.metricsRow}>
        <Text style={styles.metric}>Target: {item.targetPrice ?? "-"}</Text>
        <Text style={styles.metric}>Stop Loss: {item.stopLoss ?? "-"}</Text>
      </View>

      <Text style={styles.dateText}>Added: {new Date(item.createdAt).toLocaleString()}</Text>
    </TouchableOpacity>
  );
};

export default function SuggestionsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const loadSuggestions = useCallback(async () => {
    const { data } = await api.get("/suggestions");
    setSuggestions(data.suggestions || []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const run = async () => {
        try {
          setLoading(true);
          const { data } = await api.get("/suggestions");

          if (mounted) {
            setSuggestions(data.suggestions || []);
          }
        } catch (error) {
          const message = error?.response?.data?.message || "Unable to fetch suggestions";
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
    }, [])
  );

  useEffect(() => {
    const timer = setInterval(() => {
      loadSuggestions().catch(() => {});
    }, AUTO_REFRESH_MS);

    return () => clearInterval(timer);
  }, [loadSuggestions]);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadSuggestions();
    } catch (error) {
      const message = error?.response?.data?.message || "Unable to refresh suggestions";
      Alert.alert("Error", message);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Our Suggestions</Text>
      <Text style={styles.subtitle}>
        Manually curated stock suggestions from Factoresearch admin. Auto-refresh every{" "}
        {Math.round(AUTO_REFRESH_MS / 1000)}s.
      </Text>

      {suggestions.length ? (
        suggestions.map((item) => (
          <SuggestionCard
            key={item.id}
            item={item}
            onPress={(symbol) => navigation.navigate("StockDetails", { symbol })}
          />
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No suggestions available right now.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f6fa"
  },
  content: {
    padding: 16,
    paddingBottom: 24
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0f172a"
  },
  subtitle: {
    color: "#475569",
    marginTop: 4,
    marginBottom: 12
  },
  card: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dbe3ee",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6
  },
  symbol: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0f172a"
  },
  recommendation: {
    fontWeight: "800",
    fontSize: 13
  },
  note: {
    color: "#334155",
    lineHeight: 20,
    marginBottom: 8
  },
  metricsRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 6
  },
  metric: {
    color: "#1e293b",
    fontWeight: "700",
    fontSize: 12
  },
  dateText: {
    color: "#64748b",
    fontSize: 11
  },
  emptyCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dbe3ee",
    borderRadius: 12,
    padding: 14
  },
  emptyText: {
    color: "#64748b"
  }
});
