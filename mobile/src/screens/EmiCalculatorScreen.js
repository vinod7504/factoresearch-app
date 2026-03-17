import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

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
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 2
  });
};

export default function EmiCalculatorScreen() {
  const [principal, setPrincipal] = useState("500000");
  const [annualRate, setAnnualRate] = useState("8.5");
  const [tenureYears, setTenureYears] = useState("5");

  const result = useMemo(() => calculateEmi(principal, annualRate, tenureYears), [principal, annualRate, tenureYears]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>EMI Calculator</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Loan Amount</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={principal}
          onChangeText={setPrincipal}
          placeholder="500000"
        />

        <Text style={styles.label}>Annual Interest (%)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={annualRate}
          onChangeText={setAnnualRate}
          placeholder="8.5"
        />

        <Text style={styles.label}>Tenure (Years)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={tenureYears}
          onChangeText={setTenureYears}
          placeholder="5"
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
