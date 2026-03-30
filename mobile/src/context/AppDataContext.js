import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";

const AppDataContext = createContext(null);

const STORAGE_PREFIX = "factoresearch_appdata_v1";

const PLAN_CATALOG = [
  {
    id: "starter",
    name: "Starter",
    price: "Free",
    billing: "For onboarding and discovery",
    features: ["Market dashboard", "Basic watchlist", "KYC and profile access", "Standard support"]
  },
  {
    id: "plus",
    name: "Facto Plus",
    price: "INR 1,999",
    billing: "Quarterly",
    features: ["Research recommendations", "Priority alerts", "Portfolio review checklist", "Risk profile tracking"]
  },
  {
    id: "elite",
    name: "Facto Elite",
    price: "INR 6,999",
    billing: "Yearly",
    features: ["All Plus features", "Priority grievance desk", "Research follow-up notes", "Advisory relationship support"]
  }
];

const createDefaultState = (user) => ({
  profile: {
    fullName: user?.username || "",
    email: user?.email || "",
    phone: user?.phone || "",
    city: "Hyderabad",
    state: "Telangana",
    dob: "",
    pan: "",
    occupation: "Salaried",
    investorType: "Retail Investor",
    nominee: "",
    kycStatus: "Pending",
    kycRedirected: false,
    kycUpdatedAt: null
  },
  riskProfile: {
    level: "Not assessed",
    score: 0,
    horizon: "Medium term",
    objective: "Balanced growth",
    experience: "Beginner",
    liquidityNeed: "Moderate",
    updatedAt: null
  },
  subscription: {
    planId: "starter",
    status: "Active",
    renewalDate: null,
    advisorName: "Facto Research Desk"
  },
  portfolio: [
    { id: "p1", symbol: "RELIANCE.NS", quantity: "10", avgPrice: "2940" },
    { id: "p2", symbol: "TCS.NS", quantity: "6", avgPrice: "4025" }
  ],
  alerts: [
    {
      id: "a1",
      title: "Daily market wrap",
      channel: "In-app",
      status: "Enabled",
      trigger: "Every market close"
    },
    {
      id: "a2",
      title: "Recommendation update",
      channel: "Email",
      status: "Enabled",
      trigger: "Whenever admin changes a live recommendation"
    }
  ]
});

const mergeWithDefaults = (user, saved) => {
  const defaults = createDefaultState(user);

  return {
    ...defaults,
    ...saved,
    profile: {
      ...defaults.profile,
      ...(saved?.profile || {}),
      fullName: saved?.profile?.fullName || user?.username || defaults.profile.fullName,
      email: user?.email || saved?.profile?.email || defaults.profile.email,
      phone: user?.phone || saved?.profile?.phone || defaults.profile.phone
    },
    riskProfile: {
      ...defaults.riskProfile,
      ...(saved?.riskProfile || {})
    },
    subscription: {
      ...defaults.subscription,
      ...(saved?.subscription || {})
    },
    portfolio: Array.isArray(saved?.portfolio) ? saved.portfolio : defaults.portfolio,
    alerts: Array.isArray(saved?.alerts) ? saved.alerts : defaults.alerts
  };
};

const riskLevelFromScore = (score) => {
  if (score >= 8) {
    return "Aggressive";
  }
  if (score >= 5) {
    return "Moderate";
  }
  return "Conservative";
};

