import React, { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

const COMPANY_LOGO_URL =
  "https://img1.wsimg.com/isteam/ip/890c2873-45ef-40f0-a650-7817ddb60ef4/Untitled%20(512%20x%20512%20px).png/:/rs=w:178,h:178,cg:true,m/cr=w:178,h:178/qt=q:95";

const BrandLogo = ({ compact = false }) => {
  const [logoLoadError, setLogoLoadError] = useState(false);
  const logoSize = compact ? 36 : 48;

  return (
    <View style={[styles.container, compact ? styles.compactContainer : null]}>
      <View style={[styles.mark, { width: logoSize, height: logoSize }]}>
        {logoLoadError ? (
          <Text style={styles.markText}>FR</Text>
        ) : (
          <Image
            source={{ uri: COMPANY_LOGO_URL }}
            style={styles.logoImage}
            onError={() => setLogoLoadError(true)}
            resizeMode="cover"
          />
        )}
      </View>
      <View>
        <Text style={[styles.title, compact ? styles.compactTitle : null]}>FACTO</Text>
        <Text style={[styles.subtitle, compact ? styles.compactSubtitle : null]}>RESEARCH</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  compactContainer: {
    gap: 8
  },
  mark: {
    borderRadius: 8,
    backgroundColor: "#2e52b7",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  logoImage: {
    width: "100%",
    height: "100%"
  },
  markText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.4
  },
  title: {
    color: "#2e52b7",
    fontWeight: "800",
    fontSize: 19,
    letterSpacing: 2.2,
    lineHeight: 20
  },
  subtitle: {
    color: "#2e52b7",
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 2.7,
    lineHeight: 14
  },
  compactTitle: {
    fontSize: 14,
    letterSpacing: 1.5,
    lineHeight: 16
  },
  compactSubtitle: {
    fontSize: 8,
    letterSpacing: 1.8,
    lineHeight: 10
  }
});

export default BrandLogo;
