import React, { useCallback, useEffect, useState } from "react";
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
import { useFocusEffect } from "@react-navigation/native";
import api from "../api/client";
import { AUTO_REFRESH_MS } from "../constants/realtime";

const number = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

const percent = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }
  return `${value.toFixed(2)}%`;
};

const changeColor = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "#334155";
  }
  return value >= 0 ? "#16a34a" : "#dc2626";
};

const WatchRow = ({ item, onPress, onRemove }) => {
  return (
    <View style={styles.row}>
      <TouchableOpacity style={{ flex: 1 }} onPress={() => onPress(item.symbol)} activeOpacity={0.8}>
        <Text style={styles.symbol}>{item.symbol}</Text>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.price}>{number(item.price)}</Text>
        <Text style={[styles.change, { color: changeColor(item.changePercent) }]}>
          {number(item.change)} ({percent(item.changePercent)})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.removeButton} onPress={() => onRemove(item.symbol)}>
        <Text style={styles.removeText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function WatchlistScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [watchData, setWatchData] = useState({ watchlist: [], quotes: [] });
  const [newSymbol, setNewSymbol] = useState("");
  const [saving, setSaving] = useState(false);

  const loadWatchlist = useCallback(async () => {
    const { data } = await api.get("/market/watchlist");
    setWatchData(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const load = async () => {
        try {
          setLoading(true);
          const { data } = await api.get("/market/watchlist");
          if (mounted) {
            setWatchData(data);
          }
        } catch (error) {
          const message = error?.response?.data?.message || "Unable to fetch watchlist";
          Alert.alert("Error", message);
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

      load();

      return () => {
        mounted = false;
      };
    }, [])
  );

  useEffect(() => {
    const timer = setInterval(() => {
      loadWatchlist().catch(() => {});
    }, AUTO_REFRESH_MS);

    return () => clearInterval(timer);
  }, [loadWatchlist]);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadWatchlist();
    } catch (error) {
      const message = error?.response?.data?.message || "Unable to refresh watchlist";
      Alert.alert("Error", message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAdd = async () => {
    const symbol = newSymbol.trim().toUpperCase();

    if (!symbol) {
      Alert.alert("Validation", "Enter symbol to add");
      return;
    }

    try {
      setSaving(true);
      const { data } = await api.post("/market/watchlist", { symbol });
      setWatchData({ watchlist: data.watchlist, quotes: data.quotes });
      setNewSymbol("");
    } catch (error) {
      const message = error?.response?.data?.message || "Unable to add symbol";
      Alert.alert("Error", message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (symbol) => {
    try {
      const { data } = await api.delete(`/market/watchlist/${encodeURIComponent(symbol)}`);
      setWatchData({ watchlist: data.watchlist, quotes: data.quotes });
    } catch (error) {
      const message = error?.response?.data?.message || "Unable to remove symbol";
      Alert.alert("Error", message);
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
      <Text style={styles.title}>My Watchlist</Text>
      <Text style={styles.subtitle}>
        Track and manage your personal stock watchlist. Auto-refresh every {Math.round(AUTO_REFRESH_MS / 1000)}s.
      </Text>

      <View style={styles.addCard}>
        <TextInput
          style={styles.input}
          placeholder="Add symbol (e.g. RELIANCE.NS, AAPL)"
          autoCapitalize="characters"
          value={newSymbol}
          onChangeText={setNewSymbol}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAdd} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.addButtonText}>Add</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.listCard}>
        {watchData.quotes?.length ? (
          watchData.quotes.map((item) => (
            <WatchRow
              key={item.symbol}
              item={item}
              onPress={(symbol) => navigation.navigate("StockDetails", { symbol })}
              onRemove={handleRemove}
            />
          ))
        ) : (
          <Text style={styles.emptyText}>No symbols in watchlist.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f6fa"
  },
  content: {
    padding: 16
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0f172a"
  },
  subtitle: {
    color: "#475569",
    marginTop: 4,
    marginBottom: 12
  },
  addCard: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10
  },
  input: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dbe3ee",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11
  },
  addButton: {
    backgroundColor: "#2e52b7",
    borderRadius: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center"
  },
  addButtonText: {
    color: "#ffffff",
    fontWeight: "700"
  },
  listCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dbe3ee",
    borderRadius: 12,
    padding: 12
  },
  row: {
    borderBottomColor: "#e2e8f0",
    borderBottomWidth: 1,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  symbol: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a"
  },
  name: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 2
  },
  price: {
    color: "#0f172a",
    fontWeight: "700"
  },
  change: {
    fontSize: 12,
    fontWeight: "700"
  },
  removeButton: {
    backgroundColor: "#fee2e2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10
  },
  removeText: {
    color: "#991b1b",
    fontWeight: "700",
    fontSize: 12
  },
  emptyText: {
    color: "#64748b"
  }
});
