import { useState } from "react";
import { useNavigate } from "react-router";
import { useShopUser } from "../store/ShopUserContext";
import { useApp } from "../store/AppContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Store, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function ShopLogin() {
  const { loginShopUser, allShopUsers } = useShopUser();
  const { language } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error(language === "fa" ? "لطفاً ایمیل و رمز عبور را وارد کنید" : "Please enter your email and password");
      return;
    }

    const success = loginShopUser(email, password);
    if (success) {
      toast.success(language === "fa" ? "ورود موفقیت‌آمیز بود!" : "Login successful!");
      navigate("/");
    } else {
      toast.error(language === "fa" ? "ایمیل یا رمز عبور اشتباه است یا حساب غیرفعال است" : "Invalid email/password or account inactive");
    }
  };

  return (
    <div dir={language === "fa" ? "rtl" : "ltr"} className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Card */}
        <div className="bg-white rounded-t-2xl p-8 text-center border-b-2 border-purple-500">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Store className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-gray-800 text-2xl mb-1" style={{ fontWeight: 700 }}>
            {language === "fa" ? "سیستم مدیریت دوکانداری" : "Shop Management System"}
          </h1>
          <p className="text-gray-500 text-sm">
            {language === "fa" ? "ورود به دوکان" : "Shop Login"}
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-b-2xl p-8 shadow-xl">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">
                {language === "fa" ? "ایمیل" : "Email"}
              </Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pr-10"
                  placeholder={language === "fa" ? "ایمیل خود را وارد کنید" : "Enter your email"}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">
                {language === "fa" ? "رمز عبور" : "Password"}
              </Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 pl-10"
                  placeholder={language === "fa" ? "رمز عبور خود را وارد کنید" : "Enter your password"}
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

            <Button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 h-11">
              {language === "fa" ? "ورود به دوکان" : "Login to Shop"}
              <ArrowRight className="w-4 h-4 mr-2" />
            </Button>
          </form>

          {/* Additional Login Options - Updated */}
          <div className="mt-6 text-center">
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">
                  {language === "fa" ? "سایر گزینه‌های ورود" : "Other Login Options"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/login")}
                className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                {language === "fa" ? "ورود کاربر (ایمیل)" : "User Login (Email)"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin-login")}
                className="w-full text-gray-600 hover:bg-gray-50"
              >
                {language === "fa" ? "ورود به پنل مدیریت" : "Admin Panel Login"}
              </Button>
            </div>
          </div>

          {/* Info */}
          {allShopUsers.length === 0 && (
            null
          )}
        </div>
      </div>
    </div>
  );
}
