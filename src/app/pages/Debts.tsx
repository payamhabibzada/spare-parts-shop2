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
import {
  Search,
  Eye,
  CreditCard,
  Download,
  FileSpreadsheet,
  FileText,
  DollarSign,
  Users,
  TrendingUp,
  Plus,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";

export default function Debts() {
  const navigate = useNavigate();
  const { customers, addPayment, addCustomer, addWithdrawal, language, sales } = useApp();
  const [search, setSearch] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState<"all" | "AFN" | "USD">("all");

  // Payment dialog
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentCurrency, setPaymentCurrency] = useState<"AFN" | "USD">("AFN");
  const [paymentNote, setPaymentNote] = useState("");

  // New debt dialog
  const [newDebtDialog, setNewDebtDialog] = useState(false);
  const [debtCustomerId, setDebtCustomerId] = useState("");
  const [debtAmount, setDebtAmount] = useState("");
  const [debtCurrency, setDebtCurrency] = useState<"AFN" | "USD">("AFN");
  const [debtNote, setDebtNote] = useState("");

  // New customer dialog (inline)
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerAddress, setNewCustomerAddress] = useState("");

  // Only show customers with debts
  const debtorCustomers = customers.filter((c) => {
    const hasDebt = c.balance_afn > 0 || c.balance_usd > 0;
    if (!hasDebt) return false;

    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.toLowerCase().includes(search.toLowerCase());
    const matchesCurrency =
      currencyFilter === "all" ||
      (currencyFilter === "AFN" && c.balance_afn > 0) ||
      (currencyFilter === "USD" && c.balance_usd > 0);
    return matchesSearch && matchesCurrency;
  });

  // Calculate totals
  const totalDebtAfn = customers.reduce((sum, c) => sum + c.balance_afn, 0);
  const totalDebtUsd = customers.reduce((sum, c) => sum + c.balance_usd, 0);
  const debtorsCount = customers.filter((c) => c.balance_afn > 0 || c.balance_usd > 0).length;

  const handlePayment = () => {
    if (!selectedCustomer || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error(
        language === "fa" ? "لطفاً مبلغ را وارد کنید" :
        language === "ps" ? "مهرباني وکړئ مقدار داخل کړئ" :
        "Please enter amount"
      );
      return;
    }

    addPayment({
      customer_id: selectedCustomer,
      amount: parseFloat(paymentAmount),
      currency: paymentCurrency,
      date: new Date().toISOString().split("T")[0],
      note: paymentNote,
    });

    toast.success(
      language === "fa" ? "پرداخت ثبت شد" :
      language === "ps" ? "تادیه ثبت شوه" :
      "Payment recorded"
    );

    setPaymentDialog(false);
    setSelectedCustomer(null);
    setPaymentAmount("");
    setPaymentNote("");
  };

  const openPaymentDialog = (customerId: string) => {
    const customer = customers.find((c) => c.customer_id === customerId);
    if (customer) {
      setSelectedCustomer(customerId);
      setPaymentCurrency(customer.balance_afn > 0 ? "AFN" : "USD");
      setPaymentDialog(true);
    }
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

    // Get the newly added customer
    const newCustomerId = customers[customers.length]?.customer_id || "";
    setDebtCustomerId(newCustomerId);
    setShowNewCustomerForm(false);
    setNewCustomerName("");
    setNewCustomerPhone("");
    setNewCustomerAddress("");
  };

  const handleRecordNewDebt = () => {
    if (!debtCustomerId) {
      toast.error(
        language === "fa" ? "لطفاً مشتری را انتخاب کنید" :
        language === "ps" ? "مهرباني وکړئ پیرودونکی غوره کړئ" :
        "Please select a customer"
      );
      return;
    }

    if (!debtAmount || parseFloat(debtAmount) <= 0) {
      toast.error(
        language === "fa" ? "لطفاً مبلغ را وارد کنید" :
        language === "ps" ? "مهرباني وکړئ مقدار داخل کړئ" :
        "Please enter amount"
      );
      return;
    }

    // Find customer
    const customer = customers.find((c) => c.customer_id === debtCustomerId);
    if (customer) {
      // Record as withdrawal (customer category) - this automatically updates customer balance
      addWithdrawal({
        category: "customer",
        person_name: customer.name,
        customer_id: debtCustomerId,
        amount_afn: debtCurrency === "AFN" ? parseFloat(debtAmount) : 0,
        amount_usd: debtCurrency === "USD" ? parseFloat(debtAmount) : 0,
        date: new Date().toISOString().split("T")[0],
        description: debtNote || (language === "fa" ? "ثبت قرضه جدید" : language === "ps" ? "د نوي پور ثبت" : "New debt recorded"),
      });

      toast.success(
        language === "fa" ? "قرضه ثبت شد" :
        language === "ps" ? "پور ثبت شو" :
        "Debt recorded"
      );

      setNewDebtDialog(false);
      setDebtCustomerId("");
      setDebtAmount("");
      setDebtNote("");
    }
  };

  const exportToExcel = () => {
    const headers = ["نام", "تلفن", "قرضه افغانی", "قرضه دالر", "آخرین خرید"];
    const rows = debtorCustomers.map((c) => {
      const lastSale = sales
        .filter((s) => s.customer_id === c.customer_id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      return [
        c.name,
        c.phone,
        c.balance_afn,
        c.balance_usd,
        lastSale?.date || "-",
      ];
    });

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `debts_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    toast.success(
      language === "fa" ? "فایل اکسل دانلود شد" :
      language === "ps" ? "اکسل فایل ډاونلوډ شو" :
      "Excel file downloaded"
    );
  };

  const exportToPDF = () => {
    window.print();
    toast.info(
      language === "fa" ? "از دیالوگ چاپ، گزینه Save as PDF را انتخاب کنید" :
      language === "ps" ? "د چاپ له ډیالاګ څخه، Save as PDF غوره کړئ" :
      "From print dialog, select Save as PDF"
    );
  };

  const customer = selectedCustomer ? customers.find((c) => c.customer_id === selectedCustomer) : null;

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-5 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8" />
            <div>
              <p className="text-red-100 text-sm">
                {language === "fa" ? "کل قرضه (افغانی)" :
                language === "ps" ? "ټول پور (افغانۍ)" :
                "Total Debt (AFN)"}
              </p>
              <p className="text-2xl mt-1" style={{ fontWeight: 700 }}>
                {formatCurrency(totalDebtAfn, "AFN")}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8" />
            <div>
              <p className="text-orange-100 text-sm">
                {language === "fa" ? "کل قرضه (دالر)" :
                language === "ps" ? "ټول پور (ډالر)" :
                "Total Debt (USD)"}
              </p>
              <p className="text-2xl mt-1" style={{ fontWeight: 700 }}>
                {formatCurrency(totalDebtUsd, "USD")}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8" />
            <div>
              <p className="text-purple-100 text-sm">
                {language === "fa" ? "تعداد بدهکاران" :
                language === "ps" ? "د پوروالانو شمیر" :
                "Debtors Count"}
              </p>
              <p className="text-2xl mt-1" style={{ fontWeight: 700 }}>
                {debtorsCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Header with Record New Debt Button */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <Dialog open={newDebtDialog} onOpenChange={setNewDebtDialog}>
          <DialogTrigger asChild>
            <Button className="bg-green-500 hover:bg-green-600">
              <Plus className="w-4 h-4 ml-2" />
              {language === "fa" ? "ثبت قرضه جدید" :
              language === "ps" ? "د نوي پور ثبت" :
              "Record New Debt"}
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* Filters and Export */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-3 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className={`absolute ${language === "fa" || language === "ps" ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                language === "fa" ? "جستجوی نام یا تلفن..." :
                language === "ps" ? "د نوم یا تلفن لټون..." :
                "Search name or phone..."
              }
              className={language === "fa" || language === "ps" ? "pr-10" : "pl-10"}
            />
          </div>
          <select
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value as "all" | "AFN" | "USD")}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white"
          >
            <option value="all">
              {language === "fa" ? "همه واحدها" : language === "ps" ? "ټولې واحدې" : "All Currencies"}
            </option>
            <option value="AFN">
              {language === "fa" ? "افغانی" : language === "ps" ? "افغانۍ" : "AFN"}
            </option>
            <option value="USD">
              {language === "fa" ? "دالر" : language === "ps" ? "ډالر" : "USD"}
            </option>
          </select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportToExcel}>
            <FileSpreadsheet className="w-4 h-4 ml-2" />
            {language === "fa" ? "اکسل" : language === "ps" ? "اکسل" : "Excel"}
          </Button>
          <Button variant="outline" size="sm" onClick={exportToPDF}>
            <FileText className="w-4 h-4 ml-2" />
            {language === "fa" ? "PDF" : "PDF"}
          </Button>
        </div>
      </div>

      {/* Debtors Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">
                {language === "fa" ? "مشتری" : language === "ps" ? "پیرودونکی" : "Customer"}
              </TableHead>
              <TableHead className="text-right">
                {language === "fa" ? "تلفن" : language === "ps" ? "تلفون" : "Phone"}
              </TableHead>
              <TableHead className="text-right">
                {language === "fa" ? "قرضه افغانی" : language === "ps" ? "پور افغانۍ" : "Debt AFN"}
              </TableHead>
              <TableHead className="text-right">
                {language === "fa" ? "قرضه دالر" : language === "ps" ? "پور ډالر" : "Debt USD"}
              </TableHead>
              <TableHead className="text-right">
                {language === "fa" ? "عملیات" : language === "ps" ? "عملیات" : "Actions"}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {debtorCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                  {language === "fa" ? "بدهکاری ثبت نشده است" :
                  language === "ps" ? "پور ثبت شوی نه دی" :
                  "No debts recorded"}
                </TableCell>
              </TableRow>
            ) : (
              debtorCustomers.map((c) => (
                <TableRow key={c.customer_id}>
                  <TableCell style={{ fontWeight: 500 }}>{c.name}</TableCell>
                  <TableCell className="text-gray-600">{c.phone}</TableCell>
                  <TableCell>
                    {c.balance_afn > 0 ? (
                      <span className="text-red-600" style={{ fontWeight: 600 }}>
                        {formatCurrency(c.balance_afn, "AFN")}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {c.balance_usd > 0 ? (
                      <span className="text-red-600" style={{ fontWeight: 600 }}>
                        {formatCurrency(c.balance_usd, "USD")}
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
                        onClick={() => navigate(`/customer-profile/${c.customer_id}`)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openPaymentDialog(c.customer_id)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <CreditCard className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* New Debt Dialog */}
      {newDebtDialog && (
        <Dialog open={newDebtDialog} onOpenChange={(o) => { setNewDebtDialog(o); if (!o) { setShowNewCustomerForm(false); setDebtCustomerId(""); setDebtAmount(""); setDebtNote(""); } }}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" dir={language === "fa" || language === "ps" ? "rtl" : "ltr"} aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>
                {language === "fa" ? "ثبت قرضه جدید" :
                language === "ps" ? "د نوي پور ثبت" :
                "Record New Debt"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {!showNewCustomerForm ? (
                <>
                  <div>
                    <Label>
                      {language === "fa" ? "مشتری" : language === "ps" ? "پیرودونکی" : "Customer"}
                    </Label>
                    <select
                      value={debtCustomerId}
                      onChange={(e) => setDebtCustomerId(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white"
                    >
                      <option value="">
                        {language === "fa" ? "انتخاب مشتری..." :
                        language === "ps" ? "پیرودونکی غوره کړئ..." :
                        "Select customer..."}
                      </option>
                      {customers.map((c) => (
                        <option key={c.customer_id} value={c.customer_id}>
                          {c.name} - {c.phone}
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
                <>
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
                          placeholder={
                            language === "fa" ? "شماره تماس" :
                            language === "ps" ? "د اړیکې شمیره" :
                            "Phone number"
                          }
                        />
                      </div>
                      <div>
                        <Label>
                          {language === "fa" ? "آدرس" :
                          language === "ps" ? "پته" :
                          "Address"}
                        </Label>
                        <Input
                          value={newCustomerAddress}
                          onChange={(e) => setNewCustomerAddress(e.target.value)}
                          placeholder={
                            language === "fa" ? "آدرس" :
                            language === "ps" ? "پته" :
                            "Address"
                          }
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={handleAddNewCustomer}
                          className="flex-1"
                        >
                          {language === "fa" ? "ذخیره" :
                          language === "ps" ? "ثبت" :
                          "Save"}
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
                          {language === "fa" ? "لغو" :
                          language === "ps" ? "لغوه" :
                          "Cancel"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {!showNewCustomerForm && (
                <>
                  <div>
                    <Label>
                      {language === "fa" ? "واحد پول" :
                      language === "ps" ? "د پیسو واحد" :
                      "Currency"}
                    </Label>
                    <select
                      value={debtCurrency}
                      onChange={(e) => setDebtCurrency(e.target.value as "AFN" | "USD")}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white"
                    >
                      <option value="AFN">
                        {language === "fa" ? "افغانی" : language === "ps" ? "افغانۍ" : "AFN"}
                      </option>
                      <option value="USD">
                        {language === "fa" ? "دالر" : language === "ps" ? "ډالر" : "USD"}
                      </option>
                    </select>
                  </div>
                  <div>
                    <Label>
                      {language === "fa" ? "مبلغ قرضه" :
                      language === "ps" ? "د پور مقدار" :
                      "Debt Amount"}
                    </Label>
                    <Input
                      type="number"
                      value={debtAmount}
                      onChange={(e) => setDebtAmount(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>
                      {language === "fa" ? "یادداشت" :
                      language === "ps" ? "یادښت" :
                      "Note"}
                    </Label>
                    <Input
                      value={debtNote}
                      onChange={(e) => setDebtNote(e.target.value)}
                      placeholder={
                        language === "fa" ? "یادداشت اختیاری..." :
                        language === "ps" ? "اختیاري یادښت..." :
                        "Optional note..."
                      }
                    />
                  </div>
                  <Button onClick={handleRecordNewDebt} className="w-full bg-green-500 hover:bg-green-600">
                    {language === "fa" ? "ثبت قرضه" :
                    language === "ps" ? "پور ثبت کړئ" :
                    "Record Debt"}
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Payment Dialog */}
      {paymentDialog && customer && (
        <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
          <DialogContent className="max-w-md" dir={language === "fa" || language === "ps" ? "rtl" : "ltr"} aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>
                {language === "fa" ? "ثبت پرداخت" :
                language === "ps" ? "تادیه ثبت" :
                "Record Payment"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>
                  {language === "fa" ? "مشتری" : language === "ps" ? "پیرودونکی" : "Customer"}
                </Label>
                <Input value={customer.name} disabled />
              </div>
              <div>
                <Label>
                  {language === "fa" ? "قرضه باقی‌مانده" :
                  language === "ps" ? "پاتې پور" :
                  "Remaining Debt"}
                </Label>
                <div className="flex gap-2 mt-1">
                  {customer.balance_afn > 0 && (
                    <span className="text-red-600" style={{ fontWeight: 600 }}>
                      {formatCurrency(customer.balance_afn, "AFN")}
                    </span>
                  )}
                  {customer.balance_usd > 0 && (
                    <span className="text-red-600" style={{ fontWeight: 600 }}>
                      {formatCurrency(customer.balance_usd, "USD")}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <Label>
                  {language === "fa" ? "واحد پول" : language === "ps" ? "د پیسو واحد" : "Currency"}
                </Label>
                <select
                  value={paymentCurrency}
                  onChange={(e) => setPaymentCurrency(e.target.value as "AFN" | "USD")}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white"
                >
                  <option value="AFN">
                    {language === "fa" ? "افغانی" : language === "ps" ? "افغانۍ" : "AFN"}
                  </option>
                  <option value="USD">
                    {language === "fa" ? "دالر" : language === "ps" ? "ډالر" : "USD"}
                  </option>
                </select>
              </div>
              <div>
                <Label>
                  {language === "fa" ? "مبلغ پرداختی" :
                  language === "ps" ? "تادیه شوې مقدار" :
                  "Payment Amount"}
                </Label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0"
                />
                <div className="flex gap-2 mt-2">
                  {paymentCurrency === "AFN" && customer.balance_afn > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPaymentAmount(customer.balance_afn.toString())}
                    >
                      {language === "fa" ? "پرداخت کامل" :
                      language === "ps" ? "بشپړ تادیه" :
                      "Pay Full"} ({formatCurrency(customer.balance_afn, "AFN")})
                    </Button>
                  )}
                  {paymentCurrency === "USD" && customer.balance_usd > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPaymentAmount(customer.balance_usd.toString())}
                    >
                      {language === "fa" ? "پرداخت کامل" :
                      language === "ps" ? "بشپړ تادیه" :
                      "Pay Full"} ({formatCurrency(customer.balance_usd, "USD")})
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <Label>
                  {language === "fa" ? "یادداشت" : language === "ps" ? "یادښت" : "Note"}
                </Label>
                <Input
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder={
                    language === "fa" ? "یادداشت اختیاری..." :
                    language === "ps" ? "اختیاري یادښت..." :
                    "Optional note..."
                  }
                />
              </div>
              <Button onClick={handlePayment} className="w-full bg-green-500 hover:bg-green-600">
                {language === "fa" ? "ثبت پرداخت" :
                language === "ps" ? "تادیه ثبت کړئ" :
                "Record Payment"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
