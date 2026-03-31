import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const SIP_PRESETS = [
  { id: "saved-default", label: "Saved Default", monthlyInvestment: "10000", annualReturn: "12", years: "10" },
  { id: "steady", label: "Steady SIP", monthlyInvestment: "5000", annualReturn: "10", years: "12" },
  { id: "growth", label: "Growth SIP", monthlyInvestment: "15000", annualReturn: "14", years: "15" }
];

const calculateSipFutureValue = (monthlyInvestment, annualReturn, years) => {
  const p = Number(monthlyInvestment);
  const r = Number(annualReturn) / 12 / 100;
  const n = Number(years) * 12;

  if (!p || !r || !n) {
    return null;
  }

  const maturityValue = p * (((1 + r) ** n - 1) / r) * (1 + r);
  const investedAmount = p * n;
  const estimatedReturns = maturityValue - investedAmount;

  return {
    maturityValue,
    investedAmount,
    estimatedReturns
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

export default function MutualFundCalculatorScreen() {
  const [monthlyInvestment, setMonthlyInvestment] = useState("10000");
  const [annualReturn, setAnnualReturn] = useState("12");
  const [years, setYears] = useState("10");

  const applyPreset = (preset) => {
    setMonthlyInvestment(preset.monthlyInvestment);
    setAnnualReturn(preset.annualReturn);
    setYears(preset.years);
  };

  const result = useMemo(
    () => calculateSipFutureValue(monthlyInvestment, annualReturn, years),
    [monthlyInvestment, annualReturn, years]
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Mutual Fund SIP Calculator</Text>
      <Text style={styles.subTitle}>Includes your saved previous-commit sample data for quick testing.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Sample Data Presets</Text>
        <View style={styles.presetRow}>
          {SIP_PRESETS.map((preset) => (
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
        <Text style={styles.label}>Monthly Investment</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={monthlyInvestment}
          onChangeText={setMonthlyInvestment}
          placeholder="10000"
          accessibilityLabel="Monthly investment amount"
        />

        <Text style={styles.label}>Expected Annual Return (%)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={annualReturn}
          onChangeText={setAnnualReturn}
          placeholder="12"
          accessibilityLabel="Expected annual return percentage"
        />

        <Text style={styles.label}>Investment Period (Years)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={years}
          onChangeText={setYears}
          placeholder="10"
          accessibilityLabel="Investment period in years"
        />
      </View>

      <View style={styles.resultCard}>
        <Text style={styles.resultTitle}>Results</Text>
        <Text style={styles.resultLine}>Invested Amount: {result ? currency(result.investedAmount) : "-"}</Text>
        <Text style={styles.resultLine}>Estimated Returns: {result ? currency(result.estimatedReturns) : "-"}</Text>
        <Text style={styles.resultLine}>Maturity Value: {result ? currency(result.maturityValue) : "-"}</Text>
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
    fontSize: 24,
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
