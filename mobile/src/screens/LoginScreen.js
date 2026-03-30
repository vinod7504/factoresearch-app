import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useAuth } from "../context/AuthContext";
import BrandLogo from "../components/BrandLogo";

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Validation", "Please enter email and password");
      return;
    }

    try {
      setLoading(true);
      await login({ email, password });
    } catch (error) {
      const message = error?.response?.data?.message || "Unable to login";
      Alert.alert("Login Failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.heroCard}>
          <View style={styles.logoWrap}>
            <BrandLogo />
          </View>
          <Text style={styles.heroTitle}>Investor Login</Text>
          <Text style={styles.heroSubtitle}>Access your dashboard, recommendations, KYC status, and account services from one place.</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Welcome Back</Text>
          <Text style={styles.cardSubtitle}>Sign in to continue with Facto Research.</Text>

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#94a3b8"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter password"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Login</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
            <Text style={styles.link}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text style={styles.linkSecondary}>Create new account</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Facto Research</Text>
          <Text style={styles.infoLine}>SEBI Registered Research Analyst: INH000024480</Text>
          <Text style={styles.infoLine}>Support: support@factoresearch.com</Text>
          <Text style={styles.infoLine}>Website: www.factoresearch.com</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#eaf2ff"
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    paddingVertical: 28
  },
  heroCard: {
    backgroundColor: "#0f3b8f",
    borderRadius: 24,
    padding: 22,
    marginBottom: 16
  },
  logoWrap: {
    alignItems: "center",
    marginBottom: 16
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    color: "#ffffff"
  },
  heroSubtitle: {
    marginTop: 8,
    color: "#dbeafe",
    textAlign: "center",
    lineHeight: 21,
    fontSize: 14
  },
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#d7e4fb",
    padding: 18,
    marginBottom: 14
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a"
  },
  cardSubtitle: {
    color: "#64748b",
    marginTop: 4,
    marginBottom: 16
  },
  label: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6
  },
  input: {
    backgroundColor: "#f8fbff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#dbe3ee",
    color: "#0f172a"
  },
  button: {
    backgroundColor: "#1d4ed8",
    borderRadius: 14,
    padding: 15,
    alignItems: "center",
    marginTop: 4
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 16
  },
  link: {
    textAlign: "center",
    color: "#1d4ed8",
    marginTop: 14,
    fontWeight: "700"
  },
  linkSecondary: {
    textAlign: "center",
    color: "#0f172a",
    marginTop: 10,
    fontWeight: "700"
  },
  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d7e4fb",
    padding: 16
  },
  infoTitle: {
    color: "#0f172a",
    fontWeight: "800",
    fontSize: 16,
    marginBottom: 8
  },
  infoLine: {
    color: "#475569",
    lineHeight: 20,
    fontSize: 13
  }
});
