import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api, { setAuthHeader } from "../api/client";

const AuthContext = createContext(null);

const TOKEN_KEY = "factoresearch_token";

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const persistSession = async (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    setAuthHeader(newToken);
    await AsyncStorage.setItem(TOKEN_KEY, newToken);
  };

  const clearSession = async () => {
    setToken(null);
    setUser(null);
    setAuthHeader(null);
    await AsyncStorage.removeItem(TOKEN_KEY);
  };

  const fetchMe = async () => {
    const { data } = await api.get("/auth/me");
    setUser(data.user);
    return data.user;
  };

  const login = async ({ email, password }) => {
    const { data } = await api.post("/auth/login", { email, password });
    await persistSession(data.token, data.user);
    return data;
  };

  const register = async ({ username, email, phone, password }) => {
    const { data } = await api.post("/auth/register", {
      username,
      email,
      phone,
      password
    });
    await persistSession(data.token, data.user);
    return data;
  };

  const logout = async () => {
    await clearSession();
  };

  const forgotPassword = async (email) => {
    const { data } = await api.post("/auth/forgot-password", { email });
    return data;
  };

  const verifyOtp = async ({ email, otp }) => {
    const { data } = await api.post("/auth/verify-otp", { email, otp });
    return data;
  };

  const resetPassword = async ({ email, otp, newPassword }) => {
    const { data } = await api.post("/auth/reset-password", { email, otp, newPassword });
    return data;
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const savedToken = await AsyncStorage.getItem(TOKEN_KEY);

        if (!savedToken) {
          setIsLoading(false);
          return;
        }

        setAuthHeader(savedToken);
        setToken(savedToken);
        await fetchMe();
      } catch (error) {
        await clearSession();
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      isLoading,
      login,
      register,
      logout,
      fetchMe,
      forgotPassword,
      verifyOtp,
      resetPassword
    }),
    [token, user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
