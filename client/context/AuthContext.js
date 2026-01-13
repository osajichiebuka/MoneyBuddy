import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { saveSession, getSession, deleteSession } from '../services/storage';
import { AUTH_API_URL } from '../constants/Api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Use the dynamic URL from constants/Api.ts
  const API_URL = AUTH_API_URL;

  useEffect(() => {
    loadStorageData();
  }, []);

  async function loadStorageData() {
    try {
      const savedSession = await getSession();
      if (savedSession) {
        console.log("💿 LOADED SESSION FROM STORAGE:", savedSession.user?.email);
        setSession(savedSession);
        setUser(savedSession.user);
        axios.defaults.headers.common['Authorization'] = `Bearer ${savedSession.access_token}`;
      } else {
        console.log("⚪ NO SAVED SESSION FOUND");
      }
    } catch (e) {
      console.log('Failed to load session', e);
    } finally {
      setIsLoading(false);
    }
  }

  // 1. SIGNUP FUNCTION
  const signup = async (email, password, fullName) => {
    console.log("🔵 Attempting Signup...");
    console.log(`📡 Sending to: ${API_URL}/signup`);

    try {
      const response = await axios.post(`${API_URL}/signup`, {
        email,
        password,
        full_name: fullName,
      });

      console.log("🟢 SIGNUP SUCCESS:", response.data);

      const { session, user } = response.data;
      if (session) {
        setSession(session);
        setUser(user);
        await saveSession(session);
        axios.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`;
        console.log("✅ Auto-Login Successful!");
      }
      return { success: true };
    } catch (error) {
      console.error("🔴 SIGNUP FAILED:", error.response ? error.response.data : error.message);
      return {
        success: false,
        msg: error.response?.data?.error || error.message
      };
    }
  };

  // 2. LOGIN FUNCTION
  const login = async (email, password) => {
    console.log("🔵 Attempting Login...");
    console.log(`📡 Sending to: ${API_URL}/login`);

    try {
      const response = await axios.post(`${API_URL}/login`, {
        email,
        password,
      });

      console.log("🟢 LOGIN SUCCESS:", response.data);

      const { session, user } = response.data;
      if (session) {
        setSession(session);
        setUser(user);
        await saveSession(session);
        axios.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`;
        console.log("✅ Session Set! Redirect should trigger now.");
      } else {
        console.warn("⚠️ Server replied 200, but no session found in data:", response.data);
      }
      return { success: true };
    } catch (error) {
      console.error("🔴 LOGIN FAILED:", error.response ? error.response.data : error.message);
      return {
        success: false,
        msg: error.response?.data?.error || error.message
      };
    }
  };

  const logout = async () => {
    console.log("👋 Logging out...");
    await deleteSession();
    setSession(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};