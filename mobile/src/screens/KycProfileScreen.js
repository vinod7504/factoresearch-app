import React, { useMemo, useState } from "react";
import { Alert, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useAppData } from "../context/AppDataContext";

const ONBOARDING_URL = "https://onboarding.cognifyai.in/Facto/";

const Field = ({ label, value, onChangeText, editable = true, placeholder }) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      style={[styles.input, !editable ? styles.inputDisabled : null]}
      value={value}
      onChangeText={onChangeText}
      editable={editable}
      placeholder={placeholder}
      placeholderTextColor="#94a3b8"
    />
  </View>
);

export default function KycProfileScreen() {
  const { user } = useAuth();
  const { profile, updateProfile, markKycCompleted, markKycRedirected } = useAppData();
  const [draft, setDraft] = useState(profile);

  const kycTone = useMemo(() => {
    if (profile.kycStatus === "Submitted") {
      return styles.statusGreen;
    }
    if (profile.kycStatus === "In progress") {
      return styles.statusAmber;
    }
    return styles.statusBlue;
  }, [profile.kycStatus]);

  const setField = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updateProfile(draft);
    Alert.alert("Saved", "Profile details updated on this device.");
  };

  const openOnboarding = async () => {
    try {
      markKycRedirected();
      await Linking.openURL(ONBOARDING_URL);
    } catch (_error) {
      Alert.alert("Unable to open", "KYC onboarding link could not be opened.");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.title}>KYC + Profile</Text>
        <Text style={styles.subtitle}>Complete onboarding, maintain your investor profile, and keep KYC status current.</Text>
        <View style={[styles.statusPill, kycTone]}>
          <Text style={styles.statusText}>KYC Status: {profile.kycStatus}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Investor Details</Text>
        <Field label="Full Name" value={draft.fullName} onChangeText={(value) => setField("fullName", value)} />
        <Field label="Email" value={user?.email || draft.email} editable={false} />
        <Field label="Phone" value={user?.phone || draft.phone} editable={false} />
        <Field label="Date of Birth" value={draft.dob} onChangeText={(value) => setField("dob", value)} placeholder="DD/MM/YYYY" />
        <Field label="PAN" value={draft.pan} onChangeText={(value) => setField("pan", value.toUpperCase())} placeholder="ABCDE1234F" />
        <Field label="Occupation" value={draft.occupation} onChangeText={(value) => setField("occupation", value)} />
        <Field label="Investor Type" value={draft.investorType} onChangeText={(value) => setField("investorType", value)} />
        <Field label="City" value={draft.city} onChangeText={(value) => setField("city", value)} />
        <Field label="State" value={draft.state} onChangeText={(value) => setField("state", value)} />
        <Field label="Nominee" value={draft.nominee} onChangeText={(value) => setField("nominee", value)} />

        <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
          <Text style={styles.primaryButtonText}>Save Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>KYC Onboarding</Text>
        <Text style={styles.copy}>For KYC, continue to the official onboarding journey from Facto Research.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={openOnboarding}>
          <Text style={styles.primaryButtonText}>Open Cognify Onboarding</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={markKycCompleted}>
          <Text style={styles.secondaryButtonText}>Mark KYC as Submitted</Text>
        </TouchableOpacity>
        <Text style={styles.metaText}>Onboarding URL: {ONBOARDING_URL}</Text>
        {profile.kycUpdatedAt ? (
          <Text style={styles.metaText}>Last updated: {new Date(profile.kycUpdatedAt).toLocaleString()}</Text>
        ) : null}
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
  statusPill: { marginTop: 12, alignSelf: "flex-start", borderRadius: 999, paddingVertical: 7, paddingHorizontal: 12 },
  statusBlue: { backgroundColor: "#dbeafe" },
  statusAmber: { backgroundColor: "#fef3c7" },
  statusGreen: { backgroundColor: "#dcfce7" },
  statusText: { color: "#0f172a", fontWeight: "800", fontSize: 12 },
  card: { backgroundColor: "#ffffff", borderRadius: 16, borderWidth: 1, borderColor: "#d8e5ff", padding: 14, marginBottom: 12 },
  sectionTitle: { color: "#0f172a", fontSize: 18, fontWeight: "800", marginBottom: 10 },
  fieldWrap: { marginBottom: 10 },
  fieldLabel: { color: "#475569", fontSize: 12, fontWeight: "700", marginBottom: 5 },
  input: { borderWidth: 1, borderColor: "#d8e5ff", borderRadius: 12, backgroundColor: "#f8fbff", paddingHorizontal: 12, paddingVertical: 11, color: "#0f172a" },
  inputDisabled: { backgroundColor: "#edf2ff", color: "#64748b" },
  copy: { color: "#334155", lineHeight: 20, marginBottom: 12 },
  primaryButton: { borderRadius: 12, backgroundColor: "#1d4ed8", alignItems: "center", paddingVertical: 12, marginTop: 4 },
  primaryButtonText: { color: "#ffffff", fontWeight: "800" },
  secondaryButton: { borderRadius: 12, backgroundColor: "#eff6ff", borderWidth: 1, borderColor: "#bfdbfe", alignItems: "center", paddingVertical: 12, marginTop: 10 },
  secondaryButtonText: { color: "#1d4ed8", fontWeight: "800" },
  metaText: { marginTop: 10, color: "#64748b", fontSize: 12, lineHeight: 18 }
});
