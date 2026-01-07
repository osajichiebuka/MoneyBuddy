import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { saveSession, getSession, deleteSession } from '../services/storage';

// Replace with your actual LAN IP or Backend URL
const API_URL = 'http://172.20.10.5:5000/api/auth';

const AuthContext = createContext({
  user: null,
  session: null,
  isLoading: true,
  login: async (email, password) => ({ success: false, msg: 'Auth context not initialized' }),
  signup: async (email, password, fullName) => ({ success: false, msg: 'Auth context not initialized' }),
  logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStorageData();
  }, []);

  async function loadStorageData() {
    try {
      const savedSession = await getSession();
      if (savedSession) {
        setSession(savedSession);
        setUser(savedSession.user);
        // Optional: Validate token with backend here
      }
    } catch (e) {
      console.log('Failed to load session', e);
    } finally {
      setIsLoading(false);
    }
  }

  const signup = async (email, password, fullName) => {
    try {
      const response = await axios.post(`${API_URL}/signup`, {
        email,
        password,
        full_name: fullName,
      });

      const { session, user } = response.data;
      if (session) {
        setSession(session);
        setUser(user);
        await saveSession(session);
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        msg: error.response?.data?.error || error.message
      };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/login`, {
        email,
        password,
      });

      const { session, user } = response.data;
      if (session) {
        setSession(session);
        setUser(user);
        await saveSession(session);
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        msg: error.response?.data?.error || error.message
      };
    }
  };

  const logout = async () => {
    await deleteSession();
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};