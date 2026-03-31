import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useAppData } from "../context/AppDataContext";

const ONBOARDING_URL = "https://onboarding.cognifyai.in/Facto/";

const isKycApiMissingOnServer = (error) => {
  const status = error?.response?.status;
  const payload = error?.response?.data;
  const payloadText = typeof payload === "string" ? payload : "";
  return status === 404 && /Cannot (GET|POST|PUT) \/api\/(kyc|admin\/kyc)/i.test(payloadText);
};

const getApiErrorMessage = (error, fallback) => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (isKycApiMissingOnServer(error)) {
    return "KYC API is not deployed on backend yet. Please deploy latest backend build.";
  }

  return fallback;
};

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
      accessibilityLabel={label}
    />
  </View>
);

export default function KycProfileScreen() {
  const { user, fetchMe } = useAuth();
  const { profile, updateProfile } = useAppData();
  const [draft, setDraft] = useState(profile);
  const [loading, setLoading] = useState(true);
  const [kycApiUnavailable, setKycApiUnavailable] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const applyKycPayload = useCallback(
    (kyc) => {
      const nextProfile = {
        fullName: kyc?.fullName || user?.username || "",
        email: user?.email || profile.email,
        phone: user?.phone || profile.phone,
        dob: kyc?.dob || "",
        pan: kyc?.pan || "",
        occupation: kyc?.occupation || "Salaried",
        investorType: kyc?.investorType || "Retail Investor",
        city: kyc?.city || "",
        state: kyc?.state || "",
        nominee: kyc?.nominee || "",
        kycStatus: kyc?.status || "Pending",
        kycRedirected: Boolean(kyc?.redirected),
        kycUpdatedAt: kyc?.updatedAt || kyc?.submittedAt || null,
        kycReviewNote: kyc?.reviewNote || ""
      };

      updateProfile(nextProfile);
      setDraft((prev) => ({
        ...prev,
        ...nextProfile
      }));
    },
    [profile.email, profile.phone, updateProfile, user?.email, user?.phone, user?.username]
  );

  const loadKycProfile = useCallback(async () => {
    const { data } = await api.get("/kyc/me");
    const currentKyc = data?.kyc || null;
    setKycApiUnavailable(false);
    applyKycPayload(currentKyc);

    if (currentKyc?.status === "Pending") {
      const startRes = await api.post("/kyc/start");
      applyKycPayload(startRes?.data?.kyc || null);
    }
  }, [applyKycPayload]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const run = async () => {
        try {
          if (mounted) {
            setLoading(true);
          }
          await loadKycProfile();
        } catch (error) {
          if (isKycApiMissingOnServer(error)) {
            if (mounted) {
              setKycApiUnavailable(true);
            }
          } else {
            const message = getApiErrorMessage(error, "Unable to load KYC profile");
            Alert.alert("Error", message);
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

      run();

      return () => {
        mounted = false;
      };
    }, [loadKycProfile])
  );

  const kycTone = useMemo(() => {
    if (draft.kycStatus === "Verified") {
      return styles.statusGreen;
    }
    if (draft.kycStatus === "Submitted") {
      return styles.statusAmber;
    }
    if (draft.kycStatus === "Rejected") {
      return styles.statusRed;
    }
    if (draft.kycStatus === "In progress") {
      return styles.statusBlue;
    }
    return styles.statusGray;
  }, [draft.kycStatus]);

  const setField = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadKycProfile();
    } catch (error) {
      const message = getApiErrorMessage(error, "Unable to refresh KYC");
      Alert.alert("Error", message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSave = async () => {
    if (kycApiUnavailable) {
      Alert.alert("KYC Service", "KYC API is not available on backend yet. Deploy latest backend and try again.");
      return;
    }

    try {
      setSaving(true);
      const { data } = await api.put("/kyc/me", {
        fullName: draft.fullName,
        dob: draft.dob,
        pan: draft.pan,
        occupation: draft.occupation,
        investorType: draft.investorType,
        city: draft.city,
        state: draft.state,
        nominee: draft.nominee
      });
      applyKycPayload(data?.kyc || null);
      Alert.alert("Saved", "KYC profile details saved.");
    } catch (error) {
      const message = getApiErrorMessage(error, "Unable to save KYC profile");
      Alert.alert("Error", message);
    } finally {
      setSaving(false);
    }
  };

  const openOnboarding = async () => {
    if (kycApiUnavailable) {
      Alert.alert("KYC Service", "KYC API is not available on backend yet. Deploy latest backend and try again.");
      return;
    }

    try {
      const { data } = await api.post("/kyc/start");
      applyKycPayload(data?.kyc || null);
      await Linking.openURL(ONBOARDING_URL);
    } catch (error) {
      const message = getApiErrorMessage(error, "KYC onboarding link could not be opened.");
      Alert.alert("Unable to open", message);
    }
  };

  const handleSubmitKyc = async () => {
    if (kycApiUnavailable) {
      Alert.alert("KYC Service", "KYC API is not available on backend yet. Deploy latest backend and try again.");
      return;
    }

    try {
      setSubmitting(true);
      const { data } = await api.post("/kyc/submit", {
        fullName: draft.fullName,
        dob: draft.dob,
        pan: draft.pan,
        occupation: draft.occupation,
        investorType: draft.investorType,
        city: draft.city,
        state: draft.state,
        nominee: draft.nominee
      });

      applyKycPayload(data?.kyc || null);
      await fetchMe();
      Alert.alert("Submitted", "Your KYC is submitted to admin for verification.");
    } catch (error) {
      const message = getApiErrorMessage(error, "Unable to submit KYC");
      Alert.alert("Error", message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.heroCard}>
        <Text style={styles.title}>KYC + Profile</Text>
        <Text style={styles.subtitle}>Complete onboarding, maintain your investor profile, and keep KYC status current.</Text>
        {kycApiUnavailable ? (
          <View style={styles.backendWarning}>
            <Text style={styles.backendWarningText}>KYC service is not available on the deployed backend yet.</Text>
          </View>
        ) : null}
        <View style={[styles.statusPill, kycTone]}>
          <Text style={styles.statusText}>KYC Status: {draft.kycStatus}</Text>
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

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleSave}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Save KYC profile"
        >
          {saving ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>Save Profile</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>KYC Onboarding</Text>
        <Text style={styles.copy}>For KYC, continue to the official onboarding journey from Facto Research.</Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={openOnboarding}
          accessibilityRole="button"
          accessibilityLabel="Open Cognify onboarding"
        >
          <Text style={styles.primaryButtonText}>Open Cognify Onboarding</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleSubmitKyc}
          disabled={submitting || draft.kycStatus === "Verified"}
          accessibilityRole="button"
          accessibilityLabel="Submit KYC for verification"
        >
          {submitting ? (
            <ActivityIndicator color="#1d4ed8" />
          ) : (
            <Text style={styles.secondaryButtonText}>
              {draft.kycStatus === "Verified" ? "KYC Already Verified" : "Submit KYC For Verification"}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.metaText}>Onboarding URL: {ONBOARDING_URL}</Text>
        {draft.kycUpdatedAt ? <Text style={styles.metaText}>Last updated: {new Date(draft.kycUpdatedAt).toLocaleString()}</Text> : null}
        {draft.kycReviewNote ? <Text style={styles.reviewText}>Admin note: {draft.kycReviewNote}</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#eff5ff" },
  content: { padding: 16, paddingBottom: 28 },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#eff5ff" },
  heroCard: { backgroundColor: "#0f3b8f", borderRadius: 18, padding: 16, marginBottom: 12 },
  title: { color: "#ffffff", fontSize: 26, fontWeight: "800" },
  subtitle: { color: "#dbeafe", marginTop: 6, lineHeight: 20 },
  backendWarning: { marginTop: 10, backgroundColor: "#fef3c7", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  backendWarningText: { color: "#92400e", fontSize: 12, fontWeight: "700" },
  statusPill: { marginTop: 12, alignSelf: "flex-start", borderRadius: 999, paddingVertical: 7, paddingHorizontal: 12 },
  statusBlue: { backgroundColor: "#dbeafe" },
  statusAmber: { backgroundColor: "#fef3c7" },
  statusGreen: { backgroundColor: "#dcfce7" },
  statusRed: { backgroundColor: "#fee2e2" },
  statusGray: { backgroundColor: "#e2e8f0" },
  statusText: { color: "#0f172a", fontWeight: "800", fontSize: 12 },
  card: { backgroundColor: "#ffffff", borderRadius: 16, borderWidth: 1, borderColor: "#d8e5ff", padding: 14, marginBottom: 12 },
  sectionTitle: { color: "#0f172a", fontSize: 18, fontWeight: "800", marginBottom: 10 },
  fieldWrap: { marginBottom: 10 },
  fieldLabel: { color: "#334155", fontSize: 13, fontWeight: "700", marginBottom: 5 },
  input: { borderWidth: 1, borderColor: "#b6c8ea", borderRadius: 12, backgroundColor: "#f8fbff", paddingHorizontal: 12, paddingVertical: 11, color: "#0f172a" },
  inputDisabled: { backgroundColor: "#edf2ff", color: "#475569" },
  copy: { color: "#334155", lineHeight: 20, marginBottom: 12 },
  primaryButton: { borderRadius: 12, backgroundColor: "#1d4ed8", alignItems: "center", justifyContent: "center", minHeight: 44, paddingVertical: 12, marginTop: 4 },
  primaryButtonText: { color: "#ffffff", fontWeight: "800" },
  secondaryButton: { borderRadius: 12, backgroundColor: "#eff6ff", borderWidth: 1, borderColor: "#93c5fd", alignItems: "center", justifyContent: "center", minHeight: 44, paddingVertical: 12, marginTop: 10 },
  secondaryButtonText: { color: "#1d4ed8", fontWeight: "800" },
  metaText: { marginTop: 10, color: "#475569", fontSize: 12, lineHeight: 18 },
  reviewText: { marginTop: 10, color: "#991b1b", fontSize: 12, lineHeight: 18, fontWeight: "700" }
});