export const AppDataProvider = ({ children }) => {
  const { user } = useAuth();
  const [state, setState] = useState(createDefaultState(user));
  const [isHydrating, setIsHydrating] = useState(true);

  const storageKey = useMemo(() => {
    if (!user?.id) {
      return null;
    }

    return `${STORAGE_PREFIX}:${user.id}`;
  }, [user?.id]);

  useEffect(() => {
    let mounted = true;

    const loadState = async () => {
      if (!storageKey) {
        if (mounted) {
          setState(createDefaultState(user));
          setIsHydrating(false);
        }
        return;
      }

      try {
        setIsHydrating(true);
        const raw = await AsyncStorage.getItem(storageKey);
        const parsed = raw ? JSON.parse(raw) : null;

        if (mounted) {
          setState(mergeWithDefaults(user, parsed));
        }
      } catch (_error) {
        if (mounted) {
          setState(createDefaultState(user));
        }
      } finally {
        if (mounted) {
          setIsHydrating(false);
        }
      }
    };

    loadState();

    return () => {
      mounted = false;
    };
  }, [storageKey, user]);

  useEffect(() => {
    if (!storageKey || isHydrating) {
      return;
    }

    AsyncStorage.setItem(storageKey, JSON.stringify(state)).catch(() => {});
  }, [isHydrating, state, storageKey]);

  const updateProfile = (patch) => {
    setState((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        ...patch
      }
    }));
  };

  const markKycRedirected = () => {
    setState((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        kycStatus: "In progress",
        kycRedirected: true,
        kycUpdatedAt: new Date().toISOString()
      }
    }));
  };

  const markKycCompleted = () => {
    setState((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        kycStatus: "Submitted",
        kycRedirected: true,
        kycUpdatedAt: new Date().toISOString()
      }
    }));
  };

  const saveRiskProfile = ({ horizon, objective, experience, liquidityNeed }) => {
    const score =
      (experience === "Advanced" ? 3 : experience === "Intermediate" ? 2 : 1) +
      (objective === "Aggressive growth" ? 3 : objective === "Balanced growth" ? 2 : 1) +
      (horizon === "Long term" ? 3 : horizon === "Medium term" ? 2 : 1) +
      (liquidityNeed === "Low" ? 2 : 1);

    setState((prev) => ({
      ...prev,
      riskProfile: {
        level: riskLevelFromScore(score),
        score,
        horizon,
        objective,
        experience,
        liquidityNeed,
        updatedAt: new Date().toISOString()
      }
    }));
  };

  const selectSubscription = (planId) => {
    setState((prev) => ({
      ...prev,
      subscription: {
        ...prev.subscription,
        planId,
        status: "Active",
        renewalDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      }
    }));
  };

  const addPortfolioHolding = ({ symbol, quantity, avgPrice }) => {
    const cleanSymbol = String(symbol || "").trim().toUpperCase();

    if (!cleanSymbol || !quantity || !avgPrice) {
      return;
    }

    setState((prev) => ({
      ...prev,
      portfolio: [
        {
          id: `${Date.now()}`,
          symbol: cleanSymbol,
          quantity: String(quantity),
          avgPrice: String(avgPrice)
        },
        ...prev.portfolio
      ]
    }));
  };

  const removePortfolioHolding = (id) => {
    setState((prev) => ({
      ...prev,
      portfolio: prev.portfolio.filter((item) => item.id !== id)
    }));
  };

  const addAlertRule = ({ title, channel, trigger }) => {
    if (!title || !channel || !trigger) {
      return;
    }

    setState((prev) => ({
      ...prev,
      alerts: [
        {
          id: `${Date.now()}`,
          title,
          channel,
          trigger,
          status: "Enabled"
        },
        ...prev.alerts
      ]
    }));
  };

  const toggleAlertRule = (id) => {
    setState((prev) => ({
      ...prev,
      alerts: prev.alerts.map((item) =>
        item.id === id
          ? { ...item, status: item.status === "Enabled" ? "Paused" : "Enabled" }
          : item
      )
    }));
  };

  const removeAlertRule = (id) => {
    setState((prev) => ({
      ...prev,
      alerts: prev.alerts.filter((item) => item.id !== id)
    }));
  };

  const selectedPlan = PLAN_CATALOG.find((item) => item.id === state.subscription.planId) || PLAN_CATALOG[0];

  const value = useMemo(
    () => ({
      isHydrating,
      planCatalog: PLAN_CATALOG,
      selectedPlan,
      profile: state.profile,
      riskProfile: state.riskProfile,
      subscription: state.subscription,
      portfolio: state.portfolio,
      alerts: state.alerts,
      updateProfile,
      markKycRedirected,
      markKycCompleted,
      saveRiskProfile,
      selectSubscription,
      addPortfolioHolding,
      removePortfolioHolding,
      addAlertRule,
      toggleAlertRule,
      removeAlertRule
    }),
    [isHydrating, selectedPlan, state]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};

export const useAppData = () => {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error("useAppData must be used within AppDataProvider");
  }

  return context;
};
