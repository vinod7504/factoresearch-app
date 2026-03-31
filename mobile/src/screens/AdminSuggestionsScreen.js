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
const readableDate = (value) => (value ? new Date(value).toLocaleString() : "-");
const extractErrorMessage = (error, fallback) => {
  const payload = error?.response?.data;
  if (typeof payload === "string" && payload.trim()) {
    return payload.trim();
  }
  if (payload?.message) {
    return payload.message;
  }
  if (error?.response?.status === 429) {
    return "Too many requests. Please wait a minute and try again.";
  }
  return error?.message || fallback;
};

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

const AdminKycRow = ({ item, onReview, reviewingId }) => {
  const isBusy = reviewingId === item.userId;

  return (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemSymbol}>{item.fullName || item.username}</Text>
        <Text
          style={[
            styles.kycStatus,
            item.status === "Verified"
              ? styles.kycStatusVerified
              : item.status === "Rejected"
                ? styles.kycStatusRejected
                : item.status === "Submitted"
                  ? styles.kycStatusSubmitted
                  : styles.kycStatusInProgress
          ]}
        >
          {item.status}
        </Text>
      </View>

      <Text style={styles.itemMeta}>Email: {item.email}</Text>
      <Text style={styles.itemMeta}>Phone: {item.phone}</Text>
      <Text style={styles.itemMeta}>PAN: {item.pan || "-"}</Text>
      <Text style={styles.itemMeta}>DOB: {item.dob || "-"}</Text>
      <Text style={styles.itemMeta}>Location: {[item.city, item.state].filter(Boolean).join(", ") || "-"}</Text>
      <Text style={styles.itemMeta}>Last updated: {readableDate(item.updatedAt)}</Text>
      {item.reviewNote ? <Text style={styles.kycNote}>Admin note: {item.reviewNote}</Text> : null}

      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.verifyAction}
          onPress={() => onReview(item, "Verified")}
          disabled={isBusy}
          accessibilityRole="button"
          accessibilityLabel={`Verify KYC for ${item.fullName || item.username}`}
        >
          {isBusy ? <ActivityIndicator color="#065f46" size="small" /> : <Text style={styles.verifyActionText}>Verify</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteAction}
          onPress={() => onReview(item, "Rejected")}
          disabled={isBusy}
          accessibilityRole="button"
          accessibilityLabel={`Reject KYC for ${item.fullName || item.username}`}
        >
          <Text style={styles.deleteActionText}>Reject</Text>
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
  const [reviewingKycId, setReviewingKycId] = useState(null);
  const [items, setItems] = useState([]);
  const [kycRequests, setKycRequests] = useState([]);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [lastBroadcast, setLastBroadcast] = useState(null);

  const [form, setForm] = useState({
    symbol: "",
    recommendation: "BUY",
    targetPrice: "",
    stopLoss: "",
    note: ""
  });
  const [broadcastForm, setBroadcastForm] = useState({
    title: "FactoResearch",
    body: "Hello, Welcome to FactoResearch..... waiting for the roll Today is holiday"
  });

  const canSubmit = useMemo(() => {
    return form.symbol.trim() && form.note.trim();
  }, [form.symbol, form.note]);

  const canSendBroadcast = useMemo(() => {
    return broadcastForm.body.trim().length > 0;
  }, [broadcastForm.body]);

  const loadAdminData = useCallback(async () => {
    const [suggestionsRes, kycRes] = await Promise.all([
      api.get("/admin/suggestions"),
      api.get("/admin/kyc")
    ]);
    setItems(suggestionsRes?.data?.suggestions || []);
    setKycRequests(kycRes?.data?.requests || []);
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
          const [suggestionsRes, kycRes] = await Promise.all([
            api.get("/admin/suggestions"),
            api.get("/admin/kyc")
          ]);
          if (mounted) {
            setItems(suggestionsRes?.data?.suggestions || []);
            setKycRequests(kycRes?.data?.requests || []);
          }
        } catch (error) {
          const message = extractErrorMessage(error, "Unable to fetch admin panel data");
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
      await loadAdminData();
    } catch (error) {
      const message = extractErrorMessage(error, "Unable to refresh");
      Alert.alert("Error", message);
    } finally {
      setRefreshing(false);
    }
  };

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateBroadcastField = (key, value) => {
    setBroadcastForm((prev) => ({ ...prev, [key]: value }));
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

      await loadAdminData();
    } catch (error) {
      const message = extractErrorMessage(error, "Unable to create suggestion");
      Alert.alert("Error", message);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteSuggestion = async (id) => {
    try {
      await api.delete(`/admin/suggestions/${id}`);
      await loadAdminData();
    } catch (error) {
      const message = extractErrorMessage(error, "Unable to delete suggestion");
      Alert.alert("Error", message);
    }
  };

  const toggleSuggestion = async (item) => {
    try {
      await api.patch(`/admin/suggestions/${item.id}`, {
        active: !item.active
      });
      await loadAdminData();
    } catch (error) {
      const message = extractErrorMessage(error, "Unable to update suggestion");
      Alert.alert("Error", message);
    }
  };

  const reviewKyc = async (item, nextStatus) => {
    const actionText = nextStatus === "Verified" ? "verify" : "reject";

    Alert.alert("Confirm Action", `Are you sure you want to ${actionText} KYC for ${item.fullName || item.username}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: nextStatus,
        style: nextStatus === "Rejected" ? "destructive" : "default",
        onPress: async () => {
          try {
            setReviewingKycId(item.userId);
            await api.patch(`/admin/kyc/${item.userId}`, {
              status: nextStatus
            });
            await loadAdminData();
          } catch (error) {
            const message = extractErrorMessage(error, `Unable to ${actionText} KYC`);
            Alert.alert("Error", message);
          } finally {
            setReviewingKycId(null);
          }
        }
      }
    ]);
  };

  const performBroadcastSend = async () => {
    try {
      setSendingBroadcast(true);
      const nowIso = new Date().toISOString();
      const payload = {
        title: broadcastForm.title.trim() || "FactoResearch",
        body: broadcastForm.body.trim(),
        data: {
          type: "admin_broadcast",
          sentBy: user?.email || "admin",
          sentAt: nowIso
        }
      };

      const { data } = await api.post("/admin/notifications/broadcast", payload);
      const requestedCount = Number(data?.requestedCount || 0);
      const deliveredTicketCount = Number(data?.deliveredTicketCount || 0);
      const failedTicketCount = Number(data?.failedTicketCount || 0);
      const firstFailure = Array.isArray(data?.failedTickets) && data.failedTickets.length ? data.failedTickets[0] : null;

      setLastBroadcast({
        at: nowIso,
        requestedCount,
        deliveredTicketCount,
        failedTicketCount
      });

      Alert.alert(
        failedTicketCount ? "Broadcast Sent With Warnings" : "Broadcast Sent",
        requestedCount
          ? failedTicketCount
            ? `Sent to ${requestedCount} device(s). Expo created ${deliveredTicketCount} ticket(s), ${failedTicketCount} failed. ${firstFailure?.code ? `Code: ${firstFailure.code}. ` : ""}${firstFailure?.message || ""}`
            : `Message sent to ${requestedCount} device(s). Expo accepted ${deliveredTicketCount} ticket(s).`
          : "No registered user devices found yet. Ask users to open app and allow notifications first."
      );
    } catch (error) {
      const message = extractErrorMessage(error, "Unable to send broadcast notification");
      Alert.alert("Error", message);
    } finally {
      setSendingBroadcast(false);
    }
  };

  const sendBroadcast = async () => {
    if (!canSendBroadcast) {
      Alert.alert("Validation", "Message body is required");
      return;
    }

    Alert.alert("Send Broadcast", "Send this message to all users who have enabled notifications?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Send",
        onPress: () => {
          performBroadcastSend().catch(() => {});
        }
      }
    ]);
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
      <Text style={styles.panelSubtext}>Manage stock recommendations and verify incoming KYC submissions from users.</Text>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Broadcast Message</Text>
        <Text style={styles.helperText}>This sends a push notification to all users who opened the app and allowed notifications.</Text>

        <TextInput
          style={styles.input}
          placeholder="Notification Title"
          value={broadcastForm.title}
          onChangeText={(value) => updateBroadcastField("title", value)}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Message body"
          value={broadcastForm.body}
          multiline
          onChangeText={(value) => updateBroadcastField("body", value)}
        />

        <TouchableOpacity style={styles.broadcastButton} onPress={sendBroadcast} disabled={sendingBroadcast}>
          {sendingBroadcast ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitText}>Send To All Users</Text>}
        </TouchableOpacity>

        {lastBroadcast ? (
          <Text style={styles.lastBroadcastText}>
            Last sent: {readableDate(lastBroadcast.at)} | Requested: {lastBroadcast.requestedCount} | Tickets: {lastBroadcast.deliveredTicketCount} | Failed: {lastBroadcast.failedTicketCount || 0}
          </Text>
        ) : null}
      </View>

      <Text style={styles.sectionTitle}>KYC Verification Queue</Text>
      {kycRequests.length ? (
        kycRequests.map((item) => (
          <AdminKycRow key={item.userId} item={item} onReview={reviewKyc} reviewingId={reviewingKycId} />
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No KYC submissions available yet.</Text>
        </View>
      )}

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
  panelSubtext: {
    color: "#334155",
    marginBottom: 12
  },
  helperText: {
    color: "#475569",
    marginBottom: 10,
    lineHeight: 18,
    fontSize: 12
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
  broadcastButton: {
    backgroundColor: "#065f46",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center"
  },
  submitText: {
    color: "#ffffff",
    fontWeight: "700"
  },
  lastBroadcastText: {
    marginTop: 10,
    color: "#334155",
    fontSize: 12,
    fontWeight: "600"
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
  kycStatus: {
    fontWeight: "800",
    fontSize: 12
  },
  kycStatusInProgress: {
    color: "#1d4ed8"
  },
  kycStatusSubmitted: {
    color: "#92400e"
  },
  kycStatusVerified: {
    color: "#065f46"
  },
  kycStatusRejected: {
    color: "#991b1b"
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
  verifyAction: {
    borderWidth: 1,
    borderColor: "#86efac",
    backgroundColor: "#dcfce7",
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center"
  },
  verifyActionText: {
    color: "#065f46",
    fontWeight: "700",
    fontSize: 12
  },
  secondaryAction: {
    borderWidth: 1,
    borderColor: "#94a3b8",
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center"
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
    paddingHorizontal: 10,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center"
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
  },
  kycNote: {
    marginTop: 4,
    color: "#7f1d1d",
    fontSize: 12,
    fontWeight: "700"
  }
});
