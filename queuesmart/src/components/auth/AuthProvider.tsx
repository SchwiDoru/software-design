import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getCurrentAuthenticatedUser,
  getDefaultRouteForRole,
  loginPatient,
  loginStaff,
  logoutUser,
  registerPatient,
  type LoginRequest,
  type RegisterRequest
} from "../../services/auth";
import type { User } from "../../types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  loginAsPatient: (payload: LoginRequest) => Promise<User>;
  loginAsStaff: (payload: LoginRequest) => Promise<User>;
  registerAsPatient: (payload: RegisterRequest) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    const nextUser = await getCurrentAuthenticatedUser();
    setUser(nextUser);
    return nextUser;
  };

  useEffect(() => {
    let isCancelled = false;

    const loadSession = async () => {
      try {
        const nextUser = await getCurrentAuthenticatedUser();
        if (!isCancelled) {
          setUser(nextUser);
        }
      } catch (error) {
        console.warn("Failed to restore authenticated session", error);
        if (!isCancelled) {
          setUser(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadSession();

    return () => {
      isCancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isLoading,
    loginAsPatient: async (payload) => {
      const response = await loginPatient(payload);
      setUser(response.user);
      return response.user;
    },
    loginAsStaff: async (payload) => {
      const response = await loginStaff(payload);
      setUser(response.user);
      return response.user;
    },
    registerAsPatient: async (payload) => {
      const response = await registerPatient(payload);
      setUser(response.user);
      return response.user;
    },
    logout: async () => {
      try {
        await logoutUser();
      } finally {
        setUser(null);
      }
    },
    refreshUser
  }), [isLoading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}

export { getDefaultRouteForRole };
