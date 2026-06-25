import { useState } from "react";
import { useNavigate } from "react-router";
import { useApp, formatCurrency } from "../store/AppContext";
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
import { Plus, Trash2, Edit, Eye, Building2, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";

export default function Suppliers() {
  const navigate = useNavigate();
  const { suppliers, addSupplier, updateSupplier, deleteSupplier, language } = useApp();

  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState<any>(null);

  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [search, setSearch] = useState("");

  const resetForm = () => {
    setName("");
    setCompanyName("");
    setPhone("");
    setAddress("");
    setEditMode(false);
    setCurrentSupplier(null);
  };

  const handleAdd = () => {
    if (!name.trim() || !companyName.trim()) {
      toast.error(
        language === "fa" ? "نام و نام شرکت الزامی است" :
        language === "ps" ? "نوم او د شرکت نوم اړین دی" :
        "Name and company name are required"
      );
      return;
    }

    if (editMode && currentSupplier) {
      updateSupplier({
        ...currentSupplier,
        name,
        company_name: companyName,
        phone,
        address,
      });
      toast.success(
        language === "fa" ? "سپلایر بروزرسانی شد" :
        language === "ps" ? "عرضه کوونکی تازه شو" :
        "Supplier updated"
      );
    } else {
      addSupplier({
        name,
        company_name: companyName,
        phone,
        address,
        balance_afn: 0,
        balance_usd: 0,
      });
      toast.success(
        language === "fa" ? "سپلایر اضافه شد" :
        language === "ps" ? "عرضه کوونکی اضافه شو" :
        "Supplier added"
      );
    }

    setOpen(false);
    resetForm();
  };

  const handleEdit = (supplier: any) => {
    setCurrentSupplier(supplier);
    setName(supplier.name);
    setCompanyName(supplier.company_name);
    setPhone(supplier.phone);
    setAddress(supplier.address);
    setEditMode(true);
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(language === "fa" ? "آیا مطمئن هستید؟" : language === "ps" ? "ایا تاسو ډاډه یاست؟" : "Are you sure?")) {
      deleteSupplier(id);
      toast.success(
        language === "fa" ? "سپلایر حذف شد" :
        language === "ps" ? "عرضه کوونکی حذف شو" :
        "Supplier deleted"
      );
    }
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.company_name.toLowerCase().includes(search.toLowerCase()) ||
    s.phone.includes(search)
  );

  const totalDebtAfn = suppliers.reduce((sum, s) => sum + s.balance_afn, 0);
  const totalDebtUsd = suppliers.reduce((sum, s) => sum + s.balance_usd, 0);
  const suppliersCount = suppliers.length;

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-5 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8" />
            <div>
              <p className="text-indigo-100 text-sm">
                {language === "fa" ? "تعداد سپلایرها" :
                language === "ps" ? "د عرضه کوونکو شمیر" :
                "Total Suppliers"}
              </p>
              <p className="text-2xl mt-1 font-bold">
                {suppliersCount}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl p-5 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8" />
            <div>
              <p className="text-rose-100 text-sm">
                {language === "fa" ? "کل بدهی (افغانی)" :
                language === "ps" ? "ټول پور (افغانۍ)" :
                "Total Debt (AFN)"}
              </p>
              <p className="text-2xl mt-1 font-bold">
                {formatCurrency(totalDebtAfn, "AFN")}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8" />
            <div>
              <p className="text-amber-100 text-sm">
                {language === "fa" ? "کل بدهی (دالر)" :
                language === "ps" ? "ټول پور (ډالر)" :
                "Total Debt (USD)"}
              </p>
              <p className="text-2xl mt-1 font-bold">
                {formatCurrency(totalDebtUsd, "USD")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              language === "fa" ? "جستجوی نام، شرکت یا تلفن..." :
              language === "ps" ? "د نوم، شرکت یا تلفن لټون..." :
              "Search name, company or phone..."
            }
          />
        </div>

        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-500 hover:bg-blue-600">
              <Plus className="w-4 h-4 ml-2" />
              {language === "fa" ? "افزودن سپلایر" :
              language === "ps" ? "عرضه کوونکی اضافه" :
              "Add Supplier"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" dir={language === "fa" || language === "ps" ? "rtl" : "ltr"} aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>
                {editMode
                  ? (language === "fa" ? "ویرایش سپلایر" : language === "ps" ? "عرضه کوونکی سمون" : "Edit Supplier")
                  : (language === "fa" ? "افزودن سپلایر جدید" : language === "ps" ? "نوی عرضه کوونکی" : "Add New Supplier")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{language === "fa" ? "نام سپلایر *" : language === "ps" ? "د عرضه کوونکي نوم *" : "Supplier Name *"}</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={language === "fa" ? "نام را وارد کنید" : language === "ps" ? "نوم داخل کړئ" : "Enter name"}
                />
              </div>
              <div>
                <Label>{language === "fa" ? "نام شرکت *" : language === "ps" ? "د شرکت نوم *" : "Company Name *"}</Label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder={language === "fa" ? "نام شرکت" : language === "ps" ? "د شرکت نوم" : "Company name"}
                />
              </div>
              <div>
                <Label>{language === "fa" ? "شماره تماس" : language === "ps" ? "د اړیکې شمیره" : "Phone"}</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={language === "fa" ? "شماره تماس" : language === "ps" ? "د اړیکې شمیره" : "Phone number"}
                />
              </div>
              <div>
                <Label>{language === "fa" ? "آدرس" : language === "ps" ? "پته" : "Address"}</Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={language === "fa" ? "آدرس" : language === "ps" ? "پته" : "Address"}
                />
              </div>
              <Button onClick={handleAdd} className="w-full">
                {editMode
                  ? (language === "fa" ? "بروزرسانی" : language === "ps" ? "تازه کول" : "Update")
                  : (language === "fa" ? "افزودن" : language === "ps" ? "اضافه کول" : "Add")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">{language === "fa" ? "نام" : language === "ps" ? "نوم" : "Name"}</TableHead>
              <TableHead className="text-right">{language === "fa" ? "شرکت" : language === "ps" ? "شرکت" : "Company"}</TableHead>
              <TableHead className="text-right">{language === "fa" ? "تلفن" : language === "ps" ? "تلفون" : "Phone"}</TableHead>
              <TableHead className="text-right">{language === "fa" ? "بدهی (؋)" : language === "ps" ? "پور (؋)" : "Debt (AFN)"}</TableHead>
              <TableHead className="text-right">{language === "fa" ? "بدهی ($)" : language === "ps" ? "پور ($)" : "Debt (USD)"}</TableHead>
              <TableHead className="text-right">{language === "fa" ? "عملیات" : language === "ps" ? "عملیات" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSuppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                  {language === "fa" ? "سپلایری ثبت نشده است" :
                  language === "ps" ? "عرضه کوونکی ثبت شوی نه دی" :
                  "No suppliers added"}
                </TableCell>
              </TableRow>
            ) : (
              filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.supplier_id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell className="text-gray-600">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-500" />
                      {supplier.company_name}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">{supplier.phone || "-"}</TableCell>
                  <TableCell>
                    {supplier.balance_afn > 0 ? (
                      <span className="text-rose-600 font-semibold">
                        {formatCurrency(supplier.balance_afn, "AFN")}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {supplier.balance_usd > 0 ? (
                      <span className="text-rose-600 font-semibold">
                        {formatCurrency(supplier.balance_usd, "USD")}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/supplier-profile/${supplier.supplier_id}`)}
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(supplier)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(supplier.supplier_id)}
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
  );
}
