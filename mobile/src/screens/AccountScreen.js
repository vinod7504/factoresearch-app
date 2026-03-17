import React, { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../context/AuthContext";

const FieldRow = ({ label, value }) => {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || "-"}</Text>
    </View>
  );
};

export default function AccountScreen() {
  const { user, fetchMe, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

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
    <View style={styles.container}>
      <Text style={styles.title}>Account Details</Text>
      <View style={styles.card}>
        <FieldRow label="Username" value={user?.username} />
        <FieldRow label="Email" value={user?.email} />
        <FieldRow label="Phone" value={user?.phone} />
        <FieldRow label="Role" value={user?.role || "user"} />
        <FieldRow label="Watchlist Symbols" value={String(user?.watchlist?.length || 0)} />
        <FieldRow label="Password" value={user?.password || "********"} />
        <FieldRow
          label="Joined"
          value={user?.createdAt ? new Date(user.createdAt).toLocaleString() : "-"}
        />
      </View>

      <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh} disabled={refreshing}>
        {refreshing ? <ActivityIndicator color="#0f766e" /> : <Text style={styles.refreshText}>Refresh Profile</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f6fa",
    padding: 16
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    color: "#0f172a"
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dbe3ee",
    padding: 12
  },
  row: {
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 10
  },
  label: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 2
  },
  value: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a"
  },
  refreshBtn: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#0f766e",
    alignItems: "center"
  },
  refreshText: {
    color: "#0f766e",
    fontWeight: "700"
  },
  logoutBtn: {
    marginTop: 10,
    backgroundColor: "#fee2e2",
    borderColor: "#fecaca",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    alignItems: "center"
  },
  logoutText: {
    color: "#991b1b",
    fontWeight: "700"
  }
});
