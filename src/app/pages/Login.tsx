import { useState } from "react";
import { useNavigate } from "react-router";
import { useApp } from "../store/AppContext";
import { useShopUser } from "../store/ShopUserContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Store, Lock, Mail, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const { login } = useApp();
  const { currentShopUser, allShopUsers, loginShopUser } = useShopUser();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedShop, setSelectedShop] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // اگر هیچ shop owner لاگین نکرده، ابتدا باید دوکان انتخاب شود
    if (!currentShopUser && allShopUsers.length > 0) {
      toast.error("لطفاً ابتدا دوکان خود را از لیست بالا انتخاب کنید");
      return;
    }

    if (!email || !password) {
      toast.error("لطفاً ایمیل و رمز عبور را وارد کنید");
      return;
    }

    const success = login(email, password);
    if (success) {
      toast.success("ورود موفقیت‌آمیز بود!");
      navigate("/");
    } else {
      toast.error("ایمیل یا رمز عبور اشتباه است یا حساب غیرفعال است");
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Card */}
        <div className="bg-white rounded-t-2xl p-8 text-center border-b-2 border-blue-500">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Store className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-gray-800 text-2xl mb-1 font-bold">
            {currentShopUser ? currentShopUser.shop_name : "سیستم مدیریت دوکانداری"}
          </h1>
          <p className="text-gray-500 text-sm">ورود کاربر</p>
          {currentShopUser && (
            <p className="text-gray-400 text-xs mt-1">دوکان: {currentShopUser.name}</p>
          )}
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-b-2xl p-8 shadow-xl">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* انتخاب دوکان - فقط اگر shop owner لاگین نکرده */}
            {!currentShopUser && allShopUsers.length > 0 && (
              <div className="space-y-2">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-3">
                  <p className="text-blue-800 text-sm">
                    <strong>مرحله ۱:</strong> ابتدا دوکان خود را انتخاب کنید
                  </p>
                </div>
                <Label htmlFor="shop" className="text-gray-700">
                  انتخاب دوکان *
                </Label>
                <select
                  id="shop"
                  value={selectedShop}
                  onChange={(e) => {
                    const shopId = e.target.value;
                    setSelectedShop(shopId);
                    // خودکار به دوکان انتخاب شده لاگین می‌کنیم
                    const shop = allShopUsers.find(s => s.shop_user_id === shopId);
                    if (shop) {
                      loginShopUser(shop.email, shop.password);
                      toast.success(`متصل به دوکان: ${shop.shop_name}`);
                    }
                  }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white"
                >
                  <option value="">-- دوکان خود را انتخاب کنید --</option>
                  {allShopUsers.map(shop => (
                    <option key={shop.shop_user_id} value={shop.shop_user_id}>
                      {shop.shop_name} ({shop.name})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {currentShopUser && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3">
                <p className="text-green-800 text-sm">
                  ✓ متصل به دوکان: <strong>{currentShopUser.shop_name}</strong>
                </p>
                <p className="text-green-700 text-xs mt-1">
                  حالا ایمیل و رمز عبور کاربری خود را وارد کنید
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">
                ایمیل کاربر
              </Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pr-10"
                  placeholder="ایمیل خود را وارد کنید"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">
                رمز عبور
              </Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 pl-10"
                  placeholder="رمز عبور خود را وارد کنید"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 h-11">
              ورود به سیستم
            </Button>
          </form>

          {/* Back to Shop Login */}
          <div className="mt-6 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">یا</span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/shop-login")}
              className="w-full mt-4"
            >
              <ArrowLeft className="w-4 h-4 ml-2" />
              بازگشت به ورود دوکان
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
