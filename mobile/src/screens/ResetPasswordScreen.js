import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useAuth } from "../context/AuthContext";

export default function ResetPasswordScreen({ navigation, route }) {
  const initialEmail = route?.params?.email || "";
  const { verifyOtp, resetPassword } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);

  const handleVerifyOtp = async () => {
    if (!email || !otp) {
      Alert.alert("Validation", "Email and OTP are required");
      return;
    }

    try {
      setLoadingVerify(true);
      await verifyOtp({ email, otp });
      Alert.alert("OTP Verified", "Now set your new password.");
    } catch (error) {
      const message = error?.response?.data?.message || "OTP verification failed";
      Alert.alert("Failed", message);
    } finally {
      setLoadingVerify(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email || !otp || !newPassword) {
      Alert.alert("Validation", "Please fill all fields");
      return;
    }

    try {
      setLoadingReset(true);
      await resetPassword({ email, otp, newPassword });
      Alert.alert("Success", "Password reset completed. Please login.");
      navigation.navigate("Login");
    } catch (error) {
      const message = error?.response?.data?.message || "Unable to reset password";
      Alert.alert("Failed", message);
    } finally {
      setLoadingReset(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Reset Password</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="OTP"
          keyboardType="number-pad"
          value={otp}
          onChangeText={setOtp}
        />

        <TouchableOpacity style={styles.secondaryButton} onPress={handleVerifyOtp} disabled={loadingVerify}>
          {loadingVerify ? (
            <ActivityIndicator color="#0f766e" />
          ) : (
            <Text style={styles.secondaryButtonText}>Verify OTP</Text>
          )}
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="New Password"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleResetPassword} disabled={loadingReset}>
          {loadingReset ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Reset Password</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f3f6fa",
    justifyContent: "center",
    padding: 20
  },
  inner: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: "#dbe3ee"
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 14,
    textAlign: "center"
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#dbe3ee"
  },
  button: {
    backgroundColor: "#0f766e",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginTop: 4
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#0f766e",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    marginBottom: 12
  },
  secondaryButtonText: {
    color: "#0f766e",
    fontWeight: "700"
  }
});
