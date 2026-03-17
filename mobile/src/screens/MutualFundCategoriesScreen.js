import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MUTUAL_FUND_CATEGORIES } from "../constants/mutualFunds";

const CategoryCard = ({ item, onPress }) => {
  return (
    <TouchableOpacity style={styles.categoryCard} onPress={onPress} activeOpacity={0.86}>
      <View style={styles.iconWrap}>
        <Ionicons name={item.icon || "pie-chart-outline"} size={18} color="#1d4ed8" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.categoryTitle}>{item.title}</Text>
        <Text style={styles.categorySubtitle}>{item.subtitle}</Text>
        <Text style={styles.categoryMeta}>{item.funds?.length || 0} funds</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#64748b" />
    </TouchableOpacity>
  );
};

export default function MutualFundCategoriesScreen({ navigation }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Mutual Funds</Text>
      <Text style={styles.subtitle}>Choose a strategy bucket to explore funds in that category.</Text>

      {MUTUAL_FUND_CATEGORIES.map((item) => (
        <CategoryCard
          key={item.id}
          item={item}
          onPress={() => navigation.navigate("MutualFundCategoryFunds", { categoryId: item.id, title: item.title })}
        />
      ))}
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
    fontSize: 25,
    fontWeight: "800",
    color: "#0f172a"
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 12,
    color: "#475569",
    fontSize: 13
  },
  categoryCard: {
    backgroundColor: "#ffffff",
    borderColor: "#d5e3ff",
    borderWidth: 1,
    borderRadius: 13,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center"
  },
  categoryTitle: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "800"
  },
  categorySubtitle: {
    marginTop: 2,
    color: "#64748b",
    fontSize: 12
  },
  categoryMeta: {
    marginTop: 4,
    color: "#1d4ed8",
    fontSize: 11,
    fontWeight: "700"
  }
});
