import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useShopUser, ShopUser } from "../store/ShopUserContext";
import { useApp } from "../store/AppContext";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Switch } from "../components/ui/switch";
import { Plus, Trash2, Edit, Store, Users, Calendar, Mail, Phone, ShoppingBag, Search, LogOut, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function AdminPanel() {
  const navigate = useNavigate();
  const { allShopUsers, addShopUser, updateShopUser, deleteShopUser } = useShopUser();
  const { language } = useApp();

  // Check if admin is authenticated
  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem("admin_authenticated");
    if (!isAuthenticated) {
      navigate("/admin-login");
    }
  }, [navigate]);

  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentEditUser, setCurrentEditUser] = useState<ShopUser | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [shopName, setShopName] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setPhone("");
    setShopName("");
    setIsActive(true);
    setEditMode(false);
    setCurrentEditUser(null);
  };

  const handleAdd = () => {
    if (!name.trim() || !email.trim() || !password.trim() || !shopName.trim()) {
      toast.error(language === "fa" ? "نام، ایمیل، رمز عبور و نام دوکان الزامی هستند" : "Name, email, password and shop name are required");
      return;
    }

    // Check if email already exists
    if (!editMode && allShopUsers.some(u => u.email === email)) {
      toast.error(language === "fa" ? "ایمیل قبلاً استفاده شده است" : "Email already exists");
      return;
    }

    if (editMode && currentEditUser) {
      updateShopUser({
        ...currentEditUser,
        name,
        email,
        password,
        phone,
        shop_name: shopName,
        is_active: isActive,
      });
      toast.success(language === "fa" ? "کاربر بروزرسانی شد" : "User updated");
    } else {
      addShopUser({
        name,
        email,
        password,
        phone,
        shop_name: shopName,
        is_active: isActive,
      });
      toast.success(language === "fa" ? "کاربر جدید اضافه شد" : "New user added");
    }

    setOpen(false);
    resetForm();
  };

  const handleEdit = (user: ShopUser) => {
    setCurrentEditUser(user);
    setName(user.name);
    setEmail(user.email);
    setPassword(user.password);
    setPhone(user.phone);
    setShopName(user.shop_name);
    setIsActive(user.is_active);
    setEditMode(true);
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(language === "fa" ? "آیا مطمئن هستید؟ تمام اطلاعات این دوکان حذف خواهد شد" : "Are you sure? All data for this shop will be deleted")) {
      deleteShopUser(id);
      toast.success(language === "fa" ? "کاربر و تمام اطلاعات حذف شد" : "User and all data deleted");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_authenticated");
    toast.success(language === "fa" ? "از پنل مدیریت خارج شدید" : "Logged out from admin panel");
    navigate("/admin-login");
  };

  const toggleUserStatus = (user: ShopUser) => {
    updateShopUser({
      ...user,
      is_active: !user.is_active,
    });
    toast.success(
      user.is_active
        ? (language === "fa" ? "کاربر غیرفعال شد" : "User deactivated")
        : (language === "fa" ? "کاربر فعال شد" : "User activated")
    );
  };

  const filteredUsers = allShopUsers.filter(u => {
    const query = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.shop_name.toLowerCase().includes(query) ||
      u.phone.includes(query)
    );
  });

  return (
    <div dir={language === "fa" ? "rtl" : "ltr"} className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl text-gray-800" style={{ fontWeight: 700 }}>
                  {language === "fa" ? "پنل مدیریت کاربران" : language === "ps" ? "د کاروونکو مدیریت پینل" : "User Management Panel"}
                </h1>
                <p className="text-gray-500 text-sm">
                  {language === "fa" ? "مدیریت کاربران دوکان‌ها و دیتابیس‌های جداگانه" : language === "ps" ? "د پلورنځیو کاروونکو او جلا ډیټابیسونو مدیریت" : "Manage shop users and separate databases"}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 ml-2" />
              {language === "fa" ? "خروج" : language === "ps" ? "وتل" : "Logout"}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-sm">
            <div className="flex items-center gap-3">
              <Store className="w-8 h-8" />
              <div>
                <p className="text-blue-100 text-sm">{language === "fa" ? "کل دوکان‌ها" : "Total Shops"}</p>
                <p className="text-3xl mt-1" style={{ fontWeight: 700 }}>{allShopUsers.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white shadow-sm">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8" />
              <div>
                <p className="text-green-100 text-sm">{language === "fa" ? "فعال" : "Active"}</p>
                <p className="text-3xl mt-1" style={{ fontWeight: 700 }}>
                  {allShopUsers.filter(u => u.is_active).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white shadow-sm">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-8 h-8" />
              <div>
                <p className="text-orange-100 text-sm">{language === "fa" ? "غیرفعال" : "Inactive"}</p>
                <p className="text-3xl mt-1" style={{ fontWeight: 700 }}>
                  {allShopUsers.filter(u => !u.is_active).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions & Search */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-blue-500 hover:bg-blue-600">
                  <Plus className="w-4 h-4 ml-2" />
                  {language === "fa" ? "افزودن کاربر جدید" : "Add New User"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md" dir={language === "fa" ? "rtl" : "ltr"} aria-describedby={undefined}>
                <DialogHeader>
                  <DialogTitle>
                    {editMode
                      ? (language === "fa" ? "ویرایش کاربر" : "Edit User")
                      : (language === "fa" ? "افزودن کاربر جدید" : "Add New User")}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>{language === "fa" ? "نام کامل *" : "Full Name *"}</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={language === "fa" ? "نام کامل" : "Full name"}
                    />
                  </div>
                  <div>
                    <Label>{language === "fa" ? "ایمیل *" : "Email *"}</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={language === "fa" ? "example@mail.com" : "example@mail.com"}
                      disabled={editMode}
                    />
                  </div>
                  <div>
                    <Label>{language === "fa" ? "رمز عبور *" : "Password *"}</Label>
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
                    <Label>{language === "fa" ? "شماره تماس" : "Phone"}</Label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={language === "fa" ? "0799123456" : "0799123456"}
                    />
                  </div>
                  <div>
                    <Label>{language === "fa" ? "نام دوکان *" : "Shop Name *"}</Label>
                    <Input
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      placeholder={language === "fa" ? "نام دوکان" : "Shop name"}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>{language === "fa" ? "وضعیت فعال" : "Active Status"}</Label>
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                  </div>
                  <Button onClick={handleAdd} className="w-full">
                    {editMode
                      ? (language === "fa" ? "بروزرسانی" : "Update")
                      : (language === "fa" ? "افزودن" : "Add")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === "fa" ? "جستجوی نام، ایمیل، دوکان..." : "Search name, email, shop..."}
                className="pr-10"
              />
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">{language === "fa" ? "نام کاربر" : "User Name"}</TableHead>
                <TableHead className="text-right">{language === "fa" ? "ایمیل" : "Email"}</TableHead>
                <TableHead className="text-right">{language === "fa" ? "شماره تماس" : "Phone"}</TableHead>
                <TableHead className="text-right">{language === "fa" ? "نام دوکان" : "Shop Name"}</TableHead>
                <TableHead className="text-right">{language === "fa" ? "تاریخ ثبت‌نام" : "Registration Date"}</TableHead>
                <TableHead className="text-right">{language === "fa" ? "وضعیت" : "Status"}</TableHead>
                <TableHead className="text-right">{language === "fa" ? "عملیات" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-12">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>{language === "fa" ? "هیچ کاربری ثبت نشده است" : "No users registered"}</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.shop_user_id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-sm" style={{ fontWeight: 600 }}>
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span style={{ fontWeight: 500 }}>{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Mail className="w-3 h-3" />
                        <span className="text-sm">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Phone className="w-3 h-3" />
                        <span className="text-sm">{user.phone || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Store className="w-3 h-3 text-purple-500" />
                        <span className="text-sm" style={{ fontWeight: 500 }}>{user.shop_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar className="w-3 h-3" />
                        <span className="text-sm">{user.created_date}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={user.is_active}
                          onCheckedChange={() => toggleUserStatus(user)}
                        />
                        <span className="text-sm">
                          {user.is_active
                            ? (language === "fa" ? "فعال" : "Active")
                            : (language === "fa" ? "غیرفعال" : "Inactive")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(user.shop_user_id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
