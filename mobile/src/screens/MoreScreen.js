import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { RATES_REFRESH_MS } from "../constants/realtime";

const hasNumber = (value) => typeof value === "number" && !Number.isNaN(value);

const inr = (value) => {
  if (!hasNumber(value)) {
    return "-";
  }
  return `₹${value.toLocaleString("en-IN")}`;
};

const ActionButton = ({ label, icon, onPress, danger = false }) => {
  return (
    <TouchableOpacity
      style={[styles.button, danger ? styles.dangerButton : null]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.buttonLeft}>
        <Ionicons
          name={icon}
          size={17}
          color={danger ? "#991b1b" : "#1d4ed8"}
          style={{ marginRight: 8 }}
        />
        <Text style={[styles.buttonText, danger ? styles.dangerButtonText : null]}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={danger ? "#991b1b" : "#94a3b8"} />
    </TouchableOpacity>
  );
};

const FieldRow = ({ label, value }) => {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value || "-"}</Text>
    </View>
  );
};

export default function MoreScreen({ navigation }) {
  const { logout, user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loadingRates, setLoadingRates] = useState(true);
  const [gstMode, setGstMode] = useState("withGst");
  const [selectedCity, setSelectedCity] = useState("Mumbai");
  const [metalRates, setMetalRates] = useState({
    isEstimated: false,
    units: {
      gold: "INR / 10g",
      silver: "INR / kg"
    },
    cities: []
  });

  const loadRates = useCallback(async () => {
    const { data } = await api.get("/market/dashboard");
    const nextRates = data?.metalRates || { cities: [] };
    setMetalRates(nextRates);

    const firstCity = nextRates?.cities?.[0]?.city;
    if (firstCity && !nextRates.cities.some((item) => item.city === selectedCity)) {
      setSelectedCity(firstCity);
    }
  }, [selectedCity]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const fetchData = async () => {
        try {
          setLoadingRates(true);
          await loadRates();
        } catch (error) {
          const message = error?.response?.data?.message || "Unable to load gold/silver rates";
          Alert.alert("Error", message);
        } finally {
          if (mounted) {
            setLoadingRates(false);
          }
        }
      };

      fetchData();

      return () => {
        mounted = false;
      };
    }, [loadRates])
  );

  useEffect(() => {
    const timer = setInterval(() => {
      loadRates().catch(() => {});
    }, RATES_REFRESH_MS);

    return () => clearInterval(timer);
  }, [loadRates]);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadRates();
    } catch (error) {
      const message = error?.response?.data?.message || "Unable to refresh rates";
      Alert.alert("Error", message);
    } finally {
      setRefreshing(false);
    }
  };

  const cityRates = useMemo(() => {
    const matched = metalRates?.cities?.find((item) => item.city === selectedCity);
    return matched || metalRates?.cities?.[0] || null;
  }, [metalRates, selectedCity]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>More Options</Text>
      <Text style={styles.subtitle}>
        Profile, rates, news, account, and support options. Rates auto-refresh every{" "}
        {Math.round(RATES_REFRESH_MS / 1000)}s.
      </Text>

      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{String(user?.username || "U").charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{user?.username || "User"}</Text>
          <Text style={styles.profileRole}>{String(user?.role || "user").toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <FieldRow label="Email" value={user?.email} />
        <FieldRow label="Phone" value={user?.phone} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Gold & Silver Rates</Text>
        {loadingRates ? (
          <View style={styles.rateLoader}>
            <ActivityIndicator color="#1d4ed8" />
          </View>
        ) : (
          <>
            <Text style={styles.metaLine}>
              City-wise rates • {metalRates?.units?.gold || "INR / 10g"} and {metalRates?.units?.silver || "INR / kg"}
            </Text>

            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleChip, gstMode === "withGst" ? styles.toggleChipActive : null]}
                onPress={() => setGstMode("withGst")}
              >
                <Text style={[styles.toggleText, gstMode === "withGst" ? styles.toggleTextActive : null]}>
                  With GST
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleChip, gstMode === "withoutGst" ? styles.toggleChipActive : null]}
                onPress={() => setGstMode("withoutGst")}
              >
                <Text style={[styles.toggleText, gstMode === "withoutGst" ? styles.toggleTextActive : null]}>
                  Without GST
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cityScroll}>
              <View style={styles.cityRow}>
                {(metalRates?.cities || []).map((item) => (
                  <TouchableOpacity
                    key={item.city}
                    style={[styles.cityChip, selectedCity === item.city ? styles.cityChipActive : null]}
                    onPress={() => setSelectedCity(item.city)}
                  >
                    <Text style={[styles.cityText, selectedCity === item.city ? styles.cityTextActive : null]}>
                      {item.city}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {cityRates ? (
              <View style={styles.rateGrid}>
                <View style={styles.rateBox}>
                  <Text style={styles.rateLabel}>Gold 24K</Text>
                  <Text style={styles.rateValue}>{inr(cityRates?.gold24k?.[gstMode])}</Text>
                  <Text style={styles.rateUnit}>{metalRates?.units?.gold || "INR / 10g"}</Text>
                </View>
                <View style={styles.rateBox}>
                  <Text style={styles.rateLabel}>Gold 22K</Text>
                  <Text style={styles.rateValue}>{inr(cityRates?.gold22k?.[gstMode])}</Text>
                  <Text style={styles.rateUnit}>{metalRates?.units?.gold || "INR / 10g"}</Text>
                </View>
                <View style={styles.rateBox}>
                  <Text style={styles.rateLabel}>Silver</Text>
                  <Text style={styles.rateValue}>{inr(cityRates?.silver?.[gstMode])}</Text>
                  <Text style={styles.rateUnit}>{metalRates?.units?.silver || "INR / kg"}</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.emptyText}>No rates available right now.</Text>
            )}

            {metalRates?.isEstimated ? (
              <Text style={styles.warningText}>Using estimated fallback values until live rates load.</Text>
            ) : null}
          </>
        )}
      </View>

      <ActionButton label="My Profile" icon="person-outline" onPress={() => navigation.navigate("AccountDetails")} />
      <ActionButton label="Market News" icon="newspaper-outline" onPress={() => navigation.navigate("MarketNews")} />
      <ActionButton label="Our Suggestions" icon="bulb-outline" onPress={() => navigation.navigate("Suggestions")} />
      <ActionButton label="Contact Us" icon="call-outline" onPress={() => navigation.navigate("ContactUs")} />
      <ActionButton label="About Us" icon="information-circle-outline" onPress={() => navigation.navigate("AboutUs")} />
      {user?.role === "admin" ? (
        <ActionButton
          label="Admin Panel"
          icon="shield-checkmark-outline"
          onPress={() => navigation.navigate("AdminSuggestions")}
        />
      ) : null}
      <ActionButton label="Logout" icon="log-out-outline" onPress={logout} danger />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef4ff"
  },
  content: {
    padding: 16,
    paddingBottom: 24
  },
  title: {
    fontSize: 25,
    fontWeight: "800",
    color: "#0f172a"
  },
  subtitle: {
    color: "#475569",
    marginTop: 4,
    marginBottom: 12
  },
  profileCard: {
    backgroundColor: "#ffffff",
    borderColor: "#d5e3ff",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#1d4ed8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10
  },
  avatarText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 20
  },
  profileName: {
    color: "#0f172a",
    fontWeight: "800",
    fontSize: 18
  },
  profileRole: {
    marginTop: 2,
    color: "#1d4ed8",
    fontWeight: "700",
    fontSize: 12
  },
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#d5e3ff",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10
  },
  sectionTitle: {
    color: "#0f172a",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 8
  },
  fieldRow: {
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#edf2ff"
  },
  fieldLabel: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "700"
  },
  fieldValue: {
    color: "#0f172a",
    fontWeight: "700",
    marginTop: 2
  },
  metaLine: {
    color: "#475569",
    marginBottom: 8,
    fontSize: 12
  },
  rateLoader: {
    paddingVertical: 12
  },
  toggleRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10
  },
  toggleChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#f8fafc"
  },
  toggleChipActive: {
    backgroundColor: "#1d4ed8",
    borderColor: "#1d4ed8"
  },
  toggleText: {
    color: "#334155",
    fontWeight: "700",
    fontSize: 12
  },
  toggleTextActive: {
    color: "#ffffff"
  },
  cityScroll: {
    marginBottom: 8
  },
  cityRow: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 10
  },
  cityChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingVertical: 6,
    paddingHorizontal: 11,
    backgroundColor: "#ffffff"
  },
  cityChipActive: {
    borderColor: "#1d4ed8",
    backgroundColor: "#eff6ff"
  },
  cityText: {
    color: "#334155",
    fontWeight: "700",
    fontSize: 12
  },
  cityTextActive: {
    color: "#1d4ed8"
  },
  rateGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8
  },
  rateBox: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#dbe7ff",
    backgroundColor: "#f8fbff",
    borderRadius: 12,
    padding: 10
  },
  rateLabel: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "700"
  },
  rateValue: {
    color: "#0f172a",
    fontSize: 19,
    fontWeight: "800",
    marginTop: 4
  },
  rateUnit: {
    marginTop: 3,
    color: "#64748b",
    fontSize: 11,
    fontWeight: "600"
  },
  warningText: {
    marginTop: 8,
    color: "#b45309",
    fontSize: 11,
    fontWeight: "600"
  },
  emptyText: {
    color: "#64748b"
  },
  button: {
    backgroundColor: "#ffffff",
    borderColor: "#dbe3ee",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  buttonLeft: {
    flexDirection: "row",
    alignItems: "center"
  },
  buttonText: {
    color: "#0f172a",
    fontWeight: "700",
    fontSize: 15
  },
  dangerButton: {
    backgroundColor: "#fee2e2",
    borderColor: "#fecaca"
  },
  dangerButtonText: {
    color: "#991b1b"
  }
});
