import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const ADMIN_AUTH_KEY = "kv_admin_auth";
const ADMIN_PASSWORD = "kwanza2025admin";

interface AdminContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AdminContext = createContext<AdminContextValue>({
  isAuthenticated: false,
  isLoading: true,
  login: async () => false,
  logout: async () => {},
});

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(ADMIN_AUTH_KEY).then((value) => {
      setIsAuthenticated(value === "true");
      setIsLoading(false);
    });
  }, []);

  const login = useCallback(async (password: string): Promise<boolean> => {
    if (password === ADMIN_PASSWORD) {
      await AsyncStorage.setItem(ADMIN_AUTH_KEY, "true");
      setIsAuthenticated(true);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(ADMIN_AUTH_KEY);
    setIsAuthenticated(false);
  }, []);

  return (
    <AdminContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}
