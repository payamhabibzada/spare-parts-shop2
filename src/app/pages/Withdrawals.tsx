import { useState, useMemo } from "react";
import { useApp, formatCurrency } from "../store/AppContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
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
import { Plus, Trash2, ArrowDownToLine, Calendar, User, FileSpreadsheet, FileDown, UserPlus, TrendingUp, Wallet } from "lucide-react";
import { toast } from "sonner";
import { exportToExcel, exportToPDF } from "../utils/exportUtils";

export default function Withdrawals() {
  const {
    withdrawals, addWithdrawal, deleteWithdrawal,
    customers, shareholders, addCustomer,
    sales, saleItems, products, expenses,
    language,
  } = useApp();

  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<"shareholder" | "customer">("shareholder");
  const [personName, setPersonName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [amountAfn, setAmountAfn] = useState("");
  const [amountUsd, setAmountUsd] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [filterName, setFilterName] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterCategory, setFilterCategory] = useState<"all" | "shareholder" | "customer">("all");

  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerAddress, setNewCustomerAddress] = useState("");

  // محاسبه لحظه‌ای سود خالص از داده‌های واقعی
  const { netProfitAfn, netProfitUsd } = useMemo(() => {
    const revenueAfn = sales.filter(s => s.currency === "AFN").reduce((sum, s) => sum + s.total_amount, 0);
    const revenueUsd = sales.filter(s => s.currency === "USD").reduce((sum, s) => sum + s.total_amount, 0);

    const cogsAfn = saleItems.reduce((sum, item) => {
      const sale = sales.find(s => s.sale_id === item.sale_id);
      if (sale?.currency === "AFN") {
        const product = products.find(p => p.product_id === item.product_id);
        return sum + (product?.buy_price_afn || 0) * item.quantity;
      }
      return sum;
    }, 0);

    const cogsUsd = saleItems.reduce((sum, item) => {
      const sale = sales.find(s => s.sale_id === item.sale_id);
      if (sale?.currency === "USD") {
        const product = products.find(p => p.product_id === item.product_id);
        return sum + (product?.buy_price_usd || 0) * item.quantity;
      }
      return sum;
    }, 0);

    const expAfn = expenses.reduce((sum, e) => sum + e.amount_afn, 0);
    const expUsd = expenses.reduce((sum, e) => sum + e.amount_usd, 0);

    return {
      netProfitAfn: Math.max(0, revenueAfn - cogsAfn - expAfn),
      netProfitUsd: Math.max(0, revenueUsd - cogsUsd - expUsd),
    };
  }, [sales, saleItems, products, expenses]);

  // محاسبه اطلاعات مالی هر سهام‌دار
  const getShareholderProfitInfo = (shName: string) => {
    const sh = shareholders.find(s => s.name === shName);
    if (!sh) return null;

    const totalShareAfn = (netProfitAfn * sh.share_percentage) / 100;
    const totalShareUsd = (netProfitUsd * sh.share_percentage) / 100;

    const withdrawnAfn = withdrawals
      .filter(w => w.category === "shareholder" && w.person_name === shName)
      .reduce((sum, w) => sum + w.amount_afn, 0);
    const withdrawnUsd = withdrawals
      .filter(w => w.category === "shareholder" && w.person_name === shName)
      .reduce((sum, w) => sum + w.amount_usd, 0);

    const availableAfn = totalShareAfn - withdrawnAfn;
    const availableUsd = totalShareUsd - withdrawnUsd;
    const debtAfn = availableAfn < 0 ? Math.abs(availableAfn) : 0;
    const debtUsd = availableUsd < 0 ? Math.abs(availableUsd) : 0;

    return { sh, totalShareAfn, totalShareUsd, withdrawnAfn, withdrawnUsd, availableAfn, availableUsd, debtAfn, debtUsd };
  };

  const handleAddNewCustomer = () => {
    if (!newCustomerName.trim()) {
      toast.error(
        language === "fa" ? "نام مشتری الزامی است" :
        language === "ps" ? "د پیرودونکي نوم اړین دی" :
        "Customer name is required"
      );
      return;
    }

    addCustomer({
      name: newCustomerName,
      phone: newCustomerPhone,
      address: newCustomerAddress,
      balance_afn: 0,
      balance_usd: 0,
    });

    toast.success(
      language === "fa" ? "مشتری جدید اضافه شد" :
      language === "ps" ? "نوی پیرودونکی اضافه شو" :
      "New customer added"
    );

    setShowNewCustomerForm(false);
    setNewCustomerName("");
    setNewCustomerPhone("");
    setNewCustomerAddress("");
  };

  const handleAdd = () => {
    if (category === "customer" && !customerId) {
      toast.error(language === "fa" ? "انتخاب مشتری الزامی است" : language === "ps" ? "د پیرودونکي انتخاب اړین دی" : "Customer selection is required");
      return;
    }

    if (category === "shareholder" && !personName.trim()) {
      toast.error(language === "fa" ? "نام سهام‌دار الزامی است" : language === "ps" ? "د ونډه لرونکي نوم اړین دی" : "Shareholder name is required");
      return;
    }

    const afn = parseFloat(amountAfn) || 0;
    const usd = parseFloat(amountUsd) || 0;

    if (afn === 0 && usd === 0) {
      toast.error(language === "fa" ? "لطفاً حداقل یک مبلغ وارد کنید" : language === "ps" ? "لږ تر لږه یو مبلغ ولیکئ" : "Please enter at least one amount");
      return;
    }

    // اعتبارسنجی برداشت سهام‌دار — اگر بیشتر از مفاد باشد، به‌عنوان قرض ثبت می‌شود
    if (category === "shareholder") {
      const info = getShareholderProfitInfo(personName);
      if (info) {
        const exceedsAfn = afn > 0 && afn > info.availableAfn;
        const exceedsUsd = usd > 0 && usd > info.availableUsd;

        if (exceedsAfn || exceedsUsd) {
          const confirmed = window.confirm(
            language === "fa"
              ? `هشدار: مبلغ برداشت از مفاد موجود بیشتر است. مبلغ اضافی به‌عنوان قرض از مفاد آینده کسر خواهد شد. آیا ادامه می‌دهید؟`
              : language === "ps"
              ? `خبرتیا: د وباسنې مقدار د موجودې ګټې څخه زیات دی. اضافي مقدار به د راتلونکي ګټې څخه کم شي. ایا دوام ورکوئ؟`
              : `Warning: Withdrawal exceeds available profit. The excess will be recorded as debt and deducted from future profits. Continue?`
          );
          if (!confirmed) return;
        }
      }
    }

    const selectedCustomer = category === "customer" ? customers.find(c => c.customer_id === customerId) : null;

    addWithdrawal({
      category,
      person_name: category === "customer" ? (selectedCustomer?.name || "") : personName,
      customer_id: category === "customer" ? customerId : undefined,
      amount_afn: afn,
      amount_usd: usd,
      date,
      description,
    });

    toast.success(language === "fa" ? "برداشت ثبت شد" : language === "ps" ? "وباسنه ثبت شوه" : "Withdrawal recorded");
    setOpen(false);
    setCategory("shareholder");
    setPersonName("");
    setCustomerId("");
    setAmountAfn("");
    setAmountUsd("");
    setDate(new Date().toISOString().split("T")[0]);
    setDescription("");
    setShowNewCustomerForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirm(language === "fa" ? "آیا مطمئن هستید؟" : language === "ps" ? "ایا تاسو ډاډه یاست؟" : "Are you sure?")) {
      deleteWithdrawal(id);
      toast.success(language === "fa" ? "برداشت حذف شد" : language === "ps" ? "وباسنه حذف شوه" : "Withdrawal deleted");
    }
  };

  const filteredWithdrawals = withdrawals.filter((w) => {
    const matchesName = filterName ? w.person_name.toLowerCase().includes(filterName.toLowerCase()) : true;
    const matchesDate = filterDate ? w.date === filterDate : true;
    const matchesCategory = filterCategory === "all" ? true : w.category === filterCategory;
    return matchesName && matchesDate && matchesCategory;
  });

  const totalAfn = filteredWithdrawals.reduce((sum, w) => sum + w.amount_afn, 0);
  const totalUsd = filteredWithdrawals.reduce((sum, w) => sum + w.amount_usd, 0);

  const handleExportExcel = () => {
    const data = filteredWithdrawals.map((w) => ({
      [language === "fa" ? "تاریخ" : language === "ps" ? "تاریخ" : "Date"]: w.date,
      [language === "fa" ? "نام شخص" : language === "ps" ? "نوم" : "Person"]: w.person_name,
      [language === "fa" ? "افغانی" : language === "ps" ? "افغانۍ" : "AFN"]: w.amount_afn,
      [language === "fa" ? "دالر" : language === "ps" ? "ډالر" : "USD"]: w.amount_usd,
      [language === "fa" ? "توضیحات" : language === "ps" ? "تفصیل" : "Description"]: w.description,
    }));
    exportToExcel(data, language === "fa" ? "لیست_برداشت‌ها" : language === "ps" ? "د_وباسنو_لیست" : "withdrawals_list");
    toast.success(language === "fa" ? "فایل Excel دانلود شد" : language === "ps" ? "Excel فایل ډاونلوډ شو" : "Excel file downloaded");
  };

  const handleExportPDF = () => {
    const headers = [
      language === "fa" ? "تاریخ" : language === "ps" ? "تاریخ" : "Date",
      language === "fa" ? "نام شخص" : language === "ps" ? "نوم" : "Person",
      language === "fa" ? "افغانی" : language === "ps" ? "افغانۍ" : "AFN",
      language === "fa" ? "دالر" : language === "ps" ? "ډالر" : "USD",
      language === "fa" ? "توضیحات" : language === "ps" ? "تفصیل" : "Description",
    ];
    const data = filteredWithdrawals.map((w) => [
      w.date,
      w.person_name,
      w.amount_afn.toString(),
      w.amount_usd.toString(),
      w.description || "-",
    ]);
    exportToPDF(
      language === "fa" ? "لیست برداشت‌ها" : language === "ps" ? "د وباسنو لیست" : "Withdrawals List",
      headers,
      data,
      language === "fa" || language === "ps" ? "rtl" : "ltr"
    );
    toast.success(language === "fa" ? "فایل PDF دانلود شد" : language === "ps" ? "PDF فایل ډاونلوډ شو" : "PDF file downloaded");
  };

  const selectedShareholderInfo = category === "shareholder" && personName
    ? getShareholderProfitInfo(personName)
    : null;

  return (
    <div className="space-y-4" dir={language === "fa" || language === "ps" ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setShowNewCustomerForm(false); setNewCustomerName(""); setNewCustomerPhone(""); setNewCustomerAddress(""); } }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-500 hover:bg-blue-600">
              <Plus className="w-4 h-4 ml-2" />
              {language === "fa" ? "ثبت برداشت جدید" : language === "ps" ? "نوې وباسنه ثبت کړئ" : "New Withdrawal"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" dir={language === "fa" || language === "ps" ? "rtl" : "ltr"} aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>
                {language === "fa" ? "ثبت برداشت جدید" : language === "ps" ? "د نوې وباسنې ثبت" : "New Withdrawal"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{language === "fa" ? "کتگوری" : language === "ps" ? "کټګوري" : "Category"}</Label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value as "shareholder" | "customer");
                    setPersonName("");
                    setCustomerId("");
                  }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
                >
                  <option value="shareholder">
                    {language === "fa" ? "سهام‌دار" : language === "ps" ? "ونډه لرونکی" : "Shareholder"}
                  </option>
                  <option value="customer">
                    {language === "fa" ? "مشتری" : language === "ps" ? "پیرودونکی" : "Customer"}
                  </option>
                </select>
              </div>

              {category === "shareholder" ? (
                <>
                  <div>
                    <Label>{language === "fa" ? "انتخاب سهام‌دار" : language === "ps" ? "ونډه لرونکی انتخاب" : "Select Shareholder"}</Label>
                    <select
                      value={personName}
                      onChange={(e) => setPersonName(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
                    >
                      <option value="">
                        {language === "fa" ? "انتخاب کنید..." : language === "ps" ? "انتخاب کړئ..." : "Select..."}
                      </option>
                      {shareholders.map((sh) => (
                        <option key={sh.shareholder_id} value={sh.name}>
                          {sh.name} - {sh.share_percentage}%
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* نمایش اطلاعات مالی لحظه‌ای */}
                  {selectedShareholderInfo && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 space-y-3">
                      <p className="text-green-800 text-sm" style={{ fontWeight: 700 }}>
                        {language === "fa" ? "وضعیت مالی سهام‌دار" :
                         language === "ps" ? "د ونډه لرونکي مالي حالت" :
                         "Shareholder Financial Status"}
                      </p>

                      {/* سهم کل مفاد */}
                      <div className="bg-white rounded-lg p-3 border border-green-100">
                        <div className="flex items-center gap-1.5 mb-2">
                          <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                          <p className="text-xs text-green-700" style={{ fontWeight: 600 }}>
                            {language === "fa" ? `سهم مفاد (${selectedShareholderInfo.sh.share_percentage}%)` :
                             language === "ps" ? `د ګټې برخه (${selectedShareholderInfo.sh.share_percentage}%)` :
                             `Profit Share (${selectedShareholderInfo.sh.share_percentage}%)`}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-xs text-gray-400">{language === "fa" ? "افغانی" : language === "ps" ? "افغانۍ" : "AFN"}</p>
                            <p className="text-green-700 text-sm" style={{ fontWeight: 700 }}>
                              {formatCurrency(selectedShareholderInfo.totalShareAfn, "AFN")}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">{language === "fa" ? "دالر" : language === "ps" ? "ډالر" : "USD"}</p>
                            <p className="text-green-700 text-sm" style={{ fontWeight: 700 }}>
                              {formatCurrency(selectedShareholderInfo.totalShareUsd, "USD")}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* برداشت‌های قبلی */}
                      {(selectedShareholderInfo.withdrawnAfn > 0 || selectedShareholderInfo.withdrawnUsd > 0) && (
                        <div className="bg-white rounded-lg p-3 border border-orange-100">
                          <div className="flex items-center gap-1.5 mb-2">
                            <ArrowDownToLine className="w-3.5 h-3.5 text-orange-500" />
                            <p className="text-xs text-orange-600" style={{ fontWeight: 600 }}>
                              {language === "fa" ? "قبلاً برداشت شده" :
                               language === "ps" ? "مخکې وباسل شوي" :
                               "Previously Withdrawn"}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {selectedShareholderInfo.withdrawnAfn > 0 && (
                              <div>
                                <p className="text-xs text-gray-400">{language === "fa" ? "افغانی" : language === "ps" ? "افغانۍ" : "AFN"}</p>
                                <p className="text-orange-600 text-sm" style={{ fontWeight: 600 }}>
                                  {formatCurrency(selectedShareholderInfo.withdrawnAfn, "AFN")}
                                </p>
                              </div>
                            )}
                            {selectedShareholderInfo.withdrawnUsd > 0 && (
                              <div>
                                <p className="text-xs text-gray-400">{language === "fa" ? "دالر" : language === "ps" ? "ډالر" : "USD"}</p>
                                <p className="text-orange-600 text-sm" style={{ fontWeight: 600 }}>
                                  {formatCurrency(selectedShareholderInfo.withdrawnUsd, "USD")}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* مفاد قابل برداشت یا بدهی */}
                      {(selectedShareholderInfo.debtAfn > 0 || selectedShareholderInfo.debtUsd > 0) ? (
                        <div className="bg-red-50 rounded-lg p-3 border border-red-300">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Wallet className="w-3.5 h-3.5 text-red-600" />
                            <p className="text-xs text-red-700" style={{ fontWeight: 700 }}>
                              {language === "fa" ? "باقی‌دار (بدهکار)" :
                               language === "ps" ? "پاتې پور (مقروض)" :
                               "Debtor (Overpaid)"}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {selectedShareholderInfo.debtAfn > 0 && (
                              <div>
                                <p className="text-xs text-gray-400">{language === "fa" ? "افغانی" : language === "ps" ? "افغانۍ" : "AFN"}</p>
                                <p className="text-lg text-red-700" style={{ fontWeight: 700 }}>
                                  {formatCurrency(selectedShareholderInfo.debtAfn, "AFN")}
                                </p>
                              </div>
                            )}
                            {selectedShareholderInfo.debtUsd > 0 && (
                              <div>
                                <p className="text-xs text-gray-400">{language === "fa" ? "دالر" : language === "ps" ? "ډالر" : "USD"}</p>
                                <p className="text-lg text-red-700" style={{ fontWeight: 700 }}>
                                  {formatCurrency(selectedShareholderInfo.debtUsd, "USD")}
                                </p>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-red-500 mt-2">
                            {language === "fa" ? "این مبلغ از مفاد آینده کسر خواهد شد" :
                             language === "ps" ? "دا مقدار به د راتلونکي ګټې څخه کم شي" :
                             "Will be deducted from future profits"}
                          </p>
                        </div>
                      ) : (
                        <div className="bg-white rounded-lg p-3 border border-emerald-200">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                            <p className="text-xs text-emerald-700" style={{ fontWeight: 700 }}>
                              {language === "fa" ? "مفاد قابل برداشت" :
                               language === "ps" ? "د وباسلو وړ ګټه" :
                               "Available Profit"}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-xs text-gray-400">{language === "fa" ? "افغانی" : language === "ps" ? "افغانۍ" : "AFN"}</p>
                              <p className={`text-lg ${selectedShareholderInfo.availableAfn > 0 ? "text-emerald-700" : "text-gray-400"}`} style={{ fontWeight: 700 }}>
                                {formatCurrency(selectedShareholderInfo.availableAfn, "AFN")}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">{language === "fa" ? "دالر" : language === "ps" ? "ډالر" : "USD"}</p>
                              <p className={`text-lg ${selectedShareholderInfo.availableUsd > 0 ? "text-emerald-700" : "text-gray-400"}`} style={{ fontWeight: 700 }}>
                                {formatCurrency(selectedShareholderInfo.availableUsd, "USD")}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* سرمایه */}
                      <div className="text-xs text-gray-500 flex justify-between">
                        <span>{language === "fa" ? "سرمایه:" : language === "ps" ? "پانګه:" : "Investment:"}</span>
                        <span>
                          {selectedShareholderInfo.sh.investment_amount_afn > 0 && formatCurrency(selectedShareholderInfo.sh.investment_amount_afn, "AFN")}
                          {selectedShareholderInfo.sh.investment_amount_usd > 0 && " + " + formatCurrency(selectedShareholderInfo.sh.investment_amount_usd, "USD")}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              ) : !showNewCustomerForm ? (
                <>
                  <div>
                    <Label>{language === "fa" ? "انتخاب مشتری" : language === "ps" ? "پیرودونکی انتخاب" : "Select Customer"}</Label>
                    <select
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
                    >
                      <option value="">
                        {language === "fa" ? "انتخاب کنید..." : language === "ps" ? "انتخاب کړئ..." : "Select..."}
                      </option>
                      {customers.map((c) => (
                        <option key={c.customer_id} value={c.customer_id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowNewCustomerForm(true)}
                  >
                    <UserPlus className="w-4 h-4 ml-2" />
                    {language === "fa" ? "اضافه کردن مشتری جدید" :
                    language === "ps" ? "نوی پیرودونکی اضافه کړئ" :
                    "Add New Customer"}
                  </Button>
                </>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-blue-800 text-sm mb-3" style={{ fontWeight: 600 }}>
                    {language === "fa" ? "مشتری جدید" :
                    language === "ps" ? "نوی پیرودونکی" :
                    "New Customer"}
                  </p>
                  <div className="space-y-3">
                    <div>
                      <Label>
                        {language === "fa" ? "نام مشتری *" :
                        language === "ps" ? "د پیرودونکي نوم *" :
                        "Customer Name *"}
                      </Label>
                      <Input
                        value={newCustomerName}
                        onChange={(e) => setNewCustomerName(e.target.value)}
                        placeholder={
                          language === "fa" ? "نام را وارد کنید" :
                          language === "ps" ? "نوم داخل کړئ" :
                          "Enter name"
                        }
                      />
                    </div>
                    <div>
                      <Label>
                        {language === "fa" ? "شماره تماس" :
                        language === "ps" ? "د اړیکې شمیره" :
                        "Phone Number"}
                      </Label>
                      <Input
                        value={newCustomerPhone}
                        onChange={(e) => setNewCustomerPhone(e.target.value)}
                        placeholder={language === "fa" ? "شماره تماس" : language === "ps" ? "د اړیکې شمیره" : "Phone number"}
                      />
                    </div>
                    <div>
                      <Label>{language === "fa" ? "آدرس" : language === "ps" ? "پته" : "Address"}</Label>
                      <Input
                        value={newCustomerAddress}
                        onChange={(e) => setNewCustomerAddress(e.target.value)}
                        placeholder={language === "fa" ? "آدرس" : language === "ps" ? "پته" : "Address"}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" onClick={handleAddNewCustomer} className="flex-1">
                        {language === "fa" ? "ذخیره" : language === "ps" ? "ثبت" : "Save"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowNewCustomerForm(false);
                          setNewCustomerName("");
                          setNewCustomerPhone("");
                          setNewCustomerAddress("");
                        }}
                      >
                        {language === "fa" ? "لغو" : language === "ps" ? "لغوه" : "Cancel"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{language === "fa" ? "مبلغ (افغانی)" : language === "ps" ? "مبلغ (افغانۍ)" : "Amount (AFN)"}</Label>
                  <Input
                    type="number"
                    value={amountAfn}
                    onChange={(e) => setAmountAfn(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>{language === "fa" ? "مبلغ (دالر)" : language === "ps" ? "مبلغ (ډالر)" : "Amount (USD)"}</Label>
                  <Input
                    type="number"
                    value={amountUsd}
                    onChange={(e) => setAmountUsd(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <Label>{language === "fa" ? "تاریخ" : language === "ps" ? "تاریخ" : "Date"}</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <Label>{language === "fa" ? "توضیحات" : language === "ps" ? "تفصیل" : "Description"}</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={language === "fa" ? "توضیحات اضافی..." : language === "ps" ? "اضافي تفصیل..." : "Additional notes..."}
                  rows={3}
                />
              </div>
              <Button onClick={handleAdd} className="w-full">
                {language === "fa" ? "ثبت برداشت" : language === "ps" ? "وباسنه ثبت" : "Record Withdrawal"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel} className="bg-green-50 hover:bg-green-100 text-green-700">
            <FileSpreadsheet className="w-4 h-4 ml-2" />
            {language === "fa" ? "اکسل" : language === "ps" ? "اکسل" : "Excel"}
          </Button>
          <Button variant="outline" onClick={handleExportPDF} className="bg-red-50 hover:bg-red-100 text-red-700">
            <FileDown className="w-4 h-4 ml-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <Label className="text-sm text-gray-600">
              {language === "fa" ? "کتگوری" : language === "ps" ? "کټګوري" : "Category"}
            </Label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as any)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
            >
              <option value="all">{language === "fa" ? "همه" : language === "ps" ? "ټول" : "All"}</option>
              <option value="shareholder">
                {language === "fa" ? "سهام‌دار" : language === "ps" ? "ونډه لرونکی" : "Shareholder"}
              </option>
              <option value="customer">
                {language === "fa" ? "مشتری" : language === "ps" ? "پیرودونکی" : "Customer"}
              </option>
            </select>
          </div>
          <div>
            <Label className="text-sm text-gray-600">
              <User className="w-4 h-4 inline ml-1" />
              {language === "fa" ? "فیلتر براساس نام" : language === "ps" ? "د نوم له مخې فلټر" : "Filter by Name"}
            </Label>
            <Input
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder={language === "fa" ? "جستجوی نام..." : language === "ps" ? "نوم لټون..." : "Search name..."}
            />
          </div>
          <div>
            <Label className="text-sm text-gray-600">
              <Calendar className="w-4 h-4 inline ml-1" />
              {language === "fa" ? "فیلتر براساس تاریخ" : language === "ps" ? "د تاریخ له مخې فلټر" : "Filter by Date"}
            </Label>
            <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setFilterCategory("all");
                setFilterName("");
                setFilterDate("");
              }}
            >
              {language === "fa" ? "پاک کردن فیلتر" : language === "ps" ? "فلټر پاک کول" : "Clear Filters"}
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-3 mb-2">
            <ArrowDownToLine className="w-6 h-6" />
            <p className="text-purple-100 text-sm">
              {language === "fa" ? "کل برداشت (افغانی)" : language === "ps" ? "ټول وباسنه (افغانۍ)" : "Total Withdrawals (AFN)"}
            </p>
          </div>
          <p className="text-3xl" style={{ fontWeight: 700 }}>
            {formatCurrency(totalAfn, "AFN")}
          </p>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-3 mb-2">
            <ArrowDownToLine className="w-6 h-6" />
            <p className="text-indigo-100 text-sm">
              {language === "fa" ? "کل برداشت (دالر)" : language === "ps" ? "ټول وباسنه (ډالر)" : "Total Withdrawals (USD)"}
            </p>
          </div>
          <p className="text-3xl" style={{ fontWeight: 700 }}>
            {formatCurrency(totalUsd, "USD")}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">{language === "fa" ? "تاریخ" : language === "ps" ? "تاریخ" : "Date"}</TableHead>
              <TableHead className="text-right">{language === "fa" ? "کتگوری" : language === "ps" ? "کټګوري" : "Category"}</TableHead>
              <TableHead className="text-right">{language === "fa" ? "نام شخص" : language === "ps" ? "نوم" : "Person"}</TableHead>
              <TableHead className="text-right">{language === "fa" ? "افغانی" : language === "ps" ? "افغانۍ" : "AFN"}</TableHead>
              <TableHead className="text-right">{language === "fa" ? "دالر" : language === "ps" ? "ډالر" : "USD"}</TableHead>
              <TableHead className="text-right">{language === "fa" ? "توضیحات" : language === "ps" ? "تفصیل" : "Description"}</TableHead>
              <TableHead className="text-right">{language === "fa" ? "عملیات" : language === "ps" ? "عملیات" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredWithdrawals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                  {language === "fa" ? "برداشتی ثبت نشده است" : language === "ps" ? "وباسنه ثبت شوې نه ده" : "No withdrawals recorded"}
                </TableCell>
              </TableRow>
            ) : (
              filteredWithdrawals.map((w) => (
                <TableRow key={w.withdrawal_id}>
                  <TableCell>{w.date}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-md text-xs ${
                        w.category === "shareholder"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                      style={{ fontWeight: 500 }}
                    >
                      {w.category === "shareholder"
                        ? (language === "fa" ? "سهام‌دار" : language === "ps" ? "ونډه لرونکی" : "Shareholder")
                        : (language === "fa" ? "مشتری" : language === "ps" ? "پیرودونکی" : "Customer")}
                    </span>
                  </TableCell>
                  <TableCell style={{ fontWeight: 500 }}>{w.person_name}</TableCell>
                  <TableCell>{w.amount_afn > 0 ? formatCurrency(w.amount_afn, "AFN") : "-"}</TableCell>
                  <TableCell>{w.amount_usd > 0 ? formatCurrency(w.amount_usd, "USD") : "-"}</TableCell>
                  <TableCell className="text-gray-600 text-sm">{w.description || "-"}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(w.withdrawal_id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
