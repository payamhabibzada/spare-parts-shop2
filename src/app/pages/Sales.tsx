import { useState } from "react";
import { useApp, formatCurrency, Currency } from "../store/AppContext";
import {
  Plus,
  Search,
  Trash2,
  ShoppingCart,
  X,
  FileText,
  Eye,
  Printer,
  UserPlus,
  Camera,
} from "lucide-react";
import BarcodeScanner from "../components/BarcodeScanner";
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
import { toast } from "sonner";
import { printThermalReceipt } from "../utils/exportUtils";

interface SaleItemForm {
  product_id: string;
  quantity: number;
  price: number;
}

export default function Sales() {
  const {
    sales,
    customers,
    products,
    addSale,
    deleteSale,
    getSaleItems,
    getCustomerById,
    getProductById,
    addCustomer,
    language,
    currency,
  } = useApp();

  const [search, setSearch] = useState("");
  const [showNewSale, setShowNewSale] = useState(false);
  const [viewSale, setViewSale] = useState<string | null>(null);

  // New customer inline form
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currency);
  const [form, setForm] = useState({
    customer_id: customers[0]?.customer_id || "",
    date: today,
    items: [] as SaleItemForm[],
    discount: "0",
    paid_amount: "",
  });

  const [selectedProduct, setSelectedProduct] = useState("");
  const [qty, setQty] = useState("1");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [showCameraScanner, setShowCameraScanner] = useState(false);

  const filtered = [...sales]
    .filter((s) => {
      const customer = getCustomerById(s.customer_id);
      return (
        customer?.name.toLowerCase().includes(search.toLowerCase()) ||
        s.sale_id.includes(search) ||
        s.date.includes(search)
      );
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const subtotal = form.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = Number(form.discount) || 0;
  const totalAmount = Math.max(0, subtotal - discount);
  const paidAmount = Number(form.paid_amount) || 0;
  const remainingAmount = Math.max(0, totalAmount - paidAmount);

  const addItem = () => {
    if (!selectedProduct) return;
    const product = products.find((p) => p.product_id === selectedProduct);
    if (!product) return;
    const quantity = Number(qty) || 1;

    // بررسی موجودی
    if (product.stock === 0) {
      toast.error(
        language === "fa" ? `موجودی "${product.name}" به پایان رسیده است!` :
        language === "ps" ? `د "${product.name}" موجودي ختم شوی دی!` :
        `"${product.name}" is out of stock!`
      );
      return;
    }

    // محاسبه تعداد موجود در سبد
    const existingItem = form.items.find((i) => i.product_id === selectedProduct);
    const totalQuantity = existingItem ? existingItem.quantity + quantity : quantity;

    if (totalQuantity > product.stock) {
      toast.error(
        language === "fa" ? `موجودی کافی نیست! فقط ${product.stock} عدد موجود است` :
        language === "ps" ? `کافي موجودي نشته! یوازې ${product.stock} عدد شته` :
        `Not enough stock! Only ${product.stock} available`
      );
      return;
    }

    const priceField = selectedCurrency === "AFN" ? "sell_price_afn" : "sell_price_usd";

    const existing = form.items.findIndex((i) => i.product_id === selectedProduct);
    if (existing >= 0) {
      const newItems = [...form.items];
      newItems[existing] = { ...newItems[existing], quantity: newItems[existing].quantity + quantity };
      setForm({ ...form, items: newItems });
    } else {
      setForm({
        ...form,
        items: [...form.items, { product_id: selectedProduct, quantity, price: product[priceField] }],
      });
    }
    setSelectedProduct("");
    setQty("1");
  };

  const handleBarcodeSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addProductByBarcode(barcodeInput.trim());
    }
  };

  const addProductByBarcode = (barcode: string) => {
    if (!barcode) return;
    const product = products.find((p) => p.barcode === barcode);
    if (product) {
      if (product.stock === 0) {
        toast.error(language === "fa" ? `موجودی "${product.name}" به پایان رسیده است!` : `"${product.name}" is out of stock!`);
        setBarcodeInput("");
        return;
      }
      const priceField = selectedCurrency === "AFN" ? "sell_price_afn" : "sell_price_usd";
      const existing = form.items.findIndex((i) => i.product_id === product.product_id);
      if (existing >= 0) {
        if (form.items[existing].quantity + 1 > product.stock) {
          toast.error(language === "fa" ? `موجودی کافی نیست! فقط ${product.stock} عدد موجود است` : `Not enough stock! Only ${product.stock} available`);
          setBarcodeInput("");
          return;
        }
        const newItems = [...form.items];
        newItems[existing] = { ...newItems[existing], quantity: newItems[existing].quantity + 1 };
        setForm({ ...form, items: newItems });
      } else {
        setForm({
          ...form,
          items: [...form.items, { product_id: product.product_id, quantity: 1, price: product[priceField] }],
        });
      }
      toast.success(
        language === "fa"
          ? `✓ ${product.name} اضافه شد - موجودی: ${product.stock}`
          : `✓ ${product.name} added - Stock: ${product.stock}`
      );
      setBarcodeInput("");
    } else {
      toast.error(language === "fa" ? "محصولی با این بارکود یافت نشد" : "No product found with this barcode");
      setBarcodeInput("");
    }
  };

  const removeItem = (idx: number) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  };

  const updateItemQty = (idx: number, newQty: number) => {
    const newItems = [...form.items];
    newItems[idx] = { ...newItems[idx], quantity: Math.max(1, newQty) };
    setForm({ ...form, items: newItems });
  };

  const updateItemPrice = (idx: number, newPrice: number) => {
    const newItems = [...form.items];
    newItems[idx] = { ...newItems[idx], price: Math.max(0, newPrice) };
    setForm({ ...form, items: newItems });
  };

  const handleAddNewCustomer = () => {
    if (!newCustomerName.trim()) {
      toast.error(language === "fa" ? "نام مشتری الزامی است" : "Customer name is required");
      return;
    }

    const newCustomer = {
      name: newCustomerName,
      phone: newCustomerPhone,
      address: "",
      balance_afn: 0,
      balance_usd: 0,
    };

    addCustomer(newCustomer);
    toast.success(language === "fa" ? "مشتری جدید اضافه شد" : "New customer added");

    // Get the new customer (it will be the last one added)
    setTimeout(() => {
      const allCustomers = customers;
      const lastCustomer = allCustomers[allCustomers.length - 1];
      setForm({ ...form, customer_id: lastCustomer?.customer_id || "" });
    }, 100);

    setNewCustomerName("");
    setNewCustomerPhone("");
    setShowNewCustomerForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_id || form.items.length === 0) {
      toast.error(language === "fa" ? "لطفاً مشتری و اجناس را انتخاب کنید" : "Please select customer and items");
      return;
    }

    addSale(
      {
        customer_id: form.customer_id,
        date: form.date,
        currency: selectedCurrency,
        total_amount: totalAmount,
        discount: discount,
        paid_amount: paidAmount,
        remaining_amount: remainingAmount,
      },
      form.items
    );

    toast.success(language === "fa" ? "فاکتور ثبت شد" : "Invoice saved");
    setShowNewSale(false);
    setForm({ customer_id: customers[0]?.customer_id || "", date: today, items: [], discount: "0", paid_amount: "" });
  };

  const handlePrintReceipt = (saleId: string) => {
    const sale = sales.find((s) => s.sale_id === saleId);
    if (!sale) return;

    const customer = getCustomerById(sale.customer_id);
    const items = getSaleItems(saleId).map((item) => {
      const product = getProductById(item.product_id);
      return {
        name: product?.name || "Unknown",
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price,
      };
    });

    printThermalReceipt(
      customer?.name || "Walk-in Customer",
      customer?.phone || "-",
      items,
      sale.total_amount + sale.discount,
      sale.discount,
      sale.total_amount,
      sale.currency
    );
  };

  const selectedSale = viewSale ? sales.find((s) => s.sale_id === viewSale) : null;
  const selectedSaleItems = viewSale ? getSaleItems(viewSale) : [];

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex gap-3 items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === "fa" ? "جستجوی فاکتور..." : "Search invoices..."}
            className="pr-10"
          />
        </div>
        <Button onClick={() => setShowNewSale(true)} className="bg-blue-500 hover:bg-blue-600">
          <Plus className="w-4 h-4 ml-2" />
          {language === "fa" ? "فاکتور جدید" : "New Invoice"}
        </Button>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-right">
                <th className="px-4 py-3 text-gray-500" style={{ fontWeight: 500 }}>
                  {language === "fa" ? "شماره" : "#"}
                </th>
                <th className="px-4 py-3 text-gray-500" style={{ fontWeight: 500 }}>
                  {language === "fa" ? "مشتری" : "Customer"}
                </th>
                <th className="px-4 py-3 text-gray-500 hidden sm:table-cell" style={{ fontWeight: 500 }}>
                  {language === "fa" ? "تاریخ" : "Date"}
                </th>
                <th className="px-4 py-3 text-gray-500" style={{ fontWeight: 500 }}>
                  {language === "fa" ? "ارز" : "Currency"}
                </th>
                <th className="px-4 py-3 text-gray-500" style={{ fontWeight: 500 }}>
                  {language === "fa" ? "مبلغ کل" : "Total"}
                </th>
                <th className="px-4 py-3 text-gray-500" style={{ fontWeight: 500 }}>
                  {language === "fa" ? "باقی‌مانده" : "Remaining"}
                </th>
                <th className="px-4 py-3 text-gray-500 text-center" style={{ fontWeight: 500 }}>
                  {language === "fa" ? "عملیات" : "Actions"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-400">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>{language === "fa" ? "هیچ فاکتوری یافت نشد" : "No invoices found"}</p>
                  </td>
                </tr>
              ) : (
                filtered.map((sale) => {
                  const customer = getCustomerById(sale.customer_id);
                  return (
                    <tr key={sale.sale_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs" style={{ fontWeight: 600 }}>
                          #{sale.sale_id.split("_")[0].replace(/\D/g, "").slice(0, 6)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-800" style={{ fontWeight: 500 }}>
                        {customer?.name || "Unknown"}
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{sale.date}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{sale.currency}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-800" style={{ fontWeight: 500 }}>
                        {formatCurrency(sale.total_amount, sale.currency)}
                      </td>
                      <td className="px-4 py-3">
                        {sale.remaining_amount === 0 ? (
                          <span className="bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full text-xs" style={{ fontWeight: 500 }}>
                            {language === "fa" ? "تسویه" : "Paid"}
                          </span>
                        ) : (
                          <span className="text-red-500" style={{ fontWeight: 600 }}>
                            {formatCurrency(sale.remaining_amount, sale.currency)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePrintReceipt(sale.sale_id)}
                            className="text-gray-400 hover:text-green-500"
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewSale(sale.sale_id)}
                            className="text-gray-400 hover:text-blue-500"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(language === "fa" ? "آیا مطمئن هستید؟" : "Are you sure?")) {
                                deleteSale(sale.sale_id);
                                toast.success(language === "fa" ? "فاکتور حذف شد" : "Invoice deleted");
                              }
                            }}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Sale Dialog */}
      <Dialog open={!!viewSale} onOpenChange={(o) => !o && setViewSale(null)}>
        <DialogContent className="max-w-lg" dir={language === "fa" ? "rtl" : "ltr"} aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              {language === "fa" ? "جزئیات فاکتور" : "Invoice Details"}
            </DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs mb-1">{language === "fa" ? "مشتری" : "Customer"}</p>
                  <p className="text-gray-800" style={{ fontWeight: 600 }}>
                    {getCustomerById(selectedSale.customer_id)?.name}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs mb-1">{language === "fa" ? "تاریخ" : "Date"}</p>
                  <p className="text-gray-800" style={{ fontWeight: 600 }}>
                    {selectedSale.date}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-gray-700 mb-2 text-sm" style={{ fontWeight: 600 }}>
                  {language === "fa" ? "اقلام فاکتور" : "Items"}
                </h4>
                <div className="space-y-2">
                  {selectedSaleItems.map((item) => {
                    const product = getProductById(item.product_id);
                    return (
                      <div key={item.id} className="flex justify-between items-center bg-gray-50 rounded-xl p-3 text-sm">
                        <div>
                          <p className="text-gray-800" style={{ fontWeight: 500 }}>
                            {product?.name || "Unknown"}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {item.quantity} × {formatCurrency(item.price, selectedSale.currency)}
                          </p>
                        </div>
                        <p className="text-gray-800" style={{ fontWeight: 600 }}>
                          {formatCurrency(item.quantity * item.price, selectedSale.currency)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
                {selectedSale.discount > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">{language === "fa" ? "مجموع قبل از تخفیف:" : "Subtotal:"}</span>
                      <span className="text-gray-800" style={{ fontWeight: 600 }}>
                        {formatCurrency(selectedSale.total_amount + selectedSale.discount, selectedSale.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">{language === "fa" ? "تخفیف:" : "Discount:"}</span>
                      <span className="text-red-600" style={{ fontWeight: 600 }}>
                        -{formatCurrency(selectedSale.discount, selectedSale.currency)}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">{language === "fa" ? "مبلغ کل:" : "Total:"}</span>
                  <span className="text-gray-800" style={{ fontWeight: 600 }}>
                    {formatCurrency(selectedSale.total_amount, selectedSale.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{language === "fa" ? "پرداخت شده:" : "Paid:"}</span>
                  <span className="text-emerald-600" style={{ fontWeight: 600 }}>
                    {formatCurrency(selectedSale.paid_amount, selectedSale.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{language === "fa" ? "باقی‌مانده:" : "Remaining:"}</span>
                  <span
                    className={selectedSale.remaining_amount > 0 ? "text-red-500" : "text-emerald-500"}
                    style={{ fontWeight: 700 }}
                  >
                    {formatCurrency(selectedSale.remaining_amount, selectedSale.currency)}
                  </span>
                </div>
              </div>

              <Button onClick={() => handlePrintReceipt(selectedSale.sale_id)} className="w-full bg-green-500 hover:bg-green-600">
                <Printer className="w-4 h-4 ml-2" />
                {language === "fa" ? "چاپ فاکتور" : "Print Invoice"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Sale Dialog */}
      <Dialog open={showNewSale} onOpenChange={setShowNewSale}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto" dir={language === "fa" ? "rtl" : "ltr"} aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{language === "fa" ? "ثبت فاکتور جدید" : "New Invoice"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Customer & Date & Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>{language === "fa" ? "مشتری *" : "Customer *"}</Label>
                {showNewCustomerForm ? (
                  <div className="space-y-2 p-3 bg-blue-50 rounded-xl">
                    <Input
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      placeholder={language === "fa" ? "نام مشتری" : "Customer name"}
                    />
                    <Input
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                      placeholder={language === "fa" ? "شماره تماس" : "Phone"}
                    />
                    <div className="flex gap-2">
                      <Button type="button" size="sm" onClick={handleAddNewCustomer} className="flex-1">
                        {language === "fa" ? "ذخیره" : "Save"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setShowNewCustomerForm(false)}
                        className="flex-1"
                      >
                        {language === "fa" ? "لغو" : "Cancel"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <select
                      required
                      value={form.customer_id}
                      onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
                    >
                      <option value="">{language === "fa" ? "انتخاب مشتری..." : "Select customer..."}</option>
                      {customers.map((c) => (
                        <option key={c.customer_id} value={c.customer_id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNewCustomerForm(true)}
                      className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
                    >
                      <Plus className="w-4 h-4 ml-1" />
                      {language === "fa" ? "اضافه کردن مشتری جدید" : "Add New Customer"}
                    </Button>
                  </div>
                )}
              </div>
              <div>
                <Label>{language === "fa" ? "تاریخ *" : "Date *"}</Label>
                <Input
                  required
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div>
                <Label>{language === "fa" ? "واحد پول *" : "Currency *"}</Label>
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value as Currency)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
                >
                  <option value="AFN">{language === "fa" ? "افغانی (AFN)" : "Afghani (AFN)"}</option>
                  <option value="USD">{language === "fa" ? "دالر (USD)" : "Dollar (USD)"}</option>
                </select>
              </div>
            </div>

            {/* Add Items */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <h4 className="text-gray-700 text-sm" style={{ fontWeight: 600 }}>
                {language === "fa" ? "افزودن جنس" : "Add Item"}
              </h4>

              {/* Barcode Scanner */}
              <div>
                <Label className="text-xs text-gray-500">
                  {language === "fa" ? "اسکن بارکود" : "Scan Barcode"}
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={handleBarcodeSearch}
                    placeholder={language === "fa" ? "اسکن یا وارد کردن بارکود... (Enter)" : "Scan or type barcode... (Enter)"}
                    className="font-mono flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCameraScanner(true)}
                    className="px-3 border-blue-200 text-blue-600 hover:bg-blue-50"
                    title={language === "fa" ? "اسکن با دوربین" : "Scan with camera"}
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-gray-50 px-2 text-gray-400">
                    {language === "fa" ? "یا انتخاب دستی" : "or manual selection"}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="flex-1 min-w-40 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
                >
                  <option value="">{language === "fa" ? "انتخاب جنس..." : "Select item..."}</option>
                  {products
                    .filter((p) => p.stock > 0)
                    .map((p) => {
                      const price = selectedCurrency === "AFN" ? p.sell_price_afn : p.sell_price_usd;
                      return (
                        <option key={p.product_id} value={p.product_id}>
                          {p.name} ({formatCurrency(price, selectedCurrency)})
                        </option>
                      );
                    })}
                </select>
                <Input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="w-20 text-center"
                  placeholder={language === "fa" ? "تعداد" : "Qty"}
                />
                <Button type="button" onClick={addItem} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Items List */}
            {form.items.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-gray-700 text-sm" style={{ fontWeight: 600 }}>
                  {language === "fa" ? "اقلام فاکتور" : "Invoice Items"}
                </h4>
                {form.items.map((item, idx) => {
                  const product = getProductById(item.product_id);
                  return (
                    <div key={idx} className="flex items-center gap-2 bg-blue-50 rounded-xl p-3">
                      <div className="flex-1">
                        <p className="text-gray-800 text-sm" style={{ fontWeight: 500 }}>
                          {product?.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500">{language === "fa" ? "تعداد:" : "Qty:"}</span>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItemQty(idx, Number(e.target.value))}
                          className="w-16 h-8 text-center"
                        />
                        <span className="text-gray-500">{language === "fa" ? "قیمت:" : "Price:"}</span>
                        <Input
                          type="number"
                          min="0"
                          value={item.price}
                          onChange={(e) => updateItemPrice(idx, Number(e.target.value))}
                          className="w-24 h-8 text-center"
                        />
                        <span className="text-blue-600" style={{ fontWeight: 600 }}>
                          {formatCurrency(item.quantity * item.price, selectedCurrency)}
                        </span>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(idx)} className="text-red-500">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Totals */}
            {form.items.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{language === "fa" ? "مجموع:" : "Subtotal:"}</span>
                  <span className="text-gray-800" style={{ fontWeight: 700 }}>
                    {formatCurrency(subtotal, selectedCurrency)}
                  </span>
                </div>
                <div>
                  <Label>{language === "fa" ? "تخفیف / دیسکونت" : "Discount"}</Label>
                  <Input
                    type="number"
                    min="0"
                    max={subtotal}
                    value={form.discount}
                    onChange={(e) => setForm({ ...form, discount: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{language === "fa" ? "مبلغ کل:" : "Total:"}</span>
                  <span className="text-gray-800" style={{ fontWeight: 700 }}>
                    {formatCurrency(totalAmount, selectedCurrency)}
                  </span>
                </div>
                <div>
                  <Label>{language === "fa" ? "مبلغ پرداخت شده" : "Amount Paid"}</Label>
                  <Input
                    type="number"
                    min="0"
                    max={totalAmount}
                    value={form.paid_amount}
                    onChange={(e) => setForm({ ...form, paid_amount: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{language === "fa" ? "باقی‌مانده (قرضه):" : "Remaining (Credit):"}</span>
                  <span className={remainingAmount > 0 ? "text-red-500" : "text-emerald-500"} style={{ fontWeight: 700 }}>
                    {formatCurrency(remainingAmount, selectedCurrency)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={form.items.length === 0} className="flex-1">
                {language === "fa" ? "ثبت فاکتور" : "Save Invoice"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowNewSale(false)} className="flex-1">
                {language === "fa" ? "انصراف" : "Cancel"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {/* Camera Barcode Scanner Modal */}
      {showCameraScanner && (
        <BarcodeScanner
          language={language}
          onScan={(code) => {
            setShowCameraScanner(false);
            addProductByBarcode(code);
          }}
          onClose={() => setShowCameraScanner(false)}
        />
      )}
    </div>
  );
}
