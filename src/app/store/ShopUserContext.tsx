import React, { createContext, useContext, useState, useEffect } from "react";
const API_URL = "https://spare-parts-shop2-yvnf.vercel.app";
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

  const addShopUser = async (user: any) => {
  const response = await fetch(
    "/api/admin/shops",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: user.name,
        email: user.email,
        password: user.password,
        phone: user.phone,
        shopName: user.shop_name,
        isActive: user.is_active,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed");
  }

  const newShop = await response.json();

  setAllShopUsers(prev => [
    ...prev,
    {
      shop_user_id: newShop.id,
      name: newShop.name,
      email: newShop.email,
      phone: user.phone,
      shop_name: newShop.shopName,
      created_date: new Date().toISOString(),
      is_active: newShop.isActive,
    },
  ]);
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

  const loginShopUser = async (
  email: string,
  password: string
): Promise<boolean> => {

  const response = await fetch(
    "/api/shop-auth/login",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    }
  );

  if (!response.ok) {
    return false;
  }

  const data = await response.json();

  localStorage.setItem(
    "accessToken",
    data.accessToken
  );

  setCurrentShopUser({
    shop_user_id: data.shopUser.id,
    name: data.shopUser.name,
    email: data.shopUser.email,
    password: "",
    phone: "",
    shop_name: data.shopUser.shopName,
    created_date: "",
    is_active: true,
  });

  return true;
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
