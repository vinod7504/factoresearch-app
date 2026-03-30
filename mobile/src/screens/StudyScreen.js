import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function StudyScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="lock-closed" size={34} color="#1d4ed8" />
        </View>
        <Text style={styles.title}>Study</Text>
        <Text style={styles.subtitle}>This section is locked. Upgrade for more features and full access to premium study content.</Text>
        <TouchableOpacity style={styles.upgradeButton} activeOpacity={0.85}>
          <Text style={styles.upgradeText}>Upgrade</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef4ff",
    justifyContent: "center",
    padding: 20
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d8e5ff",
    padding: 24,
    alignItems: "center"
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a"
  },
  subtitle: {
    marginTop: 10,
    color: "#475569",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center"
  },
  upgradeButton: {
    marginTop: 24,
    minWidth: 180,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: "#1d4ed8",
    alignItems: "center",
    justifyContent: "center"
  },
  upgradeText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center"
  }
});
