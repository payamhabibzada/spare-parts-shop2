import { useState } from "react";
import { useApp, formatCurrency } from "../store/AppContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Plus, Search, Trash2, Edit, Users, AlertTriangle, Eye, FileDown, FileSpreadsheet, Printer, ShoppingCart, CreditCard, ArrowDownToLine } from "lucide-react";
import { toast } from "sonner";
import { exportToExcel, exportToPDF } from "../utils/exportUtils";

export default function Customers() {
  const { customers, addCustomer, updateCustomer, deleteCustomer, sales, payments, withdrawals, getSaleItems, getProductById, language, currency } = useApp();

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<any>(null);
  const [viewCustomer, setViewCustomer] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const filtered = customers.filter((c) => {
    return (
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.address.toLowerCase().includes(search.toLowerCase())
    );
  });

  const totalDebtAfn = customers.reduce((a, c) => a + c.balance_afn, 0);
  const totalDebtUsd = customers.reduce((a, c) => a + c.balance_usd, 0);

  const resetForm = () => {
    setName("");
    setPhone("");
    setAddress("");
    setEditMode(false);
    setCurrentCustomer(null);
  };

  const handleAdd = () => {
    if (!name.trim()) {
      toast.error(language === "fa" ? "نام الزامی است" : "Name is required");
      return;
    }

    const data = {
      name,
      phone,
      address,
      balance_afn: 0,
      balance_usd: 0,
    };

    if (editMode && currentCustomer) {
      updateCustomer({ ...currentCustomer, ...data });
      toast.success(language === "fa" ? "مشتری بروزرسانی شد" : "Customer updated");
    } else {
      addCustomer(data);
      toast.success(language === "fa" ? "مشتری اضافه شد" : "Customer added");
    }

    setShowModal(false);
    resetForm();
  };

  const handleEdit = (c: any) => {
    setCurrentCustomer(c);
    setName(c.name);
    setPhone(c.phone);
    setAddress(c.address);
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    const customer = customers.find((c) => c.customer_id === id);
    if (customer && (customer.balance_afn > 0 || customer.balance_usd > 0)) {
      toast.error(
        language === "fa"
          ? "نمی‌توان مشتری با قرضه باقیمانده را حذف کرد"
          : "Cannot delete customer with outstanding debt"
      );
      return;
    }

    if (confirm(language === "fa" ? "آیا مطمئن هستید؟" : "Are you sure?")) {
      deleteCustomer(id);
      toast.success(language === "fa" ? "مشتری حذف شد" : "Customer deleted");
    }
  };

  const handleExportExcel = () => {
    const data = filtered.map((c) => ({
      [language === "fa" ? "نام" : "Name"]: c.name,
      [language === "fa" ? "شماره تماس" : "Phone"]: c.phone,
      [language === "fa" ? "آدرس" : "Address"]: c.address,
      [language === "fa" ? "قرضه (افغانی)" : "Debt (AFN)"]: c.balance_afn,
      [language === "fa" ? "قرضه (دالر)" : "Debt (USD)"]: c.balance_usd,
    }));
    exportToExcel(data, language === "fa" ? "لیست_مشتریان" : "customers_list");
    toast.success(language === "fa" ? "فایل Excel دانلود شد" : "Excel file downloaded");
  };

  const handleExportPDF = () => {
    const columns = [
      language === "fa" ? "نام" : "Name",
      language === "fa" ? "شماره تماس" : "Phone",
      language === "fa" ? "آدرس" : "Address",
      language === "fa" ? "قرضه (AFN)" : "Debt (AFN)",
      language === "fa" ? "قرضه (USD)" : "Debt (USD)",
    ];
    const rows = filtered.map((c) => [c.name, c.phone, c.address, c.balance_afn.toFixed(2), c.balance_usd.toFixed(2)]);
    exportToPDF(columns, rows, language === "fa" ? "لیست_مشتریان" : "customers_list", language === "fa" ? "لیست مشتریان" : "Customers List");
    toast.success(language === "fa" ? "فایل PDF دانلود شد" : "PDF file downloaded");
  };

  const selectedCustomer = viewCustomer ? customers.find((c) => c.customer_id === viewCustomer) : null;
  const customerSales = viewCustomer ? sales.filter((s) => s.customer_id === viewCustomer) : [];
  const customerPayments = viewCustomer ? payments.filter((p) => p.customer_id === viewCustomer) : [];
  const customerWithdrawals = viewCustomer ? withdrawals.filter((w) => w.category === "customer" && w.customer_id === viewCustomer) : [];

  const allTransactions = [
    ...customerSales.map(s => ({ type: "sale" as const, date: s.date, time: s.time || "00:00", data: s })),
    ...customerPayments.map(p => ({ type: "payment" as const, date: p.date, time: "00:00", data: p })),
    ...customerWithdrawals.map(w => ({ type: "withdrawal" as const, date: w.date, time: "00:00", data: w })),
  ].sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());

  const totalSalesAfn = customerSales.filter(s => s.currency === "AFN").reduce((sum, s) => sum + s.total_amount, 0);
  const totalSalesUsd = customerSales.filter(s => s.currency === "USD").reduce((sum, s) => sum + s.total_amount, 0);
  const totalPaymentsAfn = customerPayments.filter(p => p.currency === "AFN").reduce((sum, p) => sum + p.amount, 0);
  const totalPaymentsUsd = customerPayments.filter(p => p.currency === "USD").reduce((sum, p) => sum + p.amount, 0);

  const handlePrintCustomerHistory = () => {
    if (!selectedCustomer) return;
    const lang = language;
    const printContent = `
      <html>
        <head>
          <title>${selectedCustomer.name}</title>
          <style>
            @media print { @page { size: A4; margin: 15mm; } }
            body { font-family: Arial, sans-serif; font-size: 13px; direction: ${lang === "fa" || lang === "ps" ? "rtl" : "ltr"}; }
            h1 { font-size: 20px; margin-bottom: 4px; }
            .sub { color: #666; font-size: 12px; margin-bottom: 16px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: #f9f9f9; padding: 12px; border-radius: 8px; margin-bottom: 16px; }
            .info-item label { font-size: 11px; color: #888; display: block; }
            .info-item span { font-weight: 700; }
            .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px; }
            .summary-card { background: #f0f7ff; border: 1px solid #c3ddf5; border-radius: 8px; padding: 10px; text-align: center; }
            .summary-card label { font-size: 11px; color: #555; display: block; margin-bottom: 4px; }
            .summary-card span { font-size: 14px; font-weight: 700; color: #1a56db; }
            .debt-card { background: #fff0f0; border-color: #f5c3c3; }
            .debt-card span { color: #c01; }
            h3 { font-size: 15px; border-bottom: 2px solid #e0e0e0; padding-bottom: 6px; margin-top: 20px; margin-bottom: 10px; }
            .tx { border: 1px solid #e5e5e5; border-radius: 6px; padding: 10px; margin-bottom: 8px; }
            .tx-header { display: flex; justify-content: space-between; font-weight: 700; margin-bottom: 4px; }
            .tx-sale { background: #f0f5ff; border-color: #c0d3f5; }
            .tx-payment { background: #f0faf0; border-color: #b8e6b8; }
            .tx-withdrawal { background: #f5f0ff; border-color: #d0b8f0; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
            .badge-sale { background: #dbeafe; color: #1d4ed8; }
            .badge-payment { background: #dcfce7; color: #15803d; }
            .badge-withdrawal { background: #ede9fe; color: #7c3aed; }
            .item-row { display: flex; justify-content: space-between; font-size: 11px; color: #444; border-top: 1px dashed #eee; padding-top: 4px; margin-top: 4px; }
            .footer { text-align: center; margin-top: 24px; padding-top: 12px; border-top: 2px dashed #ccc; color: #888; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>${selectedCustomer.name}</h1>
          <div class="sub">${lang === "fa" ? "تاریخچه کامل مشتری" : "Complete Customer History"} — ${new Date().toLocaleDateString("fa-AF")}</div>

          <div class="info-grid">
            <div class="info-item"><label>${lang === "fa" ? "نام" : "Name"}</label><span>${selectedCustomer.name}</span></div>
            <div class="info-item"><label>${lang === "fa" ? "شماره تماس" : "Phone"}</label><span>${selectedCustomer.phone || "-"}</span></div>
            <div class="info-item"><label>${lang === "fa" ? "آدرس" : "Address"}</label><span>${selectedCustomer.address || "-"}</span></div>
          </div>

          <div class="summary">
            ${totalSalesAfn > 0 ? `<div class="summary-card"><label>${lang === "fa" ? "کل خرید (افغانی)" : "Total Sales (AFN)"}</label><span>${formatCurrency(totalSalesAfn, "AFN")}</span></div>` : ""}
            ${totalSalesUsd > 0 ? `<div class="summary-card"><label>${lang === "fa" ? "کل خرید (دالر)" : "Total Sales (USD)"}</label><span>${formatCurrency(totalSalesUsd, "USD")}</span></div>` : ""}
            ${totalPaymentsAfn > 0 ? `<div class="summary-card"><label>${lang === "fa" ? "کل پرداخت (افغانی)" : "Total Paid (AFN)"}</label><span>${formatCurrency(totalPaymentsAfn, "AFN")}</span></div>` : ""}
            ${totalPaymentsUsd > 0 ? `<div class="summary-card"><label>${lang === "fa" ? "کل پرداخت (دالر)" : "Total Paid (USD)"}</label><span>${formatCurrency(totalPaymentsUsd, "USD")}</span></div>` : ""}
            ${selectedCustomer.balance_afn > 0 ? `<div class="summary-card debt-card"><label>${lang === "fa" ? "قرضه (افغانی)" : "Debt (AFN)"}</label><span>${formatCurrency(selectedCustomer.balance_afn, "AFN")}</span></div>` : ""}
            ${selectedCustomer.balance_usd > 0 ? `<div class="summary-card debt-card"><label>${lang === "fa" ? "قرضه (دالر)" : "Debt (USD)"}</label><span>${formatCurrency(selectedCustomer.balance_usd, "USD")}</span></div>` : ""}
          </div>

          <h3>${lang === "fa" ? "تاریخچه تراکنش‌ها" : "Transaction History"} (${allTransactions.length})</h3>
          ${allTransactions.map(tx => {
            if (tx.type === "sale") {
              const s = tx.data as typeof customerSales[0];
              const items = getSaleItems(s.sale_id);
              return `<div class="tx tx-sale">
                <div class="tx-header">
                  <div><span class="badge badge-sale">${lang === "fa" ? "خرید" : "Sale"}</span> &nbsp; ${s.date}</div>
                  <span>${formatCurrency(s.total_amount, s.currency)}</span>
                </div>
                ${items.map(item => {
                  const p = getProductById(item.product_id);
                  return `<div class="item-row"><span>${p?.name || "-"} × ${item.quantity}</span><span>${formatCurrency(item.quantity * item.price, s.currency)}</span></div>`;
                }).join("")}
                <div class="item-row"><span style="color:#15803d">${lang === "fa" ? "پرداخت:" : "Paid:"}</span><span style="color:#15803d;font-weight:700">${formatCurrency(s.paid_amount, s.currency)}</span></div>
                ${s.remaining_amount > 0 ? `<div class="item-row"><span style="color:#c01">${lang === "fa" ? "باقی:" : "Remaining:"}</span><span style="color:#c01;font-weight:700">${formatCurrency(s.remaining_amount, s.currency)}</span></div>` : ""}
              </div>`;
            } else if (tx.type === "payment") {
              const p = tx.data as typeof customerPayments[0];
              return `<div class="tx tx-payment">
                <div class="tx-header">
                  <div><span class="badge badge-payment">${lang === "fa" ? "پرداخت" : "Payment"}</span> &nbsp; ${p.date}</div>
                  <span style="color:#15803d">${formatCurrency(p.amount, p.currency)}</span>
                </div>
                ${p.note ? `<div style="font-size:11px;color:#555">${p.note}</div>` : ""}
              </div>`;
            } else {
              const w = tx.data as typeof customerWithdrawals[0];
              return `<div class="tx tx-withdrawal">
                <div class="tx-header">
                  <div><span class="badge badge-withdrawal">${lang === "fa" ? "قرضه نقدی" : "Cash Debt"}</span> &nbsp; ${w.date}</div>
                  <span style="color:#7c3aed">${w.amount_afn > 0 ? formatCurrency(w.amount_afn, "AFN") : formatCurrency(w.amount_usd, "USD")}</span>
                </div>
                ${w.description ? `<div style="font-size:11px;color:#555">${w.description}</div>` : ""}
              </div>`;
            }
          }).join("")}

          <div class="footer">${lang === "fa" ? "پایان گزارش" : "End of Report"} — ${new Date().toLocaleString()}</div>
        </body>
      </html>
    `;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(printContent);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); win.close(); }, 300);
    }
    toast.success(lang === "fa" ? "در حال آماده‌سازی چاپ..." : "Preparing print...");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h2 className="text-gray-900 text-xl mb-1" style={{ fontWeight: 700 }}>
            {language === "fa" ? "مدیریت مشتریان" : "Customers Management"}
          </h2>
          <p className="text-gray-500 text-sm">
            {language === "fa" ? `مجموع ${customers.length} مشتری` : `Total ${customers.length} customers`}
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel} className="bg-green-50 hover:bg-green-100 text-green-700">
            <FileSpreadsheet className="w-4 h-4 ml-2" />
            Excel
          </Button>
          <Button variant="outline" onClick={handleExportPDF} className="bg-red-50 hover:bg-red-100 text-red-700">
            <FileDown className="w-4 h-4 ml-2" />
            PDF
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Plus className="w-4 h-4 ml-2" />
            {language === "fa" ? "افزودن مشتری" : "Add Customer"}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <div className="relative">
          <Search className={`absolute ${language === "fa" ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === "fa" ? "جستجوی مشتری..." : "Search customer..."}
            className={language === "fa" ? "pr-10" : "pl-10"}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-gray-500 text-sm">{language === "fa" ? "کل مشتریان" : "Total Customers"}</p>
              <p className="text-2xl" style={{ fontWeight: 700 }}>
                {customers.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-gray-500 text-sm">{language === "fa" ? "قرضه (افغانی)" : "Debt (AFN)"}</p>
              <p className="text-2xl text-red-600" style={{ fontWeight: 700 }}>
                {formatCurrency(totalDebtAfn, "AFN")}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-gray-500 text-sm">{language === "fa" ? "قرضه (دالر)" : "Debt (USD)"}</p>
              <p className="text-2xl text-red-600" style={{ fontWeight: 700 }}>
                {formatCurrency(totalDebtUsd, "USD")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">{language === "fa" ? "نام مشتری" : "Customer Name"}</TableHead>
              <TableHead className="text-right">{language === "fa" ? "شماره تماس" : "Phone"}</TableHead>
              <TableHead className="text-right hidden md:table-cell">{language === "fa" ? "آدرس" : "Address"}</TableHead>
              <TableHead className="text-right">{language === "fa" ? "قرضه (افغانی)" : "Debt (AFN)"}</TableHead>
              <TableHead className="text-right">{language === "fa" ? "قرضه (دالر)" : "Debt (USD)"}</TableHead>
              <TableHead className="text-right">{language === "fa" ? "عملیات" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                  {language === "fa" ? "مشتری یافت نشد" : "No customers found"}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.customer_id} className={c.balance_afn > 0 || c.balance_usd > 0 ? "bg-red-50" : ""}>
                  <TableCell style={{ fontWeight: 500 }}>
                    {c.name}
                    {(c.balance_afn > 0 || c.balance_usd > 0) && <AlertTriangle className="w-4 h-4 text-red-600 inline ml-2" />}
                  </TableCell>
                  <TableCell className="text-gray-600">{c.phone || "-"}</TableCell>
                  <TableCell className="text-gray-600 hidden md:table-cell">{c.address || "-"}</TableCell>
                  <TableCell className={c.balance_afn > 0 ? "text-red-600" : "text-gray-600"} style={{ fontWeight: 500 }}>
                    {formatCurrency(c.balance_afn, "AFN")}
                  </TableCell>
                  <TableCell className={c.balance_usd > 0 ? "text-red-600" : "text-gray-600"} style={{ fontWeight: 500 }}>
                    {formatCurrency(c.balance_usd, "USD")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewCustomer(c.customer_id)}
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(c)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(c.customer_id)}
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

      {/* Add/Edit Dialog */}
      <Dialog
        open={showModal}
        onOpenChange={(o) => {
          setShowModal(o);
          if (!o) resetForm();
        }}
      >
        <DialogContent className="max-w-lg" dir={language === "fa" ? "rtl" : "ltr"} aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>
              {editMode ? (language === "fa" ? "ویرایش مشتری" : "Edit Customer") : language === "fa" ? "افزودن مشتری جدید" : "Add New Customer"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{language === "fa" ? "نام *" : "Name *"}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={language === "fa" ? "نام مشتری" : "Customer name"} />
            </div>

            <div>
              <Label>{language === "fa" ? "شماره تماس" : "Phone"}</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={language === "fa" ? "شماره تماس" : "Phone number"} />
            </div>

            <div>
              <Label>{language === "fa" ? "آدرس" : "Address"}</Label>
              <Textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={language === "fa" ? "آدرس مشتری" : "Customer address"}
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleAdd} className="flex-1">
                {editMode ? (language === "fa" ? "بروزرسانی" : "Update") : language === "fa" ? "افزودن" : "Add"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="flex-1"
              >
                {language === "fa" ? "انصراف" : "Cancel"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Customer Full History Dialog */}
      <Dialog open={!!viewCustomer} onOpenChange={(o) => !o && setViewCustomer(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir={language === "fa" ? "rtl" : "ltr"} aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                {language === "fa" ? "تاریخچه کامل مشتری" : "Full Customer History"}
              </div>
              <Button size="sm" variant="outline" onClick={handlePrintCustomerHistory} className="text-green-700 border-green-200 hover:bg-green-50">
                <Printer className="w-4 h-4 ml-1" />
                {language === "fa" ? "چاپ تاریخچه" : "Print History"}
              </Button>
            </DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">{language === "fa" ? "نام" : "Name"}</p>
                  <p className="text-gray-800" style={{ fontWeight: 600 }}>{selectedCustomer.name}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">{language === "fa" ? "شماره تماس" : "Phone"}</p>
                  <p className="text-gray-800" style={{ fontWeight: 600 }}>{selectedCustomer.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">{language === "fa" ? "قرضه (افغانی)" : "Debt (AFN)"}</p>
                  <p className={selectedCustomer.balance_afn > 0 ? "text-red-600" : "text-emerald-600"} style={{ fontWeight: 700 }}>
                    {formatCurrency(selectedCustomer.balance_afn, "AFN")}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">{language === "fa" ? "قرضه (دالر)" : "Debt (USD)"}</p>
                  <p className={selectedCustomer.balance_usd > 0 ? "text-red-600" : "text-emerald-600"} style={{ fontWeight: 700 }}>
                    {formatCurrency(selectedCustomer.balance_usd, "USD")}
                  </p>
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {totalSalesAfn > 0 && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                    <p className="text-blue-500 text-xs mb-1">{language === "fa" ? "خرید (؋)" : "Sales (AFN)"}</p>
                    <p className="text-blue-700 text-sm" style={{ fontWeight: 700 }}>{formatCurrency(totalSalesAfn, "AFN")}</p>
                  </div>
                )}
                {totalPaymentsAfn > 0 && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                    <p className="text-emerald-500 text-xs mb-1">{language === "fa" ? "پرداخت (؋)" : "Paid (AFN)"}</p>
                    <p className="text-emerald-700 text-sm" style={{ fontWeight: 700 }}>{formatCurrency(totalPaymentsAfn, "AFN")}</p>
                  </div>
                )}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                  <p className="text-gray-400 text-xs mb-1">{language === "fa" ? "تراکنش‌ها" : "Transactions"}</p>
                  <p className="text-gray-700 text-sm" style={{ fontWeight: 700 }}>{allTransactions.length}</p>
                </div>
              </div>

              {/* All Transactions */}
              <div>
                <h4 className="text-gray-700 mb-3 text-sm" style={{ fontWeight: 600 }}>
                  {language === "fa" ? "همه تراکنش‌ها" : "All Transactions"} ({allTransactions.length})
                </h4>

                {allTransactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>{language === "fa" ? "هیچ تراکنشی یافت نشد" : "No transactions found"}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {allTransactions.map((tx, idx) => {
                      if (tx.type === "sale") {
                        const sale = tx.data as typeof customerSales[0];
                        const items = getSaleItems(sale.sale_id);
                        return (
                          <div key={idx} className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                                  <ShoppingCart className="w-3.5 h-3.5 text-blue-600" />
                                </div>
                                <div>
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>
                                    {language === "fa" ? "خرید" : "Sale"}
                                  </span>
                                  <span className="text-gray-400 text-xs mr-2">{sale.date}</span>
                                </div>
                              </div>
                              <span className="text-blue-700 text-sm" style={{ fontWeight: 700 }}>
                                {formatCurrency(sale.total_amount, sale.currency)}
                              </span>
                            </div>
                            <div className="space-y-1 mr-9">
                              {items.map((item) => {
                                const product = getProductById(item.product_id);
                                return (
                                  <div key={item.id} className="flex justify-between text-xs text-gray-600">
                                    <span>{product?.name || "?"} × {item.quantity}</span>
                                    <span>{formatCurrency(item.quantity * item.price, sale.currency)}</span>
                                  </div>
                                );
                              })}
                              <div className="flex justify-between text-xs pt-1 border-t border-blue-100">
                                <span className="text-emerald-600">{language === "fa" ? "پرداخت:" : "Paid:"} {formatCurrency(sale.paid_amount, sale.currency)}</span>
                                {sale.remaining_amount > 0 && (
                                  <span className="text-red-500" style={{ fontWeight: 600 }}>{language === "fa" ? "باقی:" : "Rem:"} {formatCurrency(sale.remaining_amount, sale.currency)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      } else if (tx.type === "payment") {
                        const pay = tx.data as typeof customerPayments[0];
                        return (
                          <div key={idx} className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center">
                                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                              </div>
                              <div>
                                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>
                                  {language === "fa" ? "پرداخت" : "Payment"}
                                </span>
                                <span className="text-gray-400 text-xs mr-2">{pay.date}</span>
                                {pay.note && <p className="text-gray-500 text-xs mt-0.5">{pay.note}</p>}
                              </div>
                            </div>
                            <span className="text-emerald-700 text-sm" style={{ fontWeight: 700 }}>
                              + {formatCurrency(pay.amount, pay.currency)}
                            </span>
                          </div>
                        );
                      } else {
                        const w = tx.data as typeof customerWithdrawals[0];
                        return (
                          <div key={idx} className="bg-purple-50 border border-purple-100 rounded-xl p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-purple-100 rounded-full flex items-center justify-center">
                                <ArrowDownToLine className="w-3.5 h-3.5 text-purple-600" />
                              </div>
                              <div>
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>
                                  {language === "fa" ? "قرضه نقدی" : "Cash Debt"}
                                </span>
                                <span className="text-gray-400 text-xs mr-2">{w.date}</span>
                                {w.description && <p className="text-gray-500 text-xs mt-0.5">{w.description}</p>}
                              </div>
                            </div>
                            <span className="text-purple-700 text-sm" style={{ fontWeight: 700 }}>
                              {w.amount_afn > 0 ? formatCurrency(w.amount_afn, "AFN") : formatCurrency(w.amount_usd, "USD")}
                            </span>
                          </div>
                        );
                      }
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
