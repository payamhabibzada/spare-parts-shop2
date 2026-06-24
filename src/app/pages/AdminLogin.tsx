import { useState } from "react";
import { useNavigate } from "react-router";
import { useApp } from "../store/AppContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Shield, Lock, User, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

// Super admin credentials loaded from environment variables.
// Set VITE_ADMIN_USERNAME and VITE_ADMIN_PASSWORD in your .env file.
// In production, replace this with a real backend authentication call.
const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME ?? "superadmin";
const ADMIN_PASSWORD_HASH = import.meta.env.VITE_ADMIN_PASSWORD_HASH ?? "";

export default function AdminLogin() {
  const { language } = useApp();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      toast.error(language === "fa" ? "نام کاربری و رمز عبور را وارد کنید" : "Enter username and password");
      return;
    }

    // In production: replace this with a POST /api/admin/login call that compares bcrypt hashes server-side.
    // For now we compare against env-provided credentials (fallback allows local dev without .env).
    const fallbackMatch = !ADMIN_PASSWORD_HASH && username === "superadmin" && password === "admin@2026";
    const envMatch = ADMIN_PASSWORD_HASH && username === ADMIN_USERNAME && password === ADMIN_PASSWORD_HASH;
    if (fallbackMatch || envMatch) {
      // Store admin session
      sessionStorage.setItem("admin_authenticated", "true");
      toast.success(language === "fa" ? "ورود موفقیت‌آمیز به پنل مدیریت" : "Successfully logged in to admin panel");
      navigate("/admin-panel");
    } else {
      toast.error(language === "fa" ? "نام کاربری یا رمز عبور اشتباه است" : "Invalid username or password");
    }
  };

  return (
    <div dir={language === "fa" ? "rtl" : "ltr"} className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Card */}
        <div className="bg-white rounded-t-2xl p-8 text-center border-b-2 border-purple-500">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-gray-800 text-2xl mb-1" style={{ fontWeight: 700 }}>
            {language === "fa" ? "پنل مدیریت سوپر ادمین" : "Super Admin Panel"}
          </h1>
          <p className="text-gray-500 text-sm">
            {language === "fa" ? "ورود به سیستم مدیریت" : "Admin System Login"}
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-b-2xl p-8 shadow-xl">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700">
                {language === "fa" ? "نام کاربری" : "Username"}
              </Label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pr-10"
                  placeholder={language === "fa" ? "نام کاربری" : "Username"}
                  autoComplete="username"
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
                  placeholder={language === "fa" ? "رمز عبور" : "Password"}
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

            <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 h-11">
              {language === "fa" ? "ورود به پنل مدیریت" : "Login to Admin Panel"}
            </Button>
          </form>

          {/* Shop Login Link */}
          <div className="mt-6 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">
                  {language === "fa" ? "یا" : "or"}
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/shop-login")}
              className="w-full mt-4"
            >
              {language === "fa" ? "ورود به دوکان" : "Shop Login"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
