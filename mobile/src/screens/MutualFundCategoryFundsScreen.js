import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { getMutualFundCategoryById } from "../constants/mutualFunds";

const FundCard = ({ item }) => {
  return (
    <View style={styles.fundCard}>
      <Text style={styles.fundName}>{item.name}</Text>
      <Text style={styles.fundMeta}>{item.amc}</Text>
      <View style={styles.chipRow}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{item.style}</Text>
        </View>
        <View style={styles.chip}>
          <Text style={styles.chipText}>Risk: {item.risk}</Text>
        </View>
        <View style={styles.chip}>
          <Text style={styles.chipText}>Min SIP: {item.minSip}</Text>
        </View>
      </View>
    </View>
  );
};

export default function MutualFundCategoryFundsScreen({ route }) {
  const categoryId = route?.params?.categoryId;

  const category = useMemo(() => getMutualFundCategoryById(categoryId), [categoryId]);

  if (!category) {
    return (
      <View style={styles.notFoundWrap}>
        <Text style={styles.notFoundTitle}>Category not found</Text>
        <Text style={styles.notFoundSub}>Please go back and select a valid mutual fund category.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{category.title}</Text>
      <Text style={styles.subtitle}>{category.subtitle}</Text>

      {(category.funds || []).map((item) => (
        <FundCard key={`${category.id}-${item.name}`} item={item} />
      ))}

      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerText}>
          Note: This is an informational shortlist. Review fund factsheets and consult a registered advisor before
          investing.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef4ff"
  },
  content: {
    padding: 14,
    paddingBottom: 24
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a"
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 12,
    color: "#475569",
    fontSize: 13
  },
  fundCard: {
    backgroundColor: "#ffffff",
    borderColor: "#d5e3ff",
    borderWidth: 1,
    borderRadius: 13,
    padding: 12,
    marginBottom: 10
  },
  fundName: {
    color: "#0f172a",
    fontWeight: "800",
    fontSize: 15
  },
  fundMeta: {
    color: "#64748b",
    marginTop: 2,
    fontSize: 12
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    backgroundColor: "#eff6ff",
    paddingVertical: 6,
    paddingHorizontal: 10
  },
  chipText: {
    color: "#1e3a8a",
    fontWeight: "700",
    fontSize: 11
  },
  disclaimerBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fde68a",
    backgroundColor: "#fffbeb",
    padding: 10,
    marginTop: 4
  },
  disclaimerText: {
    color: "#92400e",
    fontSize: 12,
    fontWeight: "600"
  },
  notFoundWrap: {
    flex: 1,
    backgroundColor: "#eef4ff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20
  },
  notFoundTitle: {
    color: "#0f172a",
    fontSize: 20,
    fontWeight: "800"
  },
  notFoundSub: {
    marginTop: 6,
    color: "#64748b",
    textAlign: "center"
  }
});
