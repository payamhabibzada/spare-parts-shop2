import { useState, useMemo } from "react";
import { useApp, User as UserType, ActivityLog } from "../store/AppContext";
import { useShopUser } from "../store/ShopUserContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Switch } from "../components/ui/switch";
import {
  Plus,
  Trash2,
  Edit,
  UserCog,
  Shield,
  Activity,
  Users as UsersIcon,
  CheckSquare,
  Square,
  Filter,
  Search,
  Clock,
  ChevronDown,
  ChevronUp,
  Package,
  Tags,
  User,
  ShoppingCart,
  TrendingDown,
  ArrowDownToLine,
  Banknote,
  Building2,
  LayoutDashboard,
  DollarSign,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

const ALL_PERMISSIONS = [
  { key: "dashboard", fa: "داشبورد", en: "Dashboard", icon: LayoutDashboard },
  { key: "products", fa: "اجناس", en: "Products", icon: Package },
  { key: "categories", fa: "دسته‌بندی", en: "Categories", icon: Tags },
  { key: "customers", fa: "مشتریان", en: "Customers", icon: User },
  { key: "sales", fa: "فروش", en: "Sales", icon: ShoppingCart },
  { key: "debts", fa: "قرضه‌ها", en: "Debts", icon: DollarSign },
  { key: "expenses", fa: "مصارف", en: "Expenses", icon: TrendingDown },
  { key: "withdrawals", fa: "برداشت‌ها", en: "Withdrawals", icon: ArrowDownToLine },
  { key: "shareholders", fa: "سهام‌داران", en: "Shareholders", icon: Banknote },
  { key: "suppliers", fa: "سپلایرها", en: "Suppliers", icon: Building2 },
];

const ENTITY_LABELS: Record<string, { fa: string; en: string; color: string }> = {
  product: { fa: "جنس", en: "Product", color: "bg-blue-100 text-blue-700" },
  customer: { fa: "مشتری", en: "Customer", color: "bg-green-100 text-green-700" },
  sale: { fa: "فروش", en: "Sale", color: "bg-purple-100 text-purple-700" },
  payment: { fa: "پرداخت", en: "Payment", color: "bg-teal-100 text-teal-700" },
  expense: { fa: "مصرف", en: "Expense", color: "bg-orange-100 text-orange-700" },
  withdrawal: { fa: "برداشت", en: "Withdrawal", color: "bg-red-100 text-red-700" },
  shareholder: { fa: "سهام‌دار", en: "Shareholder", color: "bg-indigo-100 text-indigo-700" },
  user: { fa: "کاربر", en: "User", color: "bg-pink-100 text-pink-700" },
  supplier: { fa: "سپلایر", en: "Supplier", color: "bg-yellow-100 text-yellow-700" },
};

const ACTION_LABELS: Record<string, { fa: string; en: string; color: string }> = {
  add: { fa: "افزودن", en: "Add", color: "bg-green-100 text-green-700" },
  edit: { fa: "ویرایش", en: "Edit", color: "bg-blue-100 text-blue-700" },
  delete: { fa: "حذف", en: "Delete", color: "bg-red-100 text-red-700" },
};

export default function Users() {
  const { users, addUser, updateUser, deleteUser, currentUser, language, activityLogs } = useApp();
  const { currentShopUser } = useShopUser();
  // Shop owner (logged in via shop login, no inner user) = admin of their shop
  const isAdmin = currentUser?.role === "super_admin" || (!currentUser && !!currentShopUser);

  const [activeTab, setActiveTab] = useState<"users" | "activity">("users");

  // User form state
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentEditUser, setCurrentEditUser] = useState<UserType | null>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"super_admin" | "admin" | "user">("user");
  const [isActive, setIsActive] = useState(true);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [permissionsExpanded, setPermissionsExpanded] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Activity log filters
  const [filterUsername, setFilterUsername] = useState("all");
  const [filterAction, setFilterAction] = useState("all");
  const [filterEntity, setFilterEntity] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [searchLog, setSearchLog] = useState("");

  // Only admins (super_admin role OR shop owner) can access this page
  if (!isAdmin) {
    return (
      <div className="bg-white rounded-xl p-8 text-center">
        <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl mb-2 text-gray-800 font-semibold">
          {language === "fa" ? "دسترسی محدود" : "Access Restricted"}
        </h2>
        <p className="text-gray-500">
          {language === "fa"
            ? "فقط سوپر ادمین می‌تواند به این بخش دسترسی داشته باشد"
            : "Only super admins can access this section"}
        </p>
      </div>
    );
  }

  const resetForm = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setFullName("");
    setRole("user");
    setIsActive(true);
    setSelectedPermissions([]);
    setEditMode(false);
    setCurrentEditUser(null);
  };

  const togglePermission = (key: string) => {
    setSelectedPermissions(prev =>
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    );
  };

  const handleSelectAll = () => {
    if (selectedPermissions.length === ALL_PERMISSIONS.length) {
      setSelectedPermissions([]);
    } else {
      setSelectedPermissions(ALL_PERMISSIONS.map(p => p.key));
    }
  };

  const handleSave = () => {
    if (!username.trim() || !email.trim() || !password.trim() || !fullName.trim()) {
      toast.error(language === "fa" ? "تمام فیلدها الزامی هستند" : "All fields are required");
      return;
    }
    if (!editMode && users.some(u => u.email === email)) {
      toast.error(language === "fa" ? "ایمیل قبلاً استفاده شده است" : "Email already exists");
      return;
    }

    const perms = role === "super_admin" ? ["*"] : selectedPermissions;

    if (editMode && currentEditUser) {
      updateUser({
        ...currentEditUser,
        username,
        email,
        password,
        full_name: fullName,
        role,
        is_active: isActive,
        permissions: perms,
      });
      toast.success(language === "fa" ? "کاربر بروزرسانی شد" : "User updated");
    } else {
      addUser({ username, email, password, full_name: fullName, role, is_active: isActive, permissions: perms });
      toast.success(language === "fa" ? "کاربر اضافه شد" : "User added");
    }

    setOpen(false);
    resetForm();
  };

  const handleEdit = (user: UserType) => {
    setCurrentEditUser(user);
    setUsername(user.username);
    setEmail(user.email || "");
    setPassword(user.password);
    setFullName(user.full_name);
    setRole(user.role);
    setIsActive(user.is_active);
    setSelectedPermissions(user.permissions.includes("*") ? ALL_PERMISSIONS.map(p => p.key) : user.permissions);
    setEditMode(true);
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    if (id === currentUser?.user_id) {
      toast.error(language === "fa" ? "نمی‌توانید حساب خود را حذف کنید" : "Cannot delete your own account");
      return;
    }
    if (confirm(language === "fa" ? "آیا مطمئن هستید؟" : "Are you sure?")) {
      deleteUser(id);
      toast.success(language === "fa" ? "کاربر حذف شد" : "User deleted");
    }
  };

  const toggleUserStatus = (user: UserType) => {
    if (user.user_id === currentUser?.user_id) {
      toast.error(language === "fa" ? "نمی‌توانید حساب خود را غیرفعال کنید" : "Cannot deactivate your own account");
      return;
    }
    updateUser({ ...user, is_active: !user.is_active });
    toast.success(
      user.is_active
        ? (language === "fa" ? "کاربر غیرفعال شد" : "User deactivated")
        : (language === "fa" ? "کاربر فعال شد" : "User activated")
    );
  };

  const getRoleBadge = (role: string) => {
    const classes =
      role === "super_admin" ? "bg-purple-100 text-purple-700" :
      role === "admin" ? "bg-blue-100 text-blue-700" :
      "bg-gray-100 text-gray-600";
    const label =
      role === "super_admin" ? (language === "fa" ? "سوپر ادمین" : "Super Admin") :
      role === "admin" ? (language === "fa" ? "ادمین" : "Admin") :
      (language === "fa" ? "کاربر" : "User");
    return <span className={`${classes} px-2.5 py-1 rounded-full text-xs`} className="font-medium">{label}</span>;
  };

  // Filtered activity logs
  const filteredLogs = useMemo(() => {
    return activityLogs.filter(log => {
      if (filterUsername !== "all" && !log.username.toLowerCase().includes(filterUsername.toLowerCase()) && !log.full_name.includes(filterUsername)) return false;
      if (filterAction !== "all" && log.action !== filterAction) return false;
      if (filterEntity !== "all" && log.entity !== filterEntity) return false;
      if (filterDateFrom && log.date < filterDateFrom) return false;
      if (filterDateTo && log.date > filterDateTo) return false;
      if (searchLog && !log.description.includes(searchLog) && !log.entity_name.includes(searchLog)) return false;
      return true;
    });
  }, [activityLogs, filterUsername, filterAction, filterEntity, filterDateFrom, filterDateTo, searchLog]);

  const uniqueEntities = [...new Set(activityLogs.map(l => l.entity))];
  const uniqueUsernames = [...new Set(activityLogs.map(l => l.username))];

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-1 flex gap-1 max-w-xs">
        <button
          onClick={() => setActiveTab("users")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
            activeTab === "users"
              ? "bg-blue-500 text-white shadow-sm"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          }`}
        >
          <UsersIcon className="w-4 h-4" />
          <span className="font-medium">{language === "fa" ? "کاربران" : "Users"}</span>
        </button>
        <button
          onClick={() => setActiveTab("activity")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
            activeTab === "activity"
              ? "bg-blue-500 text-white shadow-sm"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span className="font-medium">{language === "fa" ? "لاگ فعالیت" : "Activity Log"}</span>
          {activityLogs.length > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === "activity" ? "bg-white/20" : "bg-gray-200 text-gray-600"}`}>
              {activityLogs.length}
            </span>
          )}
        </button>
      </div>

      {/* ===== USERS TAB ===== */}
      {activeTab === "users" && (
        <>
          {/* Header row */}
          <div className="flex flex-wrap items-center gap-3">
            <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                  <Plus className="w-4 h-4 ml-2" />
                  {language === "fa" ? "افزودن کاربر" : "Add User"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir={language === "fa" ? "rtl" : "ltr"} aria-describedby={undefined}>
                <DialogHeader>
                  <DialogTitle>
                    {editMode
                      ? (language === "fa" ? "ویرایش کاربر" : "Edit User")
                      : (language === "fa" ? "افزودن کاربر جدید" : "Add New User")}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>{language === "fa" ? "نام کاربری" : "Username"}</Label>
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={language === "fa" ? "نام کاربری" : "Username"}
                      disabled={editMode}
                    />
                  </div>
                  <div>
                    <Label>{language === "fa" ? "ایمیل" : "Email"} *</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={language === "fa" ? "ایمیل" : "Email"}
                      disabled={editMode}
                    />
                  </div>
                  <div>
                    <Label>{language === "fa" ? "رمز عبور" : "Password"}</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={language === "fa" ? "رمز عبور" : "Password"}
                        className="pl-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => !prev)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label>{language === "fa" ? "نام کامل" : "Full Name"}</Label>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={language === "fa" ? "نام کامل" : "Full name"}
                    />
                  </div>
                  <div>
                    <Label>{language === "fa" ? "نقش" : "Role"}</Label>
                    <Select value={role} onValueChange={(v) => {
                      setRole(v as "super_admin" | "admin" | "user");
                      if (v === "super_admin") setSelectedPermissions(ALL_PERMISSIONS.map(p => p.key));
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="super_admin">{language === "fa" ? "سوپر ادمین" : "Super Admin"}</SelectItem>
                        <SelectItem value="admin">{language === "fa" ? "ادمین" : "Admin"}</SelectItem>
                        <SelectItem value="user">{language === "fa" ? "کاربر" : "User"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>{language === "fa" ? "کاربر فعال باشد" : "User is active"}</Label>
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                  </div>

                  {/* Permissions section */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setPermissionsExpanded(prev => !prev)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-gray-700 font-semibold">
                          {language === "fa" ? "سطح دسترسی" : "Permissions"}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({selectedPermissions.length}/{ALL_PERMISSIONS.length})
                        </span>
                      </div>
                      {permissionsExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>

                    {permissionsExpanded && (
                      <div className="p-4 space-y-2">
                        {role === "super_admin" ? (
                          <p className="text-sm text-purple-600 text-center py-2">
                            {language === "fa" ? "سوپر ادمین به همه بخش‌ها دسترسی کامل دارد" : "Super Admin has full access to all sections"}
                          </p>
                        ) : (
                          <>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs text-gray-500">
                                {language === "fa" ? "انتخاب بخش‌های قابل دسترسی" : "Select accessible sections"}
                              </span>
                              <button
                                type="button"
                                onClick={handleSelectAll}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                              >
                                {selectedPermissions.length === ALL_PERMISSIONS.length
                                  ? (language === "fa" ? "لغو همه" : "Deselect All")
                                  : (language === "fa" ? "انتخاب همه" : "Select All")}
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {ALL_PERMISSIONS.map(perm => {
                                const PermIcon = perm.icon;
                                const checked = selectedPermissions.includes(perm.key);
                                return (
                                  <button
                                    key={perm.key}
                                    type="button"
                                    onClick={() => togglePermission(perm.key)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-right ${
                                      checked
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-gray-200 bg-white hover:border-gray-300"
                                    }`}
                                  >
                                    {checked
                                      ? <CheckSquare className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                      : <Square className="w-4 h-4 text-gray-300 flex-shrink-0" />}
                                    <PermIcon className={`w-3.5 h-3.5 flex-shrink-0 ${checked ? "text-blue-500" : "text-gray-400"}`} />
                                    <span className={`text-xs flex-1 ${checked ? "text-blue-700 font-semibold" : "text-gray-600 font-normal"}`}>
                                      {language === "fa" ? perm.fa : perm.en}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <Button onClick={handleSave} className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                    {editMode
                      ? (language === "fa" ? "بروزرسانی" : "Update")
                      : (language === "fa" ? "افزودن" : "Add")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <UserCog className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">{language === "fa" ? "کل کاربران" : "Total Users"}</p>
                  <p className="text-2xl text-gray-800 font-bold">{users.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <UserCog className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">{language === "fa" ? "کاربران فعال" : "Active Users"}</p>
                  <p className="text-2xl text-gray-800 font-bold">{users.filter(u => u.is_active).length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">{language === "fa" ? "ادمین‌ها" : "Admins"}</p>
                  <p className="text-2xl text-gray-800 font-bold">
                    {users.filter(u => u.role === "super_admin" || u.role === "admin").length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-right">{language === "fa" ? "نام کامل" : "Full Name"}</TableHead>
                  <TableHead className="text-right">{language === "fa" ? "ایمیل" : "Email"}</TableHead>
                  <TableHead className="text-right">{language === "fa" ? "نقش" : "Role"}</TableHead>
                  <TableHead className="text-right">{language === "fa" ? "دسترسی‌ها" : "Permissions"}</TableHead>
                  <TableHead className="text-right">{language === "fa" ? "وضعیت" : "Status"}</TableHead>
                  <TableHead className="text-right">{language === "fa" ? "عملیات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.user_id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell className="font-mono text-sm text-gray-600">{user.email || user.username}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      {user.permissions.includes("*") ? (
                        <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full font-medium">
                          {language === "fa" ? "دسترسی کامل" : "Full Access"}
                        </span>
                      ) : user.permissions.length === 0 ? (
                        <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded-full font-medium">
                          {language === "fa" ? "بدون دسترسی" : "No Access"}
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {user.permissions.slice(0, 3).map(p => {
                            const perm = ALL_PERMISSIONS.find(x => x.key === p);
                            return (
                              <span key={p} className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                                {language === "fa" ? perm?.fa : perm?.en}
                              </span>
                            );
                          })}
                          {user.permissions.length > 3 && (
                            <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                              +{user.permissions.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={user.is_active}
                          onCheckedChange={() => toggleUserStatus(user)}
                          disabled={user.user_id === currentUser?.user_id}
                        />
                        <span className={`text-xs ${user.is_active ? "text-green-600" : "text-red-500"}`} className="font-medium">
                          {user.is_active
                            ? (language === "fa" ? "فعال" : "Active")
                            : (language === "fa" ? "غیرفعال" : "Inactive")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 w-8 p-0"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(user.user_id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                          disabled={user.user_id === currentUser?.user_id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* ===== ACTIVITY LOG TAB ===== */}
      {activeTab === "activity" && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600 font-semibold">
                {language === "fa" ? "فیلترها" : "Filters"}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="relative">
                <Search className="absolute right-2 top-2.5 w-4 h-4 text-gray-400" />
                <Input
                  value={searchLog}
                  onChange={e => setSearchLog(e.target.value)}
                  placeholder={language === "fa" ? "جستجو..." : "Search..."}
                  className="pr-8 text-sm"
                />
              </div>

              <Select value={filterUsername} onValueChange={setFilterUsername}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder={language === "fa" ? "کاربر" : "User"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === "fa" ? "همه کاربران" : "All Users"}</SelectItem>
                  {uniqueUsernames.map(u => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder={language === "fa" ? "نوع عملیات" : "Action"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === "fa" ? "همه عملیات‌ها" : "All Actions"}</SelectItem>
                  <SelectItem value="add">{language === "fa" ? "افزودن" : "Add"}</SelectItem>
                  <SelectItem value="edit">{language === "fa" ? "ویرایش" : "Edit"}</SelectItem>
                  <SelectItem value="delete">{language === "fa" ? "حذف" : "Delete"}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterEntity} onValueChange={setFilterEntity}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder={language === "fa" ? "بخش" : "Section"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === "fa" ? "همه بخش‌ها" : "All Sections"}</SelectItem>
                  {uniqueEntities.map(e => (
                    <SelectItem key={e} value={e}>
                      {language === "fa" ? (ENTITY_LABELS[e]?.fa || e) : (ENTITY_LABELS[e]?.en || e)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={filterDateFrom}
                onChange={e => setFilterDateFrom(e.target.value)}
                className="text-sm"
                placeholder={language === "fa" ? "از تاریخ" : "From date"}
              />
              <Input
                type="date"
                value={filterDateTo}
                onChange={e => setFilterDateTo(e.target.value)}
                className="text-sm"
                placeholder={language === "fa" ? "تا تاریخ" : "To date"}
              />
            </div>
            {(searchLog || filterUsername !== "all" || filterAction !== "all" || filterEntity !== "all" || filterDateFrom || filterDateTo) && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <span className="text-sm text-gray-500">
                  {filteredLogs.length} {language === "fa" ? "نتیجه یافت شد" : "results found"}
                </span>
                <button
                  onClick={() => {
                    setSearchLog("");
                    setFilterUsername("all");
                    setFilterAction("all");
                    setFilterEntity("all");
                    setFilterDateFrom("");
                    setFilterDateTo("");
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {language === "fa" ? "پاک کردن فیلترها" : "Clear filters"}
                </button>
              </div>
            )}
          </div>

          {/* Activity Log List */}
          {filteredLogs.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">
                {language === "fa" ? "هیچ فعالیتی ثبت نشده است" : "No activity recorded yet"}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="divide-y divide-gray-100">
                {filteredLogs.map((log: ActivityLog) => {
                  const actionInfo = ACTION_LABELS[log.action];
                  const entityInfo = ENTITY_LABELS[log.entity];
                  return (
                    <div key={log.log_id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                      <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        log.action === "add" ? "bg-green-100" :
                        log.action === "edit" ? "bg-blue-100" :
                        "bg-red-100"
                      }`}>
                        <Activity className={`w-4 h-4 ${
                          log.action === "add" ? "text-green-600" :
                          log.action === "edit" ? "text-blue-600" :
                          "text-red-500"
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm text-gray-800 font-semibold">{log.full_name}</span>
                          <span className="text-gray-400 text-xs">({log.username})</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${actionInfo?.color || "bg-gray-100 text-gray-600"}`} className="font-medium">
                            {language === "fa" ? actionInfo?.fa : actionInfo?.en}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${entityInfo?.color || "bg-gray-100 text-gray-600"}`} className="font-medium">
                            {language === "fa" ? entityInfo?.fa : (entityInfo?.en || log.entity)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{log.description}</p>
                        <p className="text-xs text-gray-400 mt-0.5 font-medium">{log.entity_name}</p>
                        {/* Before / After data */}
                        {(log.before_data || log.after_data) && log.action === "edit" && (
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            {log.before_data && (
                              <div className="bg-red-50 border border-red-100 rounded-lg px-2 py-1.5 text-xs">
                                <p className="text-red-500 mb-1 font-semibold">{language === "fa" ? "قبل از تغییر:" : "Before:"}</p>
                                <pre className="text-gray-600 whitespace-pre-wrap break-all text-xs leading-relaxed" >
                                  {(() => {
                                    try {
                                      const obj = JSON.parse(log.before_data!);
                                      return Object.entries(obj).filter(([k]) => !["product_id","customer_id","sale_id","expense_id","shareholder_id","supplier_id","user_id","withdrawal_id"].includes(k))
                                        .map(([k, v]) => `${k}: ${v}`).join("\n");
                                    } catch { return log.before_data; }
                                  })()}
                                </pre>
                              </div>
                            )}
                            {log.after_data && (
                              <div className="bg-green-50 border border-green-100 rounded-lg px-2 py-1.5 text-xs">
                                <p className="text-green-500 mb-1 font-semibold">{language === "fa" ? "بعد از تغییر:" : "After:"}</p>
                                <pre className="text-gray-600 whitespace-pre-wrap break-all text-xs leading-relaxed" >
                                  {(() => {
                                    try {
                                      const obj = JSON.parse(log.after_data!);
                                      return Object.entries(obj).filter(([k]) => !["product_id","customer_id","sale_id","expense_id","shareholder_id","supplier_id","user_id","withdrawal_id"].includes(k))
                                        .map(([k, v]) => `${k}: ${v}`).join("\n");
                                    } catch { return log.after_data; }
                                  })()}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-400 flex-shrink-0">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs">{log.date} {log.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
