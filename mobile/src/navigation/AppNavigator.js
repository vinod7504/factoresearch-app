import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import ResetPasswordScreen from "../screens/ResetPasswordScreen";
import HomeScreen from "../screens/HomeScreen";
import EmiCalculatorScreen from "../screens/EmiCalculatorScreen";
import MutualFundCalculatorScreen from "../screens/MutualFundCalculatorScreen";
import AccountScreen from "../screens/AccountScreen";
import WatchlistScreen from "../screens/WatchlistScreen";
import SuggestionsScreen from "../screens/SuggestionsScreen";
import StockDetailsScreen from "../screens/StockDetailsScreen";
import ContactUsScreen from "../screens/ContactUsScreen";
import AboutUsScreen from "../screens/AboutUsScreen";
import MoreScreen from "../screens/MoreScreen";
import NewsScreen from "../screens/NewsScreen";
import AdminSuggestionsScreen from "../screens/AdminSuggestionsScreen";
import SplashScreen from "../screens/SplashScreen";
import BrandLogo from "../components/BrandLogo";

const Stack = createNativeStackNavigator();
const PrivateStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const PublicNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTitle: () => <BrandLogo compact />,
        headerTitleAlign: "left"
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: "Recover Account" }} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ title: "Reset Password" }} />
    </Stack.Navigator>
  );
};

const tabIconByRoute = {
  HomeTab: "home",
  WatchlistTab: "bookmark",
  EmiCalculatorTab: "cash",
  MutualFundCalculatorTab: "pie-chart",
  MoreTab: "menu"
};

const PrivateTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerTitle: () => <BrandLogo compact />,
        headerTitleAlign: "left",
        tabBarActiveTintColor: "#1d4ed8",
        tabBarInactiveTintColor: "#64748b",
        tabBarLabelStyle: {
          fontWeight: "700",
          fontSize: 11,
          marginBottom: 3
        },
        tabBarStyle: {
          height: 62,
          paddingTop: 5,
          paddingBottom: 6,
          borderTopColor: "#dbeafe"
        },
        tabBarIcon: ({ color, size, focused }) => {
          const icon = tabIconByRoute[route.name] || "ellipse";
          return <Ionicons name={focused ? icon : `${icon}-outline`} size={size} color={color} />;
        },
        headerShadowVisible: false
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: "Home", tabBarLabel: "Home" }} />
      <Tab.Screen
        name="WatchlistTab"
        component={WatchlistScreen}
        options={{ title: "My Watchlist", tabBarLabel: "Watchlist" }}
      />
      <Tab.Screen
        name="EmiCalculatorTab"
        component={EmiCalculatorScreen}
        options={{ title: "EMI Calculator", tabBarLabel: "EMI" }}
      />
      <Tab.Screen
        name="MutualFundCalculatorTab"
        component={MutualFundCalculatorScreen}
        options={{ title: "Mutual Fund Calculator", tabBarLabel: "Mutual" }}
      />
      <Tab.Screen name="MoreTab" component={MoreScreen} options={{ title: "More", tabBarLabel: "More" }} />
    </Tab.Navigator>
  );
};

const PrivateNavigator = () => {
  return (
    <PrivateStack.Navigator>
      <PrivateStack.Screen name="MainTabs" component={PrivateTabs} options={{ headerShown: false }} />
      <PrivateStack.Screen
        name="StockDetails"
        component={StockDetailsScreen}
        options={({ route }) => ({ title: route.params?.symbol || "Stock Details" })}
      />
      <PrivateStack.Screen name="MarketNews" component={NewsScreen} options={{ title: "Market News" }} />
      <PrivateStack.Screen name="Suggestions" component={SuggestionsScreen} options={{ title: "Our Suggestions" }} />
      <PrivateStack.Screen name="ContactUs" component={ContactUsScreen} options={{ title: "Contact Us" }} />
      <PrivateStack.Screen name="AboutUs" component={AboutUsScreen} options={{ title: "About Facto Research" }} />
      <PrivateStack.Screen name="AccountDetails" component={AccountScreen} options={{ title: "My Account" }} />
      <PrivateStack.Screen
        name="AdminSuggestions"
        component={AdminSuggestionsScreen}
        options={{ title: "Admin Panel" }}
      />
    </PrivateStack.Navigator>
  );
};

export default function AppNavigator() {
  const { token, isLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading || showSplash) {
    return <SplashScreen />;
  }

  return token ? <PrivateNavigator /> : <PublicNavigator />;
}
