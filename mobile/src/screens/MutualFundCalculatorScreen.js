import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

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
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 2
  });
};

export default function MutualFundCalculatorScreen() {
  const [monthlyInvestment, setMonthlyInvestment] = useState("10000");
  const [annualReturn, setAnnualReturn] = useState("12");
  const [years, setYears] = useState("10");

  const result = useMemo(
    () => calculateSipFutureValue(monthlyInvestment, annualReturn, years),
    [monthlyInvestment, annualReturn, years]
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Mutual Fund SIP Calculator</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Monthly Investment</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={monthlyInvestment}
          onChangeText={setMonthlyInvestment}
          placeholder="10000"
        />

        <Text style={styles.label}>Expected Annual Return (%)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={annualReturn}
          onChangeText={setAnnualReturn}
          placeholder="12"
        />

        <Text style={styles.label}>Investment Period (Years)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={years}
          onChangeText={setYears}
          placeholder="10"
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
