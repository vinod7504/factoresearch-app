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
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import BrandLogo from "../components/BrandLogo";

const ADMIN_TEST_USER = {
  email: process.env.EXPO_PUBLIC_ADMIN_TEST_EMAIL || "vinodkumarjntua@gmail.com",
  password: process.env.EXPO_PUBLIC_ADMIN_TEST_PASSWORD || "Vinod@2004"
};

const DEMO_TEST_USER = {
  email: "user@gmail.com",
  password: "user123"
};

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const autofillCredentials = ({ email: nextEmail, password: nextPassword }) => {
    setEmail(nextEmail);
    setPassword(nextPassword);
  };

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

          <View style={styles.testRow}>
            <TouchableOpacity
              style={styles.testButton}
              onPress={() => autofillCredentials(ADMIN_TEST_USER)}
              accessibilityRole="button"
              accessibilityLabel="Autofill admin credentials"
              accessibilityHint="Fills email and password for admin testing"
            >
              <Text style={styles.testButtonText}>Use Admin Test</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.testButton}
              onPress={() => autofillCredentials(DEMO_TEST_USER)}
              accessibilityRole="button"
              accessibilityLabel="Autofill demo user credentials"
              accessibilityHint="Fills email and password for demo user testing"
            >
              <Text style={styles.testButtonText}>Use Demo User</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#94a3b8"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            accessibilityLabel="Email address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter password"
              placeholderTextColor="#94a3b8"
              secureTextEntry={!showPassword}
              autoComplete="password"
              textContentType="password"
              accessibilityLabel="Password"
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword((prev) => !prev)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? "Hide password" : "Show password"}
            >
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Login"
            accessibilityHint="Signs in with entered credentials"
          >
            {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Login</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")} accessibilityRole="button" accessibilityLabel="Forgot password">
            <Text style={styles.link}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Register")} accessibilityRole="button" accessibilityLabel="Create new account">
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
  testRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14
  },
  testButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#93c5fd",
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8
  },
  testButtonText: {
    color: "#1e3a8a",
    fontWeight: "800",
    fontSize: 12
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
  passwordContainer: {
    backgroundColor: "#f8fbff",
    borderRadius: 14,
    paddingLeft: 14,
    paddingRight: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#dbe3ee",
    flexDirection: "row",
    alignItems: "center"
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    color: "#0f172a"
  },
  eyeButton: {
    padding: 4
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
