// src/auth/AuthContext.jsx
import { createContext, useContext, useState } from "react";

const AuthCtx = createContext(null);

/**
 * In-memory auth only:
 * - No localStorage/sessionStorage
 * - No auto-hydration on page load
 * => User must log in every time the app loads/refocuses.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // e.g. { id, name, role, token }

  function login(payload) {
    // payload could be { id, name, token, ... }
    setUser(payload || null);
  }

  function logout() {
    setUser(null);
  }

  return (
    <AuthCtx.Provider value={{ user, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}
