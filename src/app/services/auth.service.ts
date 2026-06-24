import { api } from "./apiClient";
import type { User } from "../store/AppContext";

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: Pick<User, "user_id" | "username" | "full_name" | "role" | "permissions">;
}

interface ShopLoginResponse {
  accessToken: string;
  refreshToken: string;
  shopUser: { id: string; name: string; email: string; shopName: string };
}

export const authService = {
  login: async (email: string, password: string, shopId: string): Promise<LoginResponse> => {
    const res = await api.post<LoginResponse>("/auth/login", { email, password, shopId });
    api.setTokens(res.accessToken, res.refreshToken);
    return res;
  },

  shopLogin: async (email: string, password: string): Promise<ShopLoginResponse> => {
    const res = await api.post<ShopLoginResponse>("/shop-auth/login", { email, password });
    api.setTokens(res.accessToken, res.refreshToken);
    return res;
  },

  logout: async () => {
    try { await api.post("/auth/logout", {}); } catch { /* ignore */ }
    api.clearTokens();
  },
};
