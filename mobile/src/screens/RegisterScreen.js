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

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleRegister = async () => {
    if (!form.username || !form.email || !form.phone || !form.password) {
      Alert.alert("Validation", "Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      await register(form);
    } catch (error) {
      const message = error?.response?.data?.message || "Unable to register";
      Alert.alert("Registration Failed", message);
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
          <Text style={styles.heroTitle}>Create Your Account</Text>
          <Text style={styles.heroSubtitle}>Register to start onboarding, manage your profile, and access recommendations and alerts.</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>New Investor Registration</Text>
          <Text style={styles.cardSubtitle}>Complete your details to get started.</Text>

          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            placeholderTextColor="#94a3b8"
            value={form.username}
            onChangeText={(value) => updateField("username", value)}
          />

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#94a3b8"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={(value) => updateField("email", value)}
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter mobile number"
            placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
            value={form.phone}
            onChangeText={(value) => updateField("phone", value)}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Create password"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            value={form.password}
            onChangeText={(value) => updateField("password", value)}
          />

          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Register</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.link}>Already have an account? Login</Text>
          </TouchableOpacity>
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
    padding: 20,
    paddingVertical: 28,
    justifyContent: "center",
    flexGrow: 1
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
    padding: 18
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
  }
});
