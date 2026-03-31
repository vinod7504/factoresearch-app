import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../api/client";
import { getCachedQuote } from "../utils/marketCache";
import BrandLogo from "./BrandLogo";

export default function HeaderBrandSearch({ navigation }) {
  const [symbol, setSymbol] = useState("");
  const [loading, setLoading] = useState(false);

  const onSearch = async () => {
    const cleanSymbol = symbol.trim().toUpperCase();

    if (!cleanSymbol) {
      Alert.alert("Validation", "Enter a stock symbol (example: RELIANCE.NS or AAPL)");
      return;
    }

    try {
      setLoading(true);
      Keyboard.dismiss();
      const { data } = await api.get(`/market/quote/${encodeURIComponent(cleanSymbol)}`);
      const nextSymbol = String(data?.quote?.symbol || cleanSymbol).toUpperCase();
      navigation.navigate("RecommendationDetail", { symbol: nextSymbol });
    } catch (error) {
      const fallback = await getCachedQuote(cleanSymbol);
      if (fallback?.symbol) {
        Alert.alert("Live Feed Unavailable", "Opening last saved market snapshot for this symbol.");
        navigation.navigate("RecommendationDetail", { symbol: String(fallback.symbol).toUpperCase() });
      } else {
        const message = error?.response?.data?.message || "Unable to fetch stock quote";
        Alert.alert("Search Failed", message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <BrandLogo compact />
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.input}
          value={symbol}
          onChangeText={setSymbol}
          placeholder="Search stock"
          placeholderTextColor="#94a3b8"
          autoCapitalize="characters"
          returnKeyType="search"
          onSubmitEditing={onSearch}
        />
        <TouchableOpacity style={styles.button} onPress={onSearch} disabled={loading} accessibilityLabel="Search stock">
          {loading ? <ActivityIndicator size="small" color="#ffffff" /> : <Ionicons name="search" size={16} color="#ffffff" />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 8
  },
  searchWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5ff",
    borderWidth: 1,
    borderColor: "#d6e3ff",
    borderRadius: 10,
    overflow: "hidden",
    minHeight: 38
  },
  input: {
    flex: 1,
    color: "#0f172a",
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13
  },
  button: {
    width: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1d4ed8",
    alignSelf: "stretch"
  }
});
