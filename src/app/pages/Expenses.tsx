import { useState } from "react";
import { useApp, formatCurrency } from "../store/AppContext";
import { Plus, Search, Pencil, Trash2, TrendingDown, Calendar, Tag, X, Filter, FileSpreadsheet, FileDown } from "lucide-react";
import { exportToExcel, exportToPDF } from "../utils/exportUtils";
import { toast } from "sonner";

interface ExpenseFormData {
  date: string;
  category: string;
  description: string;
  amount_afn: string;
  amount_usd: string;
}

type CategoryFilter = "all" | string;
type DateFilter = "all" | "today" | "week" | "month" | "custom";

const EXPENSE_CATEGORIES = [
  "کرایه",
  "برق و آب",
  "حقوق کارمندان",
  "خرید کالا",
  "حمل و نقل",
  "تبلیغات",
  "تعمیرات",
  "سایر",
];

const emptyForm: ExpenseFormData = {
  date: new Date().toISOString().split("T")[0],
  category: "",
  description: "",
  amount_afn: "",
  amount_usd: "",
};

export default function Expenses() {
  const { expenses, addExpense, updateExpense, deleteExpense, language, currency } = useApp();

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editExpense, setEditExpense] = useState<any>(null);
  const [form, setForm] = useState<ExpenseFormData>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const getDateRange = (): [Date | null, Date | null] => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (dateFilter) {
      case "today":
        return [today, new Date(today.getTime() + 24 * 60 * 60 * 1000)];
      case "week":
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return [weekAgo, new Date()];
      case "month":
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        return [monthAgo, new Date()];
      case "custom":
        if (customStartDate && customEndDate) {
          return [new Date(customStartDate), new Date(customEndDate)];
        }
        return [null, null];
      default:
        return [null, null];
    }
  };

  const filtered = expenses.filter((exp) => {
    const matchesSearch =
      exp.description.toLowerCase().includes(search.toLowerCase()) ||
      exp.category.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (categoryFilter !== "all" && exp.category !== categoryFilter) return false;

    if (dateFilter !== "all") {
      const [startDate, endDate] = getDateRange();
      if (startDate && endDate) {
        const expDate = new Date(exp.date);
        if (expDate < startDate || expDate > endDate) return false;
      }
    }

    return true;
  });

  const totalExpensesAfn = filtered.reduce((sum, exp) => sum + exp.amount_afn, 0);
  const totalExpensesUsd = filtered.reduce((sum, exp) => sum + exp.amount_usd, 0);
  const totalExpenses = currency === "AFN" ? totalExpensesAfn : totalExpensesUsd;

  const categoryTotals = EXPENSE_CATEGORIES.map((cat) => ({
    category: cat,
    totalAfn: expenses.filter((e) => e.category === cat).reduce((sum, e) => sum + e.amount_afn, 0),
    totalUsd: expenses.filter((e) => e.category === cat).reduce((sum, e) => sum + e.amount_usd, 0),
  })).filter((item) => item.totalAfn > 0 || item.totalUsd > 0);

  const openAdd = () => {
    setEditExpense(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (exp: any) => {
    setEditExpense(exp);
    setForm({
      date: exp.date,
      category: exp.category,
      description: exp.description,
      amount_afn: exp.amount_afn.toString(),
      amount_usd: exp.amount_usd.toString(),
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      date: form.date,
      category: form.category,
      description: form.description,
      amount_afn: Number(form.amount_afn) || 0,
      amount_usd: Number(form.amount_usd) || 0,
    };

    if (editExpense) {
      updateExpense({ ...data, expense_id: editExpense.expense_id });
    } else {
      addExpense(data);
    }
    setShowModal(false);
    setForm(emptyForm);
  };

  const handleDelete = (id: string) => {
    deleteExpense(id);
    setDeleteConfirm(null);
  };

  const handleExportExcel = () => {
    const data = filtered.map((exp) => ({
      [language === "fa" ? "تاریخ" : "Date"]: exp.date,
      [language === "fa" ? "دسته" : "Category"]: exp.category,
      [language === "fa" ? "توضیحات" : "Description"]: exp.description,
      [language === "fa" ? "مبلغ (افغانی)" : "Amount (AFN)"]: exp.amount_afn,
      [language === "fa" ? "مبلغ (دالر)" : "Amount (USD)"]: exp.amount_usd,
    }));
    exportToExcel(data, language === "fa" ? "لیست_مصارف" : "expenses_list");
    toast.success(language === "fa" ? "فایل Excel دانلود شد" : "Excel file downloaded");
  };

  const handleExportPDF = () => {
    const headers = [
      language === "fa" ? "تاریخ" : "Date",
      language === "fa" ? "دسته" : "Category",
      language === "fa" ? "توضیحات" : "Description",
      language === "fa" ? "افغانی" : "AFN",
      language === "fa" ? "دالر" : "USD",
    ];
    const data = filtered.map((exp) => [
      exp.date,
      exp.category,
      exp.description,
      exp.amount_afn.toString(),
      exp.amount_usd.toString(),
    ]);
    exportToPDF(
      language === "fa" ? "لیست مصارف" : "Expenses List",
      headers,
      data,
      language === "fa" ? "rtl" : "ltr"
    );
    toast.success(language === "fa" ? "فایل PDF دانلود شد" : "PDF file downloaded");
  };

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex gap-3 items-center justify-between flex-wrap">
        <div className="relative flex-1 max-w-sm min-w-[200px]">
          <Search className={`absolute ${language === "fa" ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === "fa" ? "جستجوی مصارف..." : "Search expenses..."}
            className={`w-full bg-white border border-gray-200 rounded-xl ${language === "fa" ? "pr-10 pl-4" : "pl-10 pr-4"} py-2.5 text-sm focus:outline-none focus:border-blue-400`}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors text-sm ${
              showFilters || categoryFilter !== "all" || dateFilter !== "all"
                ? "bg-blue-500 text-white"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
            style={{ fontWeight: 500 }}
          >
            <Filter className="w-4 h-4" />
            {language === "fa" ? "فیلتر" : "Filter"}
            {(categoryFilter !== "all" || dateFilter !== "all") && (
              <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded">{language === "fa" ? "فعال" : "Active"}</span>
            )}
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-3 py-2.5 rounded-xl transition-colors text-sm"
            style={{ fontWeight: 500 }}
          >
            <FileSpreadsheet className="w-4 h-4" />
            {language === "fa" ? "اکسل" : "Excel"}
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-2.5 rounded-xl transition-colors text-sm"
            style={{ fontWeight: 500 }}
          >
            <FileDown className="w-4 h-4" />
            {language === "fa" ? "PDF" : "PDF"}
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl transition-colors text-sm"
            style={{ fontWeight: 600 }}
          >
            <Plus className="w-4 h-4" />
            {language === "fa" ? "افزودن مصرف" : "Add Expense"}
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                {language === "fa" ? "دسته‌بندی" : "Category"}
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
              >
                <option value="all">{language === "fa" ? "همه دسته‌ها" : "All Categories"}</option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                {language === "fa" ? "فلتر زمانی" : "Date Filter"}
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
              >
                <option value="all">{language === "fa" ? "همه" : "All Time"}</option>
                <option value="today">{language === "fa" ? "امروز" : "Today"}</option>
                <option value="week">{language === "fa" ? "هفته گذشته" : "Last Week"}</option>
                <option value="month">{language === "fa" ? "ماه گذشته" : "Last Month"}</option>
                <option value="custom">{language === "fa" ? "دلخواه" : "Custom"}</option>
              </select>
            </div>
          </div>

          {dateFilter === "custom" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">{language === "fa" ? "از تاریخ" : "From Date"}</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">{language === "fa" ? "تا تاریخ" : "To Date"}</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3">
            <TrendingDown className="w-10 h-10" />
            <div>
              <p className="text-red-100 text-sm mb-1">{language === "fa" ? "کل مصارف" : "Total Expenses"}</p>
              <p className="text-2xl" style={{ fontWeight: 700 }}>
                {formatCurrency(totalExpenses, currency)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <Tag className="w-10 h-10 text-blue-500" />
            <div>
              <p className="text-gray-500 text-sm mb-1">{language === "fa" ? "تعداد مصارف" : "Total Records"}</p>
              <p className="text-2xl text-gray-900" style={{ fontWeight: 700 }}>
                {filtered.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <Tag className="w-10 h-10 text-violet-500" />
            <div>
              <p className="text-gray-500 text-sm mb-1">{language === "fa" ? "دسته‌بندی‌ها فعال" : "Active Categories"}</p>
              <p className="text-2xl text-gray-900" style={{ fontWeight: 700 }}>
                {categoryTotals.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-right px-5 py-4 text-sm text-gray-600" style={{ fontWeight: 600 }}>
                  {language === "fa" ? "تاریخ" : "Date"}
                </th>
                <th className="text-right px-5 py-4 text-sm text-gray-600" style={{ fontWeight: 600 }}>
                  {language === "fa" ? "دسته‌بندی" : "Category"}
                </th>
                <th className="text-right px-5 py-4 text-sm text-gray-600" style={{ fontWeight: 600 }}>
                  {language === "fa" ? "توضیحات" : "Description"}
                </th>
                <th className="text-right px-5 py-4 text-sm text-gray-600" style={{ fontWeight: 600 }}>
                  {language === "fa" ? "مبلغ (افغانی)" : "Amount (AFN)"}
                </th>
                <th className="text-right px-5 py-4 text-sm text-gray-600" style={{ fontWeight: 600 }}>
                  {language === "fa" ? "مبلغ (دالر)" : "Amount (USD)"}
                </th>
                <th className="text-right px-5 py-4 text-sm text-gray-600" style={{ fontWeight: 600 }}>
                  {language === "fa" ? "عملیات" : "Actions"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    <TrendingDown className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>{language === "fa" ? "هیچ مصرفی یافت نشد" : "No expenses found"}</p>
                  </td>
                </tr>
              ) : (
                filtered.map((exp) => (
                  <tr key={exp.expense_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-sm text-gray-600">{exp.date}</td>
                    <td className="px-5 py-4">
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-xs" style={{ fontWeight: 500 }}>
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-800" style={{ fontWeight: 500 }}>
                      {exp.description}
                    </td>
                    <td className="px-5 py-4 text-sm text-red-600" style={{ fontWeight: 600 }}>
                      {formatCurrency(exp.amount_afn, "AFN")}
                    </td>
                    <td className="px-5 py-4 text-sm text-red-600" style={{ fontWeight: 600 }}>
                      {formatCurrency(exp.amount_usd, "USD")}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(exp)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(exp.expense_id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir={language === "fa" ? "rtl" : "ltr"}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h3 className="text-gray-800" style={{ fontWeight: 700 }}>
                {editExpense ? (language === "fa" ? "ویرایش مصرف" : "Edit Expense") : (language === "fa" ? "افزودن مصرف جدید" : "Add New Expense")}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">{language === "fa" ? "تاریخ *" : "Date *"}</label>
                <input
                  required
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1.5">{language === "fa" ? "دسته‌بندی *" : "Category *"}</label>
                <select
                  required
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white"
                >
                  <option value="">{language === "fa" ? "انتخاب کنید..." : "Select..."}</option>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1.5">{language === "fa" ? "توضیحات *" : "Description *"}</label>
                <textarea
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 resize-none"
                  placeholder={language === "fa" ? "جزئیات مصرف..." : "Expense details..."}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">{language === "fa" ? "مبلغ (افغانی)" : "Amount (AFN)"}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount_afn}
                    onChange={(e) => setForm({ ...form, amount_afn: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">{language === "fa" ? "مبلغ (دالر)" : "Amount (USD)"}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount_usd}
                    onChange={(e) => setForm({ ...form, amount_usd: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-xl text-sm transition-colors"
                  style={{ fontWeight: 600 }}
                >
                  {editExpense ? (language === "fa" ? "ذخیره تغییرات" : "Save Changes") : (language === "fa" ? "افزودن" : "Add")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-sm transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  {language === "fa" ? "انصراف" : "Cancel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir={language === "fa" ? "rtl" : "ltr"}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-gray-800 mb-2" style={{ fontWeight: 700 }}>
              {language === "fa" ? "حذف مصرف" : "Delete Expense"}
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              {language === "fa" ? "آیا مطمئن هستید که می‌خواهید این مصرف را حذف کنید؟" : "Are you sure you want to delete this expense?"}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm transition-colors"
                style={{ fontWeight: 600 }}
              >
                {language === "fa" ? "بله، حذف شود" : "Yes, Delete"}
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-sm transition-colors"
                style={{ fontWeight: 500 }}
              >
                {language === "fa" ? "انصراف" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
