import React, { useCallback, useMemo, useState } from "react";
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
import { useAuth } from "../context/AuthContext";

const recommendations = ["BUY", "HOLD", "SELL"];

const AdminSuggestionRow = ({ item, onDelete, onToggleActive }) => {
  return (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemSymbol}>{item.symbol}</Text>
        <Text style={styles.itemRecommendation}>{item.recommendation}</Text>
      </View>

      <Text style={styles.itemNote}>{item.note}</Text>

      <Text style={styles.itemMeta}>Target: {item.targetPrice ?? "-"} | Stop Loss: {item.stopLoss ?? "-"}</Text>
      <Text style={styles.itemMeta}>Status: {item.active ? "Active" : "Inactive"}</Text>

      <View style={styles.itemActions}>
        <TouchableOpacity style={styles.secondaryAction} onPress={() => onToggleActive(item)}>
          <Text style={styles.secondaryActionText}>{item.active ? "Make Inactive" : "Make Active"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteAction} onPress={() => onDelete(item.id)}>
          <Text style={styles.deleteActionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function AdminSuggestionsScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState([]);

  const [form, setForm] = useState({
    symbol: "",
    recommendation: "BUY",
    targetPrice: "",
    stopLoss: "",
    note: ""
  });

  const canSubmit = useMemo(() => {
    return form.symbol.trim() && form.note.trim();
  }, [form.symbol, form.note]);

  const loadAdminSuggestions = useCallback(async () => {
    const { data } = await api.get("/admin/suggestions");
    setItems(data.suggestions || []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const run = async () => {
        if (!isAdmin) {
          setLoading(false);
          return;
        }

        try {
          setLoading(true);
          const { data } = await api.get("/admin/suggestions");
          if (mounted) {
            setItems(data.suggestions || []);
          }
        } catch (error) {
          const message = error?.response?.data?.message || "Unable to fetch admin suggestions";
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
    }, [isAdmin])
  );

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadAdminSuggestions();
    } catch (error) {
      const message = error?.response?.data?.message || "Unable to refresh";
      Alert.alert("Error", message);
    } finally {
      setRefreshing(false);
    }
  };

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submitSuggestion = async () => {
    if (!canSubmit) {
      Alert.alert("Validation", "Symbol and note are required");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/admin/suggestions", {
        symbol: form.symbol,
        recommendation: form.recommendation,
        targetPrice: form.targetPrice,
        stopLoss: form.stopLoss,
        note: form.note
      });

      setForm({
        symbol: "",
        recommendation: "BUY",
        targetPrice: "",
        stopLoss: "",
        note: ""
      });

      await loadAdminSuggestions();
    } catch (error) {
      const message = error?.response?.data?.message || "Unable to create suggestion";
      Alert.alert("Error", message);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteSuggestion = async (id) => {
    try {
      await api.delete(`/admin/suggestions/${id}`);
      await loadAdminSuggestions();
    } catch (error) {
      const message = error?.response?.data?.message || "Unable to delete suggestion";
      Alert.alert("Error", message);
    }
  };

  const toggleSuggestion = async (item) => {
    try {
      await api.patch(`/admin/suggestions/${item.id}`, {
        active: !item.active
      });
      await loadAdminSuggestions();
    } catch (error) {
      const message = error?.response?.data?.message || "Unable to update suggestion";
      Alert.alert("Error", message);
    }
  };

  if (!isAdmin) {
    return (
      <View style={styles.centered}>
        <Text style={styles.deniedTitle}>Admin Access Required</Text>
        <Text style={styles.deniedSub}>Only admin users can open this page.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
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
      <Text style={styles.title}>Admin Suggestions Panel</Text>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Add Stock Suggestion</Text>

        <TextInput
          style={styles.input}
          placeholder="Symbol (e.g. RELIANCE.NS)"
          autoCapitalize="characters"
          value={form.symbol}
          onChangeText={(value) => updateField("symbol", value)}
        />

        <View style={styles.recommendationRow}>
          {recommendations.map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => updateField("recommendation", item)}
              style={[
                styles.recommendationChip,
                form.recommendation === item ? styles.recommendationChipActive : null
              ]}
            >
              <Text
                style={[
                  styles.recommendationChipText,
                  form.recommendation === item ? styles.recommendationChipTextActive : null
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.input}
          placeholder="Target Price (optional)"
          keyboardType="numeric"
          value={form.targetPrice}
          onChangeText={(value) => updateField("targetPrice", value)}
        />

        <TextInput
          style={styles.input}
          placeholder="Stop Loss (optional)"
          keyboardType="numeric"
          value={form.stopLoss}
          onChangeText={(value) => updateField("stopLoss", value)}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Suggestion note / analysis"
          multiline
          value={form.note}
          onChangeText={(value) => updateField("note", value)}
        />

        <TouchableOpacity style={styles.submitButton} onPress={submitSuggestion} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitText}>Add Suggestion</Text>}
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Existing Suggestions</Text>
      {items.length ? (
        items.map((item) => (
          <AdminSuggestionRow
            key={item.id}
            item={item}
            onDelete={deleteSuggestion}
            onToggleActive={toggleSuggestion}
          />
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No suggestions yet.</Text>
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
    paddingBottom: 30
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f6fa",
    padding: 16
  },
  deniedTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a"
  },
  deniedSub: {
    color: "#475569",
    marginTop: 6,
    textAlign: "center"
  },
  title: {
    fontSize: 25,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 10
  },
  formCard: {
    backgroundColor: "#ffffff",
    borderColor: "#dbe3ee",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8
  },
  input: {
    backgroundColor: "#ffffff",
    borderColor: "#dbe3ee",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 10
  },
  textArea: {
    minHeight: 86,
    textAlignVertical: "top"
  },
  recommendationRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10
  },
  recommendationChip: {
    borderWidth: 1,
    borderColor: "#dbe3ee",
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: "#ffffff"
  },
  recommendationChipActive: {
    backgroundColor: "#2e52b7",
    borderColor: "#2e52b7"
  },
  recommendationChipText: {
    color: "#0f172a",
    fontWeight: "700",
    fontSize: 12
  },
  recommendationChipTextActive: {
    color: "#ffffff"
  },
  submitButton: {
    backgroundColor: "#2e52b7",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center"
  },
  submitText: {
    color: "#ffffff",
    fontWeight: "700"
  },
  itemCard: {
    backgroundColor: "#ffffff",
    borderColor: "#dbe3ee",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6
  },
  itemSymbol: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a"
  },
  itemRecommendation: {
    color: "#2563eb",
    fontWeight: "800"
  },
  itemNote: {
    color: "#334155",
    marginBottom: 8,
    lineHeight: 20
  },
  itemMeta: {
    color: "#475569",
    fontSize: 12,
    marginBottom: 4
  },
  itemActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6
  },
  secondaryAction: {
    borderWidth: 1,
    borderColor: "#94a3b8",
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10
  },
  secondaryActionText: {
    color: "#1e293b",
    fontWeight: "700",
    fontSize: 12
  },
  deleteAction: {
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10
  },
  deleteActionText: {
    color: "#991b1b",
    fontWeight: "700",
    fontSize: 12
  },
  emptyCard: {
    backgroundColor: "#ffffff",
    borderColor: "#dbe3ee",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12
  },
  emptyText: {
    color: "#64748b"
  }
});
