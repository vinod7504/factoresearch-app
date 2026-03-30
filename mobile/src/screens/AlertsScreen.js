import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAppData } from "../context/AppDataContext";

const channels = ["In-app", "Email", "WhatsApp"];

export default function AlertsScreen() {
  const { alerts, addAlertRule, removeAlertRule, toggleAlertRule } = useAppData();
  const [form, setForm] = useState({
    title: "",
    trigger: "",
    channel: "In-app"
  });

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreate = () => {
    if (!form.title.trim() || !form.trigger.trim()) {
      Alert.alert("Validation", "Alert title and trigger are required.");
      return;
    }

    addAlertRule({
      title: form.title.trim(),
      trigger: form.trigger.trim(),
      channel: form.channel
    });

    setForm({
      title: "",
      trigger: "",
      channel: "In-app"
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.title}>Alerts</Text>
        <Text style={styles.subtitle}>Stay updated on recommendations, price triggers, and service reminders.</Text>
        <Text style={styles.heroMeta}>Active rules: {alerts.filter((item) => item.status === "Enabled").length}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Create Alert Rule</Text>
        <TextInput
          style={styles.input}
          value={form.title}
          onChangeText={(value) => updateField("title", value)}
          placeholder="Alert title"
          placeholderTextColor="#94a3b8"
        />
        <TextInput
          style={styles.input}
          value={form.trigger}
          onChangeText={(value) => updateField("trigger", value)}
          placeholder="Trigger condition"
          placeholderTextColor="#94a3b8"
        />

        <View style={styles.channelRow}>
          {channels.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.channelChip, form.channel === item ? styles.channelChipActive : null]}
              onPress={() => updateField("channel", item)}
            >
              <Text style={[styles.channelText, form.channel === item ? styles.channelTextActive : null]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleCreate}>
          <Text style={styles.primaryButtonText}>Add Alert</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Configured Alerts</Text>
        {alerts.map((item) => (
          <View key={item.id} style={styles.alertRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>{item.title}</Text>
              <Text style={styles.alertMeta}>{item.channel} | {item.trigger}</Text>
              <Text style={styles.alertMeta}>Status: {item.status}</Text>
            </View>
            <View style={styles.actionColumn}>
              <TouchableOpacity style={styles.smallButton} onPress={() => toggleAlertRule(item.id)}>
                <Text style={styles.smallButtonText}>{item.status === "Enabled" ? "Pause" : "Enable"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallDangerButton} onPress={() => removeAlertRule(item.id)}>
                <Text style={styles.smallDangerText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#eff5ff" },
  content: { padding: 16, paddingBottom: 28 },
  heroCard: { backgroundColor: "#0f3b8f", borderRadius: 18, padding: 16, marginBottom: 12 },
  title: { color: "#ffffff", fontSize: 26, fontWeight: "800" },
  subtitle: { color: "#dbeafe", marginTop: 6, lineHeight: 20 },
  heroMeta: { color: "#bfdbfe", marginTop: 10, fontWeight: "700" },
  card: { backgroundColor: "#ffffff", borderRadius: 16, borderWidth: 1, borderColor: "#d8e5ff", padding: 14, marginBottom: 12 },
  sectionTitle: { color: "#0f172a", fontSize: 18, fontWeight: "800", marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#d8e5ff", borderRadius: 12, backgroundColor: "#f8fbff", paddingHorizontal: 12, paddingVertical: 11, color: "#0f172a", marginBottom: 10 },
  channelRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  channelChip: { borderRadius: 999, borderWidth: 1, borderColor: "#cbd5e1", backgroundColor: "#f8fafc", paddingVertical: 8, paddingHorizontal: 12 },
  channelChipActive: { backgroundColor: "#1d4ed8", borderColor: "#1d4ed8" },
  channelText: { color: "#334155", fontWeight: "700", fontSize: 12 },
  channelTextActive: { color: "#ffffff" },
  primaryButton: { backgroundColor: "#1d4ed8", borderRadius: 12, alignItems: "center", paddingVertical: 12 },
  primaryButtonText: { color: "#ffffff", fontWeight: "800" },
  alertRow: { borderBottomWidth: 1, borderBottomColor: "#edf2ff", paddingVertical: 12, flexDirection: "row", gap: 10 },
  alertTitle: { color: "#0f172a", fontWeight: "800", marginBottom: 4 },
  alertMeta: { color: "#475569", fontSize: 12, lineHeight: 18 },
  actionColumn: { justifyContent: "center", gap: 8 },
  smallButton: { borderRadius: 10, backgroundColor: "#eff6ff", borderWidth: 1, borderColor: "#bfdbfe", paddingVertical: 8, paddingHorizontal: 10 },
  smallButtonText: { color: "#1d4ed8", fontWeight: "800", fontSize: 12 },
  smallDangerButton: { borderRadius: 10, backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca", paddingVertical: 8, paddingHorizontal: 10 },
  smallDangerText: { color: "#b91c1c", fontWeight: "800", fontSize: 12 }
});
