import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  CreditCard,
  Store,
  Menu,
  X,
  Tags,
  TrendingDown,
  ArrowDownToLine,
  UserCog,
  LogOut,
  Globe,
  DollarSign,
  Banknote,
  Building2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useApp } from "../store/AppContext";
import { useShopUser } from "../store/ShopUserContext";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";

const navItems = [
  { to: "/", label: "داشبورد", labelPs: "ډشبورډ", labelEn: "Dashboard", icon: LayoutDashboard, permission: "dashboard" },
  { to: "/products", label: "اجناس", labelPs: "توکي", labelEn: "Products", icon: Package, permission: "products" },
  { to: "/categories", label: "دسته‌بندی", labelPs: "کټګورۍ", labelEn: "Categories", icon: Tags, permission: "categories" },
  { to: "/customers", label: "مشتریان", labelPs: "پیرودونکي", labelEn: "Customers", icon: Users, permission: "customers" },
  { to: "/sales", label: "فروش", labelPs: "پلور", labelEn: "Sales", icon: ShoppingCart, permission: "sales" },
  { to: "/debts", label: "قرضه‌ها", labelPs: "پورونه", labelEn: "Debts", icon: DollarSign, permission: "debts" },
  { to: "/expenses", label: "مصارف", labelPs: "لګښتونه", labelEn: "Expenses", icon: TrendingDown, permission: "expenses" },
  { to: "/withdrawals", label: "برداشت‌ها", labelPs: "وباسنې", labelEn: "Withdrawals", icon: ArrowDownToLine, permission: "withdrawals" },
  { to: "/shareholders", label: "سهام‌داران", labelPs: "ونډه لرونکي", labelEn: "Shareholders", icon: Banknote, permission: "shareholders" },
  { to: "/suppliers", label: "سپلایرها", labelPs: "عرضه کوونکي", labelEn: "Suppliers", icon: Building2, permission: "suppliers" },
  { to: "/users", label: "کاربران", labelPs: "کاروونکي", labelEn: "Users", icon: UserCog, permission: "users", adminOnly: true },
];

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const {
    currentUser,
    logout,
    language,
    setLanguage,
    currency,
    setCurrency,
  } = useApp();
  const { currentShopUser, logoutShopUser, allShopUsers } = useShopUser();

  // Real-time status check - if user is deactivated, logout immediately
  useEffect(() => {
    if (!currentShopUser) return;

    const checkUserStatus = () => {
      const currentUserInDb = allShopUsers.find(u => u.shop_user_id === currentShopUser.shop_user_id);

      if (!currentUserInDb || !currentUserInDb.is_active) {
        logoutShopUser();
        logout();
        toast.error(
          language === "fa"
            ? "حساب شما توسط مدیر غیرفعال شده است"
            : "Your account has been deactivated by admin",
        );
        navigate("/shop-login");
      }
    };

    // Check immediately
    checkUserStatus();

    // Check every 3 seconds
    const interval = setInterval(checkUserStatus, 3000);

    return () => clearInterval(interval);
  }, [currentShopUser, allShopUsers, logoutShopUser, logout, navigate, language]);

  const getPageTitle = () => {
    const path = location.pathname;
    if (language === "fa") {
      if (path === "/") return "داشبورد";
      if (path.startsWith("/products")) return "مدیریت اجناس";
      if (path.startsWith("/categories")) return "مدیریت دسته‌بندی";
      if (path.startsWith("/customers")) return "مدیریت مشتریان";
      if (path.startsWith("/sales")) return "فروش و فاکتورها";
      if (path.startsWith("/debts")) return "مدیریت قرضه‌ها";
      if (path.startsWith("/customer-profile")) return "پروفایل مشتری";
      if (path.startsWith("/expenses")) return "مدیریت مصارف";
      if (path.startsWith("/withdrawals")) return "مدیریت برداشت‌ها";
      if (path.startsWith("/shareholders")) return "مدیریت سهام‌داران";
      if (path.startsWith("/shareholder-profile")) return "پروفایل سهام‌دار";
      if (path.startsWith("/suppliers")) return "مدیریت سپلایرها";
      if (path.startsWith("/supplier-profile")) return "پروفایل سپلایر";
      if (path.startsWith("/users")) return "مدیریت کاربران";
      return "دوکانداری";
    } else if (language === "ps") {
      if (path === "/") return "ډشبورډ";
      if (path.startsWith("/products")) return "د توکو مدیریت";
      if (path.startsWith("/categories")) return "د کټګورۍ مدیریت";
      if (path.startsWith("/customers")) return "د پیرودونکو مدیریت";
      if (path.startsWith("/sales")) return "پلور او فاکتورونه";
      if (path.startsWith("/debts")) return "د پورونو مدیریت";
      if (path.startsWith("/customer-profile")) return "د پیرودونکي پروفایل";
      if (path.startsWith("/expenses")) return "د لګښتونو مدیریت";
      if (path.startsWith("/withdrawals")) return "د وباسنو مدیریت";
      if (path.startsWith("/shareholders")) return "د ونډه لرونکو مدیریت";
      if (path.startsWith("/shareholder-profile")) return "د ونډه لرونکي پروفایل";
      if (path.startsWith("/suppliers")) return "د عرضه کوونکو مدیریت";
      if (path.startsWith("/supplier-profile")) return "د عرضه کوونکي پروفایل";
      if (path.startsWith("/users")) return "د کاروونکو مدیریت";
      return "د دوکان مدیریت";
    } else {
      if (path === "/") return "Dashboard";
      if (path.startsWith("/products")) return "Products Management";
      if (path.startsWith("/categories")) return "Categories Management";
      if (path.startsWith("/customers")) return "Customers Management";
      if (path.startsWith("/sales")) return "Sales & Invoices";
      if (path.startsWith("/debts")) return "Debts Management";
      if (path.startsWith("/customer-profile")) return "Customer Profile";
      if (path.startsWith("/expenses")) return "Expenses Management";
      if (path.startsWith("/withdrawals")) return "Withdrawals Management";
      if (path.startsWith("/shareholders")) return "Shareholders Management";
      if (path.startsWith("/shareholder-profile")) return "Shareholder Profile";
      if (path.startsWith("/suppliers")) return "Suppliers Management";
      if (path.startsWith("/supplier-profile")) return "Supplier Profile";
      if (path.startsWith("/users")) return "Users Management";
      return "Shop Management";
    }
  };

  const handleLogout = () => {
    logoutShopUser();
    logout();
    toast.success(
      language === "fa"
        ? "با موفقیت خارج شدید"
        : "Logged out successfully",
    );
    navigate("/shop-login");
  };

  // Shop owner (currentShopUser set, no inner currentUser) = super admin of their shop
  const shopOwnerMode = !currentUser && !!currentShopUser;

  const filteredNavItems = navItems.filter((item) => {
    if (item.adminOnly && currentUser?.role !== "super_admin" && !shopOwnerMode) return false;
    if (!currentUser) return true; // shop owner or unauthenticated inner user = see everything
    const perms = currentUser.permissions ?? [];
    if (perms.includes("*")) return true;
    if (item.permission && !perms.includes(item.permission)) return false;
    return true;
  });

  return (
    <div
      dir="rtl"
      className="flex h-screen bg-gray-50 overflow-hidden"
    >
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 h-full w-64 bg-white border-l border-gray-200 z-30 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${
          sidebarOpen
            ? "translate-x-0"
            : "translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-200">
          <div className="w-12 h-12 bg-white border-2 border-blue-200 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg viewBox="0 0 300 300" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="dbGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{stopColor: "#3B82F6", stopOpacity: 1}} />
                  <stop offset="100%" style={{stopColor: "#1D4ED8", stopOpacity: 1}} />
                </linearGradient>
              </defs>
              <ellipse cx="150" cy="80" rx="70" ry="20" fill="url(#dbGradient2)"/>
              <path d="M 80 80 L 80 180 Q 80 200 100 200 L 200 200 Q 220 200 220 180 L 220 80" fill="url(#dbGradient2)"/>
              <ellipse cx="150" cy="120" rx="70" ry="5" fill="#fff" opacity="0.4"/>
              <ellipse cx="150" cy="160" rx="70" ry="5" fill="#fff" opacity="0.4"/>
              <circle cx="248" cy="108" r="5" fill="#3B82F6"/>
              <circle cx="258" cy="120" r="4" fill="#3B82F6"/>
              <circle cx="264" cy="133" r="4" fill="#3B82F6"/>
              <rect x="237" y="143" width="8" height="8" rx="1" fill="#3B82F6"/>
              <rect x="249" y="148" width="6" height="6" rx="1" fill="#60A5FA"/>
              <rect x="259" y="153" width="5" height="5" rx="1" fill="#93C5FD"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h1
              className="text-gray-800 text-sm truncate"
              style={{ fontWeight: 700 }}
            >
              {currentShopUser?.shop_name || "سیستم دوکانداری"}
            </h1>
            <p className="text-gray-400 text-xs truncate">
              {currentShopUser?.name || "مدیریت کامل"}
            </p>
          </div>
          <button
            className="text-gray-400 hover:text-gray-600 lg:hidden flex-shrink-0"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav
          className="px-3 py-4 space-y-1 overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 200px)" }}
        >
          {filteredNavItems.map(
            ({ to, label, labelPs, labelEn, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                    isActive
                      ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  }`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span style={{ fontWeight: 500 }}>
                  {language === "fa" ? label : language === "ps" ? labelPs : labelEn}
                </span>
              </NavLink>
            ),
          )}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 px-5 py-4 border-t border-gray-200">
          <p className="text-gray-400 text-xs text-center">
            نسخه ۱.۰.۱
          </p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center gap-4 flex-shrink-0">
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <h2
            className="text-gray-800 flex-1"
            style={{ fontWeight: 600 }}
          >
            {getPageTitle()}
          </h2>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <DropdownMenu
              dir={language === "fa" || language === "ps" ? "rtl" : "ltr"}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {language === "fa" ? "دری" : language === "ps" ? "پښتو" : "English"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align={language === "fa" || language === "ps" ? "end" : "start"}
              >
                <DropdownMenuItem
                  onClick={() => setLanguage("fa")}
                >
                  دری {language === "fa" && "✓"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLanguage("ps")}
                >
                  پښتو {language === "ps" && "✓"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLanguage("en")}
                >
                  English {language === "en" && "✓"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Currency Switcher */}
            <DropdownMenu
              dir={language === "fa" ? "rtl" : "ltr"}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {currency}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align={language === "fa" ? "end" : "start"}
              >
                <DropdownMenuItem
                  onClick={() => setCurrency("AFN")}
                >
                  افغانی (AFN) {currency === "AFN" && "✓"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setCurrency("USD")}
                >
                  دالر (USD) {currency === "USD" && "✓"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu
              dir={language === "fa" ? "rtl" : "ltr"}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {currentShopUser?.name || currentUser?.full_name}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align={language === "fa" ? "end" : "start"}
              >
                <div className="px-2 py-1.5 text-sm text-gray-500">
                  {currentShopUser?.email || currentUser?.username}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600"
                >
                  <LogOut className="w-4 h-4 ml-2" />
                  {language === "fa" ? "خروج" : "Logout"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}