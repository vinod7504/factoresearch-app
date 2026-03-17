import React from "react";
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const openUrl = async (url) => {
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert("Cannot open link", url);
      return;
    }
    await Linking.openURL(url);
  } catch (error) {
    Alert.alert("Error", "Unable to open link");
  }
};

const ContactRow = ({ label, value, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </TouchableOpacity>
  );
};

export default function ContactUsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>Contact Info</Text>

        <ContactRow
          label="Phone"
          value="+91 99599 37373"
          onPress={() => openUrl("tel:+919959937373")}
        />

        <TouchableOpacity style={styles.whatsAppButton} onPress={() => openUrl("https://wa.me/919959937373")}>
          <Text style={styles.whatsAppText}>Message us on WhatsApp</Text>
        </TouchableOpacity>

        <ContactRow
          label="Support Email"
          value="support@factoresearch.com"
          onPress={() => openUrl("mailto:support@factoresearch.com")}
        />

        <ContactRow
          label="Compliance Email"
          value="compliance@factoresearch.com"
          onPress={() => openUrl("mailto:compliance@factoresearch.com")}
        />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Address</Text>
          <Text style={styles.rowValue}>
            D.No.7, SNO.432/4 Plot No.6, Opp JNTU College, KM Colony, Anantapur, Andhra Pradesh-515002.
          </Text>
        </View>

        <View style={styles.rowNoBorder}>
          <Text style={styles.hoursLabel}>Open today</Text>
          <Text style={styles.hoursValue}>09:00 am - 05:00 pm</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f6fa"
  },
  content: {
    padding: 16
  },
  card: {
    backgroundColor: "#d9e3f7",
    borderRadius: 14,
    padding: 14,
    borderColor: "#c7d4ef",
    borderWidth: 1
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8
  },
  row: {
    borderBottomWidth: 1,
    borderBottomColor: "#c2cde2",
    paddingVertical: 10
  },
  rowNoBorder: {
    paddingVertical: 10
  },
  rowLabel: {
    fontSize: 12,
    color: "#334155",
    marginBottom: 4,
    fontWeight: "700"
  },
  rowValue: {
    fontSize: 16,
    color: "#1e293b",
    lineHeight: 24
  },
  whatsAppButton: {
    marginTop: 10,
    marginBottom: 4,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#c2cde2"
  },
  whatsAppText: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "700"
  },
  hoursLabel: {
    color: "#334155",
    marginBottom: 6,
    fontWeight: "700",
    fontSize: 16
  },
  hoursValue: {
    color: "#1d4ed8",
    fontWeight: "800",
    fontSize: 18
  }
});
