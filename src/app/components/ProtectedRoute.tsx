import { Navigate } from "react-router";
import { useShopUser } from "../store/ShopUserContext";
import { useApp } from "../store/AppContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentShopUser } = useShopUser();
  const { currentUser } = useApp();

  // اگر کاربر داخلی (inner user) لاگین کرده باشد، اجازه دسترسی
  if (currentUser && currentShopUser) {
    return <>{children}</>;
  }

  // اگر فقط shop owner لاگین کرده باشد (بدون inner user)، اجازه دسترسی
  if (currentShopUser && !currentUser) {
    return <>{children}</>;
  }

  // اگر هیچکدام لاگین نکرده‌اند، به shop-login هدایت شود
  return <Navigate to="/shop-login" replace />;
}
