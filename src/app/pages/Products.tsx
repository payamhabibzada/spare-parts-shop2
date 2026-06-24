import { useState, useEffect } from "react";
import { useApp, Product, formatCurrency } from "../store/AppContext";
import { Plus, Search, Pencil, Trash2, Package, AlertTriangle, FileSpreadsheet, FileDown, Truck, Camera } from "lucide-react";
import { exportToExcel, exportToPDF } from "../utils/exportUtils";
import { toast } from "sonner";
import BarcodeScanner from "../components/BarcodeScanner";

interface ProductFormData {
  name: string;
  category: string;
  buy_price_afn: string;
  buy_price_usd: string;
  sell_price_afn: string;
  sell_price_usd: string;
  stock: string;
  min_stock: string;
  description: string;
  barcode: string;
  supplier_id: string;
  purchase_date: string;
  paid_amount_afn: string;
  paid_amount_usd: string;
  purchase_description: string;
}

const emptyForm: ProductFormData = {
  name: "",
  category: "",
  buy_price_afn: "",
  buy_price_usd: "",
  sell_price_afn: "",
  sell_price_usd: "",
  stock: "",
  min_stock: "0",
  description: "",
  barcode: "",
  supplier_id: "",
  purchase_date: new Date().toISOString().split("T")[0],
  paid_amount_afn: "",
  paid_amount_usd: "",
  purchase_description: "",
};

