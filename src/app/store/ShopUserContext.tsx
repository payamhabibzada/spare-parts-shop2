import React, { createContext, useContext, useState, useEffect } from "react";

// ShopUser represents a shop owner/tenant with their own database
export interface ShopUser {
  shop_user_id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  shop_name: string;
  created_date: string;
  is_active: boolean;
}

interface ShopUserContextType {
  // Current logged in shop user
  currentShopUser: ShopUser | null;

  // Admin functions (for super admin only)
  allShopUsers: ShopUser[];
  addShopUser: (user: Omit<ShopUser, "shop_user_id" | "created_date">) => void;
  updateShopUser: (user: ShopUser) => void;
  deleteShopUser: (id: string) => void;

  // Authentication
  loginShopUser: (email: string, password: string) => boolean;
  logoutShopUser: () => void;

  // Database namespace for current user
  getDbPrefix: () => string;
}

const ShopUserContext = createContext<ShopUserContextType | null>(null);

// Initial shop users (admin can add more)
const initialShopUsers: ShopUser[] = [];

function loadFromGlobalStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(`global_${key}`);
    if (stored) return JSON.parse(stored);
  } catch {}
  return fallback;
}

export function ShopUserProvider({ children }: { children: React.ReactNode }) {
  const [allShopUsers, setAllShopUsers] = useState<ShopUser[]>(() =>
    loadFromGlobalStorage("shop_users", initialShopUsers)
  );

  const [currentShopUser, setCurrentShopUser] = useState<ShopUser | null>(() =>
    loadFromGlobalStorage("current_shop_user", null)
  );

  // Save to global storage
  useEffect(() => {
    localStorage.setItem("global_shop_users", JSON.stringify(allShopUsers));
  }, [allShopUsers]);

  useEffect(() => {
    localStorage.setItem("global_current_shop_user", JSON.stringify(currentShopUser));
  }, [currentShopUser]);

  const genId = () => crypto.randomUUID();

  const addShopUser = (user: Omit<ShopUser, "shop_user_id" | "created_date">) => {
    const newUser: ShopUser = {
      ...user,
      shop_user_id: genId(),
      created_date: new Date().toISOString().split("T")[0],
    };
    setAllShopUsers(prev => [...prev, newUser]);
  };

  const updateShopUser = (user: ShopUser) => {
    setAllShopUsers(prev => prev.map(u => u.shop_user_id === user.shop_user_id ? user : u));
    // If updating current user, update current session
    if (currentShopUser?.shop_user_id === user.shop_user_id) {
      setCurrentShopUser(user);
    }
  };

  const deleteShopUser = (id: string) => {
    setAllShopUsers(prev => prev.filter(u => u.shop_user_id !== id));
    // Clear all data for this shop user
    const dbPrefix = `shop_${id}_`;
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(dbPrefix)) {
        localStorage.removeItem(key);
      }
    });
  };

  const loginShopUser = (email: string, password: string): boolean => {
    const user = allShopUsers.find(u => u.email === email && u.password === password && u.is_active);
    if (user) {
      setCurrentShopUser(user);
      return true;
    }
    return false;
  };

  const logoutShopUser = () => {
    setCurrentShopUser(null);
  };

  // Get database prefix for current shop user
  const getDbPrefix = (): string => {
    if (!currentShopUser) return "demo_";
    return `shop_${currentShopUser.shop_user_id}_`;
  };

  return (
    <ShopUserContext.Provider value={{
      currentShopUser,
      allShopUsers,
      addShopUser,
      updateShopUser,
      deleteShopUser,
      loginShopUser,
      logoutShopUser,
      getDbPrefix,
    }}>
      {children}
    </ShopUserContext.Provider>
  );
}

export function useShopUser() {
  const ctx = useContext(ShopUserContext);
  if (!ctx) throw new Error("useShopUser must be used within ShopUserProvider");
  return ctx;
}
