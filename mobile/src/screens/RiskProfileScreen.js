import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAppData } from "../context/AppDataContext";

const OptionGroup = ({ title, options, value, onChange }) => (
  <View style={styles.card}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.optionRow}>
      {options.map((item) => (
        <TouchableOpacity
          key={item}
          style={[styles.optionChip, value === item ? styles.optionChipActive : null]}
          onPress={() => onChange(item)}
        >
          <Text style={[styles.optionText, value === item ? styles.optionTextActive : null]}>{item}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

export default function RiskProfileScreen() {
  const { riskProfile, saveRiskProfile } = useAppData();
  const [form, setForm] = useState({
    horizon: riskProfile.horizon,
    objective: riskProfile.objective,
    experience: riskProfile.experience,
    liquidityNeed: riskProfile.liquidityNeed
  });

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    saveRiskProfile(form);
    Alert.alert("Risk profile saved", "Your investor suitability profile has been updated.");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.title}>Risk Profiling</Text>
        <Text style={styles.subtitle}>Assess suitability before acting on recommendations.</Text>
        <Text style={styles.heroMeta}>Current profile: {riskProfile.level} | Score: {riskProfile.score}</Text>
      </View>

      <OptionGroup
        title="Investment Horizon"
        options={["Short term", "Medium term", "Long term"]}
        value={form.horizon}
        onChange={(value) => updateField("horizon", value)}
      />
      <OptionGroup
        title="Primary Objective"
        options={["Capital preservation", "Balanced growth", "Aggressive growth"]}
        value={form.objective}
        onChange={(value) => updateField("objective", value)}
      />
      <OptionGroup
        title="Market Experience"
        options={["Beginner", "Intermediate", "Advanced"]}
        value={form.experience}
        onChange={(value) => updateField("experience", value)}
      />
      <OptionGroup
        title="Liquidity Need"
        options={["High", "Moderate", "Low"]}
        value={form.liquidityNeed}
        onChange={(value) => updateField("liquidityNeed", value)}
      />

      <View style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>Current Summary</Text>
        <Text style={styles.summaryLine}>Risk Band: {riskProfile.level}</Text>
        <Text style={styles.summaryLine}>Objective: {riskProfile.objective}</Text>
        <Text style={styles.summaryLine}>Updated: {riskProfile.updatedAt ? new Date(riskProfile.updatedAt).toLocaleString() : "Not yet"}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
          <Text style={styles.primaryButtonText}>Save Risk Profile</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#eff5ff" },
  content: { padding: 16, paddingBottom: 28 },
  heroCard: { backgroundColor: "#0f3b8f", borderRadius: 18, padding: 16, marginBottom: 12 },
  title: { color: "#ffffff", fontSize: 26, fontWeight: "800" },
  subtitle: { color: "#dbeafe", marginTop: 6 },
  heroMeta: { color: "#bfdbfe", marginTop: 10, fontWeight: "700" },
  card: { backgroundColor: "#ffffff", borderRadius: 16, borderWidth: 1, borderColor: "#d8e5ff", padding: 14, marginBottom: 12 },
  summaryCard: { backgroundColor: "#ffffff", borderRadius: 16, borderWidth: 1, borderColor: "#d8e5ff", padding: 14 },
  sectionTitle: { color: "#0f172a", fontSize: 18, fontWeight: "800", marginBottom: 10 },
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionChip: { borderRadius: 999, borderWidth: 1, borderColor: "#cbd5e1", backgroundColor: "#f8fafc", paddingVertical: 8, paddingHorizontal: 12 },
  optionChipActive: { backgroundColor: "#1d4ed8", borderColor: "#1d4ed8" },
  optionText: { color: "#334155", fontWeight: "700", fontSize: 12 },
  optionTextActive: { color: "#ffffff" },
  summaryLine: { color: "#334155", marginBottom: 6, lineHeight: 20 },
  primaryButton: { borderRadius: 12, backgroundColor: "#1d4ed8", alignItems: "center", paddingVertical: 12, marginTop: 10 },
  primaryButtonText: { color: "#ffffff", fontWeight: "800" }
});