export default function Products() {
  const { products, categories, suppliers, addProduct, updateProduct, deleteProduct, addSupplierPurchase, language, currency } = useApp();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(language === "fa" ? "همه" : language === "ps" ? "ټول" : "All");
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showBarcodeCamera, setShowBarcodeCamera] = useState(false);

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    const allFilter = language === "fa" ? "همه" : language === "ps" ? "ټول" : "All";
    const matchCat = categoryFilter === allFilter || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  // نوتیفیکیشن کمبود موجودی
  useEffect(() => {
    const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= p.min_stock);
    const outOfStockProducts = products.filter(p => p.stock === 0);

    if (lowStockProducts.length > 0) {
      lowStockProducts.forEach(p => {
        toast.warning(
          language === "fa" ? `هشدار: موجودی "${p.name}" به حداقل رسیده است (${p.stock})` :
          language === "ps" ? `خبرتیا: د "${p.name}" موجودي لږ دی (${p.stock})` :
          `Warning: "${p.name}" stock is low (${p.stock})`,
          { duration: 5000 }
        );
      });
    }

    if (outOfStockProducts.length > 0) {
      outOfStockProducts.forEach(p => {
        toast.error(
          language === "fa" ? `موجودی "${p.name}" به پایان رسیده است!` :
          language === "ps" ? `د "${p.name}" موجودي ختم شوی دی!` :
          `"${p.name}" is out of stock!`,
          { duration: 5000 }
        );
      });
    }
  }, [products, language]);

  const openAdd = () => {
    setEditProduct(null);
    setForm({
      ...emptyForm,
      category: categories[0]?.name_fa || "",
      purchase_date: new Date().toISOString().split("T")[0],
    });
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({
      name: p.name,
      category: p.category,
      buy_price_afn: p.buy_price_afn.toString(),
      buy_price_usd: p.buy_price_usd.toString(),
      sell_price_afn: p.sell_price_afn.toString(),
      sell_price_usd: p.sell_price_usd.toString(),
      stock: p.stock.toString(),
      min_stock: p.min_stock.toString(),
      description: p.description,
      barcode: p.barcode || "",
      supplier_id: "",
      purchase_date: new Date().toISOString().split("T")[0],
      paid_amount_afn: "",
      paid_amount_usd: "",
      purchase_description: "",
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: form.name,
      category: form.category,
      buy_price_afn: Number(form.buy_price_afn) || 0,
      buy_price_usd: Number(form.buy_price_usd) || 0,
      sell_price_afn: Number(form.sell_price_afn) || 0,
      sell_price_usd: Number(form.sell_price_usd) || 0,
      stock: Number(form.stock) || 0,
      min_stock: Number(form.min_stock) || 0,
      description: form.description,
      barcode: form.barcode.trim() || undefined,
    };

    if (editProduct) {
      updateProduct({ ...data, product_id: editProduct.product_id });
      toast.success(language === "fa" ? "جنس بروزرسانی شد" : language === "ps" ? "توکی تازه شو" : "Product updated");
    } else {
      addProduct(data);

      // اگر سپلایر انتخاب شده، خرید را ثبت کن
      if (form.supplier_id) {
        const totalAfn = data.buy_price_afn * data.stock;
        const totalUsd = data.buy_price_usd * data.stock;
        const paidAfn = Number(form.paid_amount_afn) || 0;
        const paidUsd = Number(form.paid_amount_usd) || 0;

        addSupplierPurchase({
          supplier_id: form.supplier_id,
          date: form.purchase_date,
          total_amount_afn: totalAfn,
          total_amount_usd: totalUsd,
          paid_amount_afn: paidAfn,
          paid_amount_usd: paidUsd,
          items: JSON.stringify([{
            product_name: form.name,
            quantity: data.stock,
            unit_price_afn: data.buy_price_afn,
            unit_price_usd: data.buy_price_usd,
            total_afn: totalAfn,
            total_usd: totalUsd,
          }]),
          description: form.purchase_description ||
            (language === "fa" ? `خرید ${form.name}` :
             language === "ps" ? `د ${form.name} پیرود` :
             `Purchase of ${form.name}`),
        });
        toast.success(
          language === "fa" ? "جنس اضافه شد و خرید در حساب سپلایر ثبت گردید" :
          language === "ps" ? "توکی اضافه شو او پیرود د سپلایر په حساب کې ثبت شو" :
          "Product added and purchase recorded to supplier account"
        );
      } else {
        toast.success(language === "fa" ? "جنس اضافه شد" : language === "ps" ? "توکی اضافه شو" : "Product added");
      }
    }
    setShowModal(false);
  };

  const allFilter = language === "fa" ? "همه" : language === "ps" ? "ټول" : "All";
  const allCategories = [allFilter, ...categories.map(c => language === "fa" ? c.name_fa : c.name_en)];

  const handleExportExcel = () => {
    const data = filtered.map((p) => ({
      [language === "fa" ? "نام" : language === "ps" ? "نوم" : "Name"]: p.name,
      [language === "fa" ? "دسته" : language === "ps" ? "کټګوري" : "Category"]: p.category,
      [language === "fa" ? "قیمت خرید (افغانی)" : language === "ps" ? "د پیرود قیمت (افغانۍ)" : "Buy Price (AFN)"]: p.buy_price_afn,
      [language === "fa" ? "قیمت خرید (دالر)" : language === "ps" ? "د پیرود قیمت (ډالر)" : "Buy Price (USD)"]: p.buy_price_usd,
      [language === "fa" ? "قیمت فروش (افغانی)" : language === "ps" ? "د پلور قیمت (افغانۍ)" : "Sell Price (AFN)"]: p.sell_price_afn,
      [language === "fa" ? "قیمت فروش (دالر)" : language === "ps" ? "د پلور قیمت (ډالر)" : "Sell Price (USD)"]: p.sell_price_usd,
      [language === "fa" ? "موجودی" : language === "ps" ? "موجودي" : "Stock"]: p.stock,
      [language === "fa" ? "بارکود" : language === "ps" ? "بارکوډ" : "Barcode"]: p.barcode || "-",
      [language === "fa" ? "توضیحات" : language === "ps" ? "تفصیل" : "Description"]: p.description,
    }));
    exportToExcel(data, language === "fa" ? "لیست_اجناس" : language === "ps" ? "د_توکو_لیست" : "products_list");
    toast.success(language === "fa" ? "فایل Excel دانلود شد" : language === "ps" ? "Excel فایل ډاونلوډ شو" : "Excel file downloaded");
  };

  const handleExportPDF = () => {
    const headers = [
      language === "fa" ? "نام" : language === "ps" ? "نوم" : "Name",
      language === "fa" ? "دسته" : language === "ps" ? "کټګوري" : "Category",
      language === "fa" ? "خرید (AFN)" : "Buy (AFN)",
      language === "fa" ? "خرید (USD)" : "Buy (USD)",
      language === "fa" ? "فروش (AFN)" : "Sell (AFN)",
      language === "fa" ? "فروش (USD)" : "Sell (USD)",
      language === "fa" ? "موجودی" : language === "ps" ? "موجودي" : "Stock",
    ];
    const data = filtered.map((p) => [
      p.name,
      p.category,
      p.buy_price_afn.toString(),
      p.buy_price_usd.toString(),
      p.sell_price_afn.toString(),
      p.sell_price_usd.toString(),
      p.stock.toString(),
    ]);
    exportToPDF(
      language === "fa" ? "لیست اجناس" : language === "ps" ? "د توکو لیست" : "Products List",
      headers,
      data,
      language === "fa" || language === "ps" ? "rtl" : "ltr"
    );
    toast.success(language === "fa" ? "فایل PDF دانلود شد" : language === "ps" ? "PDF فایل ډاونلوډ شو" : "PDF file downloaded");
  };

  // محاسبه مبلغ مجموع خرید
  const totalAfnCost = (Number(form.buy_price_afn) || 0) * (Number(form.stock) || 0);
  const totalUsdCost = (Number(form.buy_price_usd) || 0) * (Number(form.stock) || 0);

  return (
    <div className="space-y-4" dir={language === "fa" || language === "ps" ? "rtl" : "ltr"}>
      {/* Top bar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {allCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  categoryFilter === cat
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
                style={{ fontWeight: 500 }}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-3 py-1.5 rounded-xl transition-colors text-sm"
              style={{ fontWeight: 500 }}
            >
              <FileSpreadsheet className="w-4 h-4" />
              {language === "fa" ? "اکسل" : language === "ps" ? "اکسل" : "Excel"}
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-1.5 rounded-xl transition-colors text-sm"
              style={{ fontWeight: 500 }}
            >
              <FileDown className="w-4 h-4" />
              PDF
            </button>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl transition-colors text-sm"
              style={{ fontWeight: 600 }}
            >
              <Plus className="w-4 h-4" />
              {language === "fa" ? "افزودن جنس" : language === "ps" ? "توکی اضافه کول" : "Add Product"}
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className={`absolute ${language === "fa" || language === "ps" ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={language === "fa" ? "جستجوی اجناس..." : language === "ps" ? "د توکو لټون..." : "Search products..."}
          className={`w-full bg-white border border-gray-200 rounded-xl ${language === "fa" || language === "ps" ? "pr-10 pl-4" : "pl-10 pr-4"} py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100`}
        />
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(p => {
          const buyPrice = currency === "AFN" ? p.buy_price_afn : p.buy_price_usd;
          const sellPrice = currency === "AFN" ? p.sell_price_afn : p.sell_price_usd;
          const profit = sellPrice - buyPrice;

          return (
            <div key={p.product_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Package className="w-5 h-5 text-blue-500" />
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    p.stock === 0 ? "bg-red-100 text-red-600" :
                    p.stock <= p.min_stock ? "bg-orange-100 text-orange-600" :
                    "bg-emerald-100 text-emerald-600"
                  }`} style={{ fontWeight: 500 }}>
                    {p.stock === 0 && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                    {p.stock > 0 && p.stock <= p.min_stock && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                    {language === "fa" ? "موجودی: " : language === "ps" ? "موجودي: " : "Stock: "}{p.stock}
                  </span>
                </div>
                <h4 className="text-gray-800 mb-1" style={{ fontWeight: 600 }}>{p.name}</h4>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{p.category}</span>
                {p.description && (
                  <p className="text-gray-400 text-xs mt-2 line-clamp-2">{p.description}</p>
                )}
              </div>
              <div className="px-4 pb-3 space-y-1.5">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{language === "fa" ? "قیمت خرید:" : language === "ps" ? "د پیرود قیمت:" : "Buy Price:"}</span>
                  <span className="text-gray-700" style={{ fontWeight: 500 }}>{formatCurrency(buyPrice, currency)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{language === "fa" ? "قیمت فروش:" : language === "ps" ? "د پلور قیمت:" : "Sell Price:"}</span>
                  <span className="text-emerald-600" style={{ fontWeight: 600 }}>{formatCurrency(sellPrice, currency)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{language === "fa" ? "سود:" : language === "ps" ? "ګټه:" : "Profit:"}</span>
                  <span className="text-blue-600" style={{ fontWeight: 500 }}>{formatCurrency(profit, currency)}</span>
                </div>
              </div>
              <div className="flex border-t border-gray-100">
                <button
                  onClick={() => openEdit(p)}
                  className="flex-1 py-2.5 text-blue-500 hover:bg-blue-50 text-sm transition-colors flex items-center justify-center gap-1"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  {language === "fa" ? "ویرایش" : language === "ps" ? "سمول" : "Edit"}
                </button>
                <button
                  onClick={() => setDeleteConfirm(p.product_id)}
                  className={`flex-1 py-2.5 text-red-400 hover:bg-red-50 text-sm transition-colors flex items-center justify-center gap-1 ${language === "fa" || language === "ps" ? "border-r" : "border-l"} border-gray-100`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {language === "fa" ? "حذف" : language === "ps" ? "حذف" : "Delete"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{language === "fa" ? "هیچ جنسی یافت نشد" : language === "ps" ? "هیڅ توکی و نه موندل شو" : "No products found"}</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir={language === "fa" || language === "ps" ? "rtl" : "ltr"}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-gray-800" style={{ fontWeight: 700 }}>
                {editProduct
                  ? (language === "fa" ? "ویرایش جنس" : language === "ps" ? "توکی سمول" : "Edit Product")
                  : (language === "fa" ? "افزودن جنس جدید" : language === "ps" ? "نوی توکی اضافه کول" : "Add New Product")}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">
                  {language === "fa" ? "نام جنس *" : language === "ps" ? "د توکي نوم *" : "Product Name *"}
                </label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                  placeholder={language === "fa" ? "نام جنس را وارد کنید" : language === "ps" ? "د توکي نوم دننه کړئ" : "Enter product name"}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">
                  {language === "fa" ? "دسته‌بندی *" : language === "ps" ? "کټګوري *" : "Category *"}
                </label>
                <select
                  required
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white"
                >
                  <option value="">{language === "fa" ? "انتخاب دسته‌بندی..." : language === "ps" ? "کټګوري انتخاب کړئ..." : "Select category..."}</option>
                  {categories.map(c => (
                    <option key={c.category_id} value={c.name_fa}>
                      {language === "fa" ? c.name_fa : c.name_en}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">
                    {language === "fa" ? "قیمت خرید (افغانی)" : language === "ps" ? "د پیرود قیمت (افغانۍ)" : "Buy Price (AFN)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.buy_price_afn}
                    onChange={e => setForm({ ...form, buy_price_afn: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">
                    {language === "fa" ? "قیمت خرید (دالر)" : language === "ps" ? "د پیرود قیمت (ډالر)" : "Buy Price (USD)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.buy_price_usd}
                    onChange={e => setForm({ ...form, buy_price_usd: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">
                    {language === "fa" ? "قیمت فروش (افغانی)" : language === "ps" ? "د پلور قیمت (افغانۍ)" : "Sell Price (AFN)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.sell_price_afn}
                    onChange={e => setForm({ ...form, sell_price_afn: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">
                    {language === "fa" ? "قیمت فروش (دالر)" : language === "ps" ? "د پلور قیمت (ډالر)" : "Sell Price (USD)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.sell_price_usd}
                    onChange={e => setForm({ ...form, sell_price_usd: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">
                    {language === "fa" ? "موجودی/تعداد *" : language === "ps" ? "موجودي/شمیر *" : "Stock/Quantity *"}
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={e => setForm({ ...form, stock: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">
                    {language === "fa" ? "حداقل موجودی (کمبود دستی) *" : language === "ps" ? "لږترلږه موجودي *" : "Minimum Stock *"}
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={form.min_stock}
                    onChange={e => setForm({ ...form, min_stock: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {language === "fa" ? "هشدار هنگام رسیدن به این مقدار" : language === "ps" ? "دې مقدار ته رسیدو پر وخت خبرتیا" : "Alert when reaching this amount"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">
                    {language === "fa" ? "بارکود" : language === "ps" ? "بارکوډ" : "Barcode"}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.barcode}
                      onChange={e => setForm({ ...form, barcode: e.target.value })}
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 font-mono"
                      placeholder={language === "fa" ? "بارکود (اختیاری)" : language === "ps" ? "بارکوډ (اختیاري)" : "Barcode (optional)"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowBarcodeCamera(true)}
                      className="flex items-center gap-1 px-3 py-2 border border-blue-200 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors text-sm"
                      title={language === "fa" ? "اسکن با دوربین" : "Scan with camera"}
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1.5">
                  {language === "fa" ? "توضیحات" : language === "ps" ? "تفصیل" : "Description"}
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 resize-none"
                  placeholder={language === "fa" ? "توضیحات اختیاری..." : language === "ps" ? "اختیاري تفصیل..." : "Optional description..."}
                />
              </div>

              {/* Supplier Section - فقط برای جنس جدید */}
              {!editProduct && (
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Truck className="w-4 h-4 text-orange-500" />
                    <h4 className="text-gray-700 text-sm" style={{ fontWeight: 600 }}>
                      {language === "fa" ? "اطلاعات سپلایر (اختیاری)" :
                       language === "ps" ? "د سپلایر معلومات (اختیاري)" :
                       "Supplier Info (Optional)"}
                    </h4>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-4 space-y-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1.5">
                        {language === "fa" ? "انتخاب سپلایر" :
                         language === "ps" ? "سپلایر انتخاب کړئ" :
                         "Select Supplier"}
                      </label>
                      <select
                        value={form.supplier_id}
                        onChange={e => setForm({ ...form, supplier_id: e.target.value })}
                        className="w-full border border-orange-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 bg-white"
                      >
                        <option value="">
                          {language === "fa" ? "بدون سپلایر" :
                           language === "ps" ? "بې سپلایر" :
                           "No Supplier"}
                        </option>
                        {suppliers.map(s => (
                          <option key={s.supplier_id} value={s.supplier_id}>
                            {s.name} {s.company_name ? `- ${s.company_name}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {form.supplier_id && (
                      <>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1.5">
                            {language === "fa" ? "تاریخ خرید" :
                             language === "ps" ? "د پیرود تاریخ" :
                             "Purchase Date"}
                          </label>
                          <input
                            type="date"
                            value={form.purchase_date}
                            onChange={e => setForm({ ...form, purchase_date: e.target.value })}
                            className="w-full border border-orange-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400"
                          />
                        </div>

                        {/* مبلغ مجموع خودکار */}
                        {(totalAfnCost > 0 || totalUsdCost > 0) && (
                          <div className="bg-white rounded-lg p-3 border border-orange-200">
                            <p className="text-xs text-gray-500 mb-2">
                              {language === "fa" ? "مبلغ مجموع خرید (محاسبه خودکار)" :
                               language === "ps" ? "د پیرود ټول مبلغ (اتوماتیک حساب)" :
                               "Total Purchase Amount (Auto-calculated)"}
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {totalAfnCost > 0 && (
                                <div>
                                  <p className="text-xs text-gray-400">
                                    {language === "fa" ? "افغانی" : language === "ps" ? "افغانۍ" : "AFN"}
                                  </p>
                                  <p className="text-orange-700 text-sm" style={{ fontWeight: 700 }}>
                                    {formatCurrency(totalAfnCost, "AFN")}
                                  </p>
                                </div>
                              )}
                              {totalUsdCost > 0 && (
                                <div>
                                  <p className="text-xs text-gray-400">
                                    {language === "fa" ? "دالر" : language === "ps" ? "ډالر" : "USD"}
                                  </p>
                                  <p className="text-orange-700 text-sm" style={{ fontWeight: 700 }}>
                                    {formatCurrency(totalUsdCost, "USD")}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm text-gray-600 mb-1.5">
                              {language === "fa" ? "پرداخت شده (افغانی)" :
                               language === "ps" ? "تادیه شوی (افغانۍ)" :
                               "Paid (AFN)"}
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={form.paid_amount_afn}
                              onChange={e => setForm({ ...form, paid_amount_afn: e.target.value })}
                              className="w-full border border-orange-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1.5">
                              {language === "fa" ? "پرداخت شده (دالر)" :
                               language === "ps" ? "تادیه شوی (ډالر)" :
                               "Paid (USD)"}
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={form.paid_amount_usd}
                              onChange={e => setForm({ ...form, paid_amount_usd: e.target.value })}
                              className="w-full border border-orange-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400"
                              placeholder="0.00"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm text-gray-600 mb-1.5">
                            {language === "fa" ? "جزئیات خرید" :
                             language === "ps" ? "د پیرود جزئیات" :
                             "Purchase Details"}
                          </label>
                          <textarea
                            value={form.purchase_description}
                            onChange={e => setForm({ ...form, purchase_description: e.target.value })}
                            rows={2}
                            className="w-full border border-orange-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 resize-none"
                            placeholder={language === "fa" ? "جزئیات بیشتر در مورد خرید..." : language === "ps" ? "د پیرود په اړه نور جزئیات..." : "More details about the purchase..."}
                          />
                        </div>

                        <p className="text-xs text-orange-600">
                          {language === "fa" ? "* این خرید به‌طور خودکار در حساب سپلایر ثبت می‌شود" :
                           language === "ps" ? "* دا پیرود په اتوماتیک ډول د سپلایر په حساب کې ثبت کیږي" :
                           "* This purchase will be automatically recorded to the supplier's account"}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-xl text-sm transition-colors"
                  style={{ fontWeight: 600 }}
                >
                  {editProduct
                    ? (language === "fa" ? "ذخیره تغییرات" : language === "ps" ? "بدلونونه ساتل" : "Save Changes")
                    : (language === "fa" ? "افزودن" : language === "ps" ? "اضافه کول" : "Add")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-sm transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  {language === "fa" ? "انصراف" : language === "ps" ? "لغوه" : "Cancel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir={language === "fa" || language === "ps" ? "rtl" : "ltr"}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-gray-800 mb-2" style={{ fontWeight: 700 }}>
              {language === "fa" ? "حذف جنس" : language === "ps" ? "توکی حذف کول" : "Delete Product"}
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              {language === "fa"
                ? "آیا مطمئن هستید که می‌خواهید این جنس را حذف کنید؟"
                : language === "ps"
                ? "ایا تاسو ډاډه یاست چې دا توکی حذف کول غواړئ؟"
                : "Are you sure you want to delete this product?"}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  deleteProduct(deleteConfirm);
                  setDeleteConfirm(null);
                  toast.success(language === "fa" ? "جنس حذف شد" : language === "ps" ? "توکی حذف شو" : "Product deleted");
                }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm transition-colors"
                style={{ fontWeight: 600 }}
              >
                {language === "fa" ? "بله، حذف شود" : language === "ps" ? "هو، حذف کړئ" : "Yes, Delete"}
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-sm transition-colors"
                style={{ fontWeight: 500 }}
              >
                {language === "fa" ? "انصراف" : language === "ps" ? "لغوه" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Barcode Scanner for product barcode assignment */}
      {showBarcodeCamera && (
        <BarcodeScanner
          language={language}
          onScan={(code) => {
            setForm(prev => ({ ...prev, barcode: code }));
            setShowBarcodeCamera(false);
            toast.success(language === "fa" ? `بارکود اسکن شد: ${code}` : `Barcode scanned: ${code}`);
          }}
          onClose={() => setShowBarcodeCamera(false)}
        />
      )}
    </div>
  );
}
