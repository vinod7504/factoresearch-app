import React from "react";
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const openWebsite = async () => {
  const url = "https://www.factoresearch.com";
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert("Cannot open website", url);
      return;
    }
    await Linking.openURL(url);
  } catch (_error) {
    Alert.alert("Error", "Unable to open website");
  }
};

const Paragraph = ({ children }) => <Text style={styles.paragraph}>{children}</Text>;

export default function AboutUsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Who We Are</Text>
      <Text style={styles.subtitle}>About Facto Research</Text>

      <View style={styles.card}>
        <Paragraph>
          15 years of market mastery, institutional-grade analysis, and a commitment to truth through data.
        </Paragraph>

        <Text style={styles.sectionTitle}>15 Years of Market Mastery</Text>
        <Paragraph>
          Facto Research is led by a veteran Research Analyst with over 15 years of deep-market experience in Indian equities.
        </Paragraph>
        <Paragraph>
          15 years in the markets provide a perspective that charts alone cannot show. It brings the wisdom of having navigated diverse market cycles, economic shifts, and structural reforms.
        </Paragraph>
        <Paragraph>
          At Facto Research, we believe successful investing is not about following the noise. It is about following the facts. We provide institutional-grade market intelligence to help investors navigate the complexities of Indian financial markets with clarity and confidence.
        </Paragraph>

        <Text style={styles.sectionTitle}>Institutional Grade. SEBI Registered.</Text>
        <Paragraph>
          We are a SEBI Registered Research Analyst firm (Registration No. INH000024480). Our foundation is built on the twin pillars of unmatched experience and regulatory excellence. We bring sophisticated research techniques used by institutional desks to the discerning individual investor.
        </Paragraph>

        <Text style={styles.sectionTitle}>The Facto Philosophy: Truth Through Data</Text>
        <Paragraph>
          In 15 years of research, we have learned that prices fluctuate, but facts eventually prevail. Our Facto methodology is a proprietary research framework refined over 15 years.
        </Paragraph>

        <TouchableOpacity style={styles.websiteButton} onPress={openWebsite}>
          <Text style={styles.websiteButtonText}>Open www.factoresearch.com</Text>
        </TouchableOpacity>
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
    padding: 16,
    paddingBottom: 30
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0f172a"
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 12,
    color: "#334155",
    fontWeight: "700"
  },
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#dbe3ee",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14
  },
  sectionTitle: {
    marginTop: 10,
    marginBottom: 6,
    color: "#0f172a",
    fontWeight: "800",
    fontSize: 16
  },
  paragraph: {
    color: "#334155",
    lineHeight: 20,
    marginBottom: 8
  },
  websiteButton: {
    marginTop: 8,
    backgroundColor: "#2e52b7",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center"
  },
  websiteButtonText: {
    color: "#ffffff",
    fontWeight: "700"
  }
});
