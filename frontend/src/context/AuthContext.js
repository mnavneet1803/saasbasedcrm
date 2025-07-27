import React, { createContext, useContext, useState, useEffect } from "react";
import { getToken, setToken, removeToken } from "../utils/auth";

function parseJwt(token) {
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const updateUserFromToken = () => {
    const token = getToken();
    if (token) {
      const payload = parseJwt(token);
      if (payload) {
        setUser(payload);
        setLoading(false);
        return;
      }
    }
    setUser(null);
    setLoading(false);
  };

  useEffect(() => {
    updateUserFromToken();
    window.addEventListener("storage", updateUserFromToken);
    return () => window.removeEventListener("storage", updateUserFromToken);
  }, []);

  const login = (token) => {
    setToken(token);
    updateUserFromToken();
  };

  const logout = () => {
    removeToken();
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUserFromToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 