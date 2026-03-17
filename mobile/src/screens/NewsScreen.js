import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../api/client";
import { NEWS_REFRESH_MS } from "../constants/realtime";

const NewsRow = ({ item }) => {
  const openLink = async () => {
    try {
      await Linking.openURL(item.link);
    } catch (_error) {
      Alert.alert("Unable to open", "Could not open this news link.");
    }
  };

  return (
    <TouchableOpacity style={styles.newsRow} onPress={openLink} activeOpacity={0.85}>
      <Text style={styles.newsTitle}>{item.title}</Text>
      <Text style={styles.newsMeta}>
        {item.publisher || "Market News"}
        {item.publishedAt ? ` • ${new Date(item.publishedAt).toLocaleString()}` : ""}
      </Text>
    </TouchableOpacity>
  );
};

export default function NewsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [news, setNews] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(null);

  const loadNews = useCallback(async () => {
    const { data } = await api.get("/market/news?count=25");
    setNews(Array.isArray(data.news) ? data.news : []);
    setUpdatedAt(data.updatedAt || null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const fetchData = async () => {
        try {
          setLoading(true);
          await loadNews();
        } catch (error) {
          const message = error?.response?.data?.message || "Unable to fetch market news";
          Alert.alert("Error", message);
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

      fetchData();

      return () => {
        mounted = false;
      };
    }, [loadNews])
  );

  useEffect(() => {
    const timer = setInterval(() => {
      loadNews().catch(() => {});
    }, NEWS_REFRESH_MS);

    return () => clearInterval(timer);
  }, [loadNews]);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadNews();
    } catch (error) {
      const message = error?.response?.data?.message || "Unable to refresh market news";
      Alert.alert("Error", message);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
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
      <View style={styles.headerCard}>
        <Text style={styles.title}>Market News</Text>
        <Text style={styles.subtitle}>
          Tap any headline to open the full article. Auto-refresh every {Math.round(NEWS_REFRESH_MS / 1000)}s.
        </Text>
      </View>

      <View style={styles.card}>
        {news.length === 0 ? (
          <Text style={styles.emptyText}>No news available right now.</Text>
        ) : (
          news.map((item) => <NewsRow key={item.id} item={item} />)
        )}
      </View>

      {updatedAt ? <Text style={styles.updatedAt}>Updated: {new Date(updatedAt).toLocaleString()}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef4ff"
  },
  content: {
    padding: 14,
    paddingBottom: 24
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  headerCard: {
    backgroundColor: "#0f3b8f",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10
  },
  title: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "800"
  },
  subtitle: {
    color: "#dbeafe",
    marginTop: 4,
    fontSize: 13
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d5e3ff",
    padding: 12
  },
  newsRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#edf2ff",
    paddingVertical: 9
  },
  newsTitle: {
    color: "#0f172a",
    fontWeight: "700",
    fontSize: 14,
    lineHeight: 20
  },
  newsMeta: {
    marginTop: 4,
    color: "#64748b",
    fontSize: 11
  },
  emptyText: {
    color: "#64748b"
  },
  updatedAt: {
    textAlign: "center",
    marginTop: 10,
    color: "#64748b",
    fontSize: 12
  }
});
