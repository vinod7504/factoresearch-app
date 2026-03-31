import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const EMI_PRESETS = [
  { id: "saved-default", label: "Saved Default", principal: "500000", annualRate: "8.5", tenureYears: "5" },
  { id: "home-loan", label: "Home Loan", principal: "5000000", annualRate: "8.4", tenureYears: "20" },
  { id: "car-loan", label: "Car Loan", principal: "900000", annualRate: "9.2", tenureYears: "7" }
];

const calculateEmi = (principal, annualRate, tenureYears) => {
  const p = Number(principal);
  const monthlyRate = Number(annualRate) / 12 / 100;
  const months = Number(tenureYears) * 12;

  if (!p || !monthlyRate || !months) {
    return null;
  }

  const emi = (p * monthlyRate * (1 + monthlyRate) ** months) / ((1 + monthlyRate) ** months - 1);
  const totalPayment = emi * months;
  const totalInterest = totalPayment - p;

  return {
    emi,
    totalPayment,
    totalInterest
  };
};

const currency = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }
  return `INR ${value.toLocaleString(undefined, {
    maximumFractionDigits: 2
  })}`;
};

export default function EmiCalculatorScreen() {
  const [principal, setPrincipal] = useState("500000");
  const [annualRate, setAnnualRate] = useState("8.5");
  const [tenureYears, setTenureYears] = useState("5");

  const applyPreset = (preset) => {
    setPrincipal(preset.principal);
    setAnnualRate(preset.annualRate);
    setTenureYears(preset.tenureYears);
  };

  const result = useMemo(() => calculateEmi(principal, annualRate, tenureYears), [principal, annualRate, tenureYears]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>EMI Calculator</Text>
      <Text style={styles.subTitle}>Includes your saved previous-commit sample data for quick testing.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Sample Data Presets</Text>
        <View style={styles.presetRow}>
          {EMI_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset.id}
              style={styles.presetChip}
              onPress={() => applyPreset(preset)}
              accessibilityRole="button"
              accessibilityLabel={`Use ${preset.label} preset`}
            >
              <Text style={styles.presetChipText}>{preset.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Loan Amount</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={principal}
          onChangeText={setPrincipal}
          placeholder="500000"
          accessibilityLabel="Loan amount"
        />

        <Text style={styles.label}>Annual Interest (%)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={annualRate}
          onChangeText={setAnnualRate}
          placeholder="8.5"
          accessibilityLabel="Annual interest percentage"
        />

        <Text style={styles.label}>Tenure (Years)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={tenureYears}
          onChangeText={setTenureYears}
          placeholder="5"
          accessibilityLabel="Loan tenure in years"
        />
      </View>

      <View style={styles.resultCard}>
        <Text style={styles.resultTitle}>Results</Text>
        <Text style={styles.resultLine}>Monthly EMI: {result ? currency(result.emi) : "-"}</Text>
        <Text style={styles.resultLine}>Total Payment: {result ? currency(result.totalPayment) : "-"}</Text>
        <Text style={styles.resultLine}>Total Interest: {result ? currency(result.totalInterest) : "-"}</Text>
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
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 12
  },
  subTitle: {
    color: "#334155",
    marginBottom: 12
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dbe3ee",
    padding: 12,
    marginBottom: 12
  },
  label: {
    color: "#334155",
    marginBottom: 6,
    fontWeight: "600"
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#dbe3ee"
  },
  presetRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap"
  },
  presetChip: {
    borderWidth: 1,
    borderColor: "#93c5fd",
    backgroundColor: "#eff6ff",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 44,
    justifyContent: "center"
  },
  presetChipText: {
    color: "#1e3a8a",
    fontWeight: "700",
    fontSize: 12
  },
  resultCard: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    padding: 14
  },
  resultTitle: {
    color: "#f8fafc",
    fontWeight: "700",
    fontSize: 18,
    marginBottom: 8
  },
  resultLine: {
    color: "#e2e8f0",
    marginBottom: 6,
    fontSize: 15
  }
});
