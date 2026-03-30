import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAppData } from "../context/AppDataContext";

export default function SubscriptionPlanScreen() {
  const { planCatalog, selectedPlan, subscription, selectSubscription } = useAppData();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.title}>Subscription Plan</Text>
        <Text style={styles.subtitle}>Choose the service tier that matches your research and monitoring needs.</Text>
        <Text style={styles.heroMeta}>Active plan: {selectedPlan.name}</Text>
      </View>

      {planCatalog.map((plan) => {
        const active = plan.id === subscription.planId;

        return (
          <View key={plan.id} style={[styles.planCard, active ? styles.planCardActive : null]}>
            <View style={styles.planHeader}>
              <View>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planBilling}>{plan.price} | {plan.billing}</Text>
              </View>
              {active ? (
                <View style={styles.activePill}>
                  <Text style={styles.activePillText}>Current</Text>
                </View>
              ) : null}
            </View>

            {plan.features.map((feature) => (
              <Text key={feature} style={styles.featureText}>• {feature}</Text>
            ))}

            <TouchableOpacity
              style={[styles.actionButton, active ? styles.actionButtonMuted : null]}
              onPress={() => selectSubscription(plan.id)}
            >
              <Text style={[styles.actionButtonText, active ? styles.actionButtonTextMuted : null]}>
                {active ? "Already Selected" : "Select Plan"}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Subscription Status</Text>
        <Text style={styles.infoText}>Status: {subscription.status}</Text>
        <Text style={styles.infoText}>Advisor desk: {subscription.advisorName}</Text>
        <Text style={styles.infoText}>
          Renewal: {subscription.renewalDate ? new Date(subscription.renewalDate).toLocaleDateString() : "Not scheduled"}
        </Text>
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
  planCard: { backgroundColor: "#ffffff", borderRadius: 16, borderWidth: 1, borderColor: "#d8e5ff", padding: 14, marginBottom: 12 },
  planCardActive: { borderColor: "#1d4ed8", backgroundColor: "#f8fbff" },
  planHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  planName: { color: "#0f172a", fontSize: 20, fontWeight: "800" },
  planBilling: { color: "#475569", marginTop: 4 },
  activePill: { backgroundColor: "#dbeafe", borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10 },
  activePillText: { color: "#1d4ed8", fontWeight: "800", fontSize: 12 },
  featureText: { color: "#334155", lineHeight: 22, marginBottom: 2 },
  actionButton: { marginTop: 12, backgroundColor: "#1d4ed8", borderRadius: 12, alignItems: "center", paddingVertical: 12 },
  actionButtonMuted: { backgroundColor: "#eff6ff" },
  actionButtonText: { color: "#ffffff", fontWeight: "800" },
  actionButtonTextMuted: { color: "#1d4ed8" },
  infoCard: { backgroundColor: "#ffffff", borderRadius: 16, borderWidth: 1, borderColor: "#d8e5ff", padding: 14 },
  infoTitle: { color: "#0f172a", fontSize: 18, fontWeight: "800", marginBottom: 8 },
  infoText: { color: "#334155", marginBottom: 6 }
});
