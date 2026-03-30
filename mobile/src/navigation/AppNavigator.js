import React, { useEffect, useState } from "react";
import { Platform } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useAppData } from "../context/AppDataContext";
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
import MutualFundCategoriesScreen from "../screens/MutualFundCategoriesScreen";
import MutualFundCategoryFundsScreen from "../screens/MutualFundCategoryFundsScreen";
import KycProfileScreen from "../screens/KycProfileScreen";
import RiskProfileScreen from "../screens/RiskProfileScreen";
import SubscriptionPlanScreen from "../screens/SubscriptionPlanScreen";
import AlertsScreen from "../screens/AlertsScreen";
import StudyScreen from "../screens/StudyScreen";

const Stack = createNativeStackNavigator();
const PrivateStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const PublicNavigator = () => (
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

const tabIconByRoute = {
  HomeTab: "grid",
  RecommendationsTab: "sparkles",
  PortfolioTab: "briefcase",
  AlertsTab: "notifications",
  MoreTab: "menu"
};

const PrivateTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerTitle: () => <BrandLogo compact />,
      headerTitleAlign: "left",
      tabBarShowLabel: true,
      tabBarHideOnKeyboard: true,
      tabBarActiveTintColor: "#0b3a8d",
      tabBarInactiveTintColor: "#475569",
      tabBarLabelStyle: {
        fontWeight: "800",
        fontSize: 11,
        lineHeight: 14,
        marginBottom: Platform.OS === "ios" ? 1 : 2
      },
      tabBarItemStyle: {
        paddingVertical: 3,
        marginHorizontal: 3,
        marginTop: 6,
        borderRadius: 10
      },
      tabBarStyle: {
        height: Platform.OS === "ios" ? 88 : 72,
        paddingTop: 6,
        paddingBottom: Platform.OS === "ios" ? 22 : 8,
        borderTopColor: "#bfdbfe",
        borderTopWidth: 1,
        backgroundColor: "#ffffff",
        elevation: 16
      },
      tabBarActiveBackgroundColor: "#eaf1ff",
      tabBarIcon: ({ color, size, focused }) => {
        const icon = tabIconByRoute[route.name] || "ellipse";
        return <Ionicons name={focused ? icon : `${icon}-outline`} size={size + 3} color={color} />;
      },
      headerShadowVisible: false
    })}
  >
    <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: "Dashboard", tabBarLabel: "Dashboard" }} />
    <Tab.Screen
      name="RecommendationsTab"
      component={SuggestionsScreen}
      options={{ title: "Recommendations", tabBarLabel: "Recommendations" }}
    />
    <Tab.Screen
      name="PortfolioTab"
      component={WatchlistScreen}
      options={{ title: "Watchlist & Portfolio", tabBarLabel: "Portfolio" }}
    />
    <Tab.Screen name="AlertsTab" component={AlertsScreen} options={{ title: "Alerts", tabBarLabel: "Alerts" }} />
    <Tab.Screen name="MoreTab" component={MoreScreen} options={{ title: "More", tabBarLabel: "More" }} />
  </Tab.Navigator>
);

const PrivateNavigator = () => (
  <PrivateStack.Navigator>
    <PrivateStack.Screen name="MainTabs" component={PrivateTabs} options={{ headerShown: false }} />
    <PrivateStack.Screen
      name="RecommendationDetail"
      component={StockDetailsScreen}
      options={({ route }) => ({ title: route.params?.symbol || "Recommendation Detail" })}
    />
    <PrivateStack.Screen name="Suggestions" component={SuggestionsScreen} options={{ title: "Recommendations" }} />
    <PrivateStack.Screen name="KycProfile" component={KycProfileScreen} options={{ title: "KYC + Profile" }} />
    <PrivateStack.Screen name="RiskProfile" component={RiskProfileScreen} options={{ title: "Risk Profiling" }} />
    <PrivateStack.Screen
      name="SubscriptionPlan"
      component={SubscriptionPlanScreen}
      options={{ title: "Subscription Plan" }}
    />
    <PrivateStack.Screen name="MarketNews" component={NewsScreen} options={{ title: "Market News" }} />
    <PrivateStack.Screen name="Study" component={StudyScreen} options={{ title: "Study" }} />
    <PrivateStack.Screen name="ContactUs" component={ContactUsScreen} options={{ title: "Support & Grievance" }} />
    <PrivateStack.Screen name="AboutUs" component={AboutUsScreen} options={{ title: "Disclosures & SEBI" }} />
    <PrivateStack.Screen name="AccountDetails" component={AccountScreen} options={{ title: "Account Overview" }} />
    <PrivateStack.Screen name="EmiCalculator" component={EmiCalculatorScreen} options={{ title: "EMI Calculator" }} />
    <PrivateStack.Screen
      name="MutualFundCalculator"
      component={MutualFundCalculatorScreen}
      options={{ title: "Mutual Fund Calculator" }}
    />
    <PrivateStack.Screen
      name="MutualFundCategories"
      component={MutualFundCategoriesScreen}
      options={{ title: "Mutual Funds" }}
    />
    <PrivateStack.Screen
      name="MutualFundCategoryFunds"
      component={MutualFundCategoryFundsScreen}
      options={({ route }) => ({ title: route.params?.title || "Mutual Funds" })}
    />
    <PrivateStack.Screen
      name="AdminSuggestions"
      component={AdminSuggestionsScreen}
      options={{ title: "Admin Panel" }}
    />
  </PrivateStack.Navigator>
);

export default function AppNavigator() {
  const { token, isLoading } = useAuth();
  const { isHydrating } = useAppData();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading || isHydrating || showSplash) {
    return <SplashScreen />;
  }

  return token ? <PrivateNavigator /> : <PublicNavigator />;
}
