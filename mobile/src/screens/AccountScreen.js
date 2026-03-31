import React, { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useAppData } from "../context/AppDataContext";

const FieldRow = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value || "-"}</Text>
  </View>
);

export default function AccountScreen() {
  const { user, fetchMe, logout } = useAuth();
  const { profile, riskProfile, selectedPlan, alerts, portfolio } = useAppData();
  const [refreshing, setRefreshing] = useState(false);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout }
    ]);
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchMe();
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to refresh account";
      Alert.alert("Error", message);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Account Overview</Text>
      <View style={styles.card}>
        <FieldRow label="Username" value={user?.username} />
        <FieldRow label="Email" value={user?.email} />
        <FieldRow label="Phone" value={user?.phone} />
        <FieldRow label="Role" value={user?.role || "user"} />
        <FieldRow label="KYC Status" value={profile.kycStatus} />
        <FieldRow label="Risk Profile" value={riskProfile.level} />
        <FieldRow label="Subscription" value={selectedPlan.name} />
        <FieldRow label="Watchlist Symbols" value={String(user?.watchlist?.length || 0)} />
        <FieldRow label="Portfolio Holdings" value={String(portfolio.length)} />
        <FieldRow label="Alert Rules" value={String(alerts.length)} />
        <FieldRow label="Joined" value={user?.createdAt ? new Date(user.createdAt).toLocaleString() : "-"} />
      </View>

      <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh} disabled={refreshing}>
        {refreshing ? <ActivityIndicator color="#0f766e" /> : <Text style={styles.refreshText}>Refresh Profile</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f6fa" },
  content: { padding: 16, paddingBottom: 30 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 12, color: "#0f172a" },
  card: { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#dbe3ee", padding: 12 },
  row: { borderBottomWidth: 1, borderBottomColor: "#f1f5f9", paddingVertical: 10 },
  label: { fontSize: 12, color: "#64748b", marginBottom: 2 },
  value: { fontSize: 15, fontWeight: "600", color: "#0f172a" },
  refreshBtn: { marginTop: 12, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "#0f766e", alignItems: "center" },
  refreshText: { color: "#0f766e", fontWeight: "700" },
  logoutBtn: { marginTop: 10, backgroundColor: "#fee2e2", borderColor: "#fecaca", borderWidth: 1, borderRadius: 10, padding: 12, alignItems: "center" },
  logoutText: { color: "#991b1b", fontWeight: "700" }
});
