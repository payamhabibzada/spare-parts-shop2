import { useParams, useNavigate } from "react-router";
import { useApp, formatCurrency } from "../store/AppContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  ArrowLeft,
  Building2,
  Phone,
  MapPin,
  ShoppingCart,
  CreditCard,
  Calendar,
  Printer,
  Plus,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function SupplierProfile() {
  const { supplierId } = useParams<{ supplierId: string }>();
  const navigate = useNavigate();
  const {
    suppliers,
    supplierPurchases,
    supplierPayments,
    addSupplierPayment,
    addSupplierPurchase,
    language,
  } = useApp();

  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentAfn, setPaymentAfn] = useState("");
  const [paymentUsd, setPaymentUsd] = useState("");
  const [paymentNote, setPaymentNote] = useState("");

  // New purchase/transaction dialog state
  const [purchaseDialog, setPurchaseDialog] = useState(false);
  const [purchaseTotalAfn, setPurchaseTotalAfn] = useState("");
  const [purchaseTotalUsd, setPurchaseTotalUsd] = useState("");
  const [purchasePaidAfn, setPurchasePaidAfn] = useState("");
  const [purchasePaidUsd, setPurchasePaidUsd] = useState("");
  const [purchaseDesc, setPurchaseDesc] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);

  const supplier = suppliers.find((s) => s.supplier_id === supplierId);

  if (!supplier) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          {language === "fa" ? "سپلایر یافت نشد" :
          language === "ps" ? "عرضه کوونکی و نه موندل شو" :
          "Supplier not found"}
        </p>
        <Button onClick={() => navigate("/suppliers")} className="mt-4">
          {language === "fa" ? "بازگشت" : language === "ps" ? "بیرته" : "Go Back"}
        </Button>
      </div>
    );
  }

  const purchases = supplierPurchases
    .filter((p) => p.supplier_id === supplierId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const payments = supplierPayments
    .filter((p) => p.supplier_id === supplierId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalPurchasesAfn = purchases.reduce((sum, p) => sum + p.total_amount_afn, 0);
  const totalPurchasesUsd = purchases.reduce((sum, p) => sum + p.total_amount_usd, 0);
  const totalPaymentsAfn = payments.reduce((sum, p) => sum + p.amount_afn, 0);
  const totalPaymentsUsd = payments.reduce((sum, p) => sum + p.amount_usd, 0);

  // Combine all transactions
  const allTransactions = [
    ...purchases.map((p) => ({
      type: "purchase" as const,
      date: p.date,
      amount_afn: p.total_amount_afn,
      amount_usd: p.total_amount_usd,
      description: p.description || (language === "fa" ? "خرید" : language === "ps" ? "اخیستل" : "Purchase"),
      icon: ShoppingCart,
      color: "blue",
    })),
    ...payments.map((p) => ({
      type: "payment" as const,
      date: p.date,
      amount_afn: p.amount_afn,
      amount_usd: p.amount_usd,
      description: p.note || (language === "fa" ? "پرداخت" : language === "ps" ? "تادیه" : "Payment"),
      icon: CreditCard,
      color: "green",
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handlePayment = () => {
    const afn = parseFloat(paymentAfn) || 0;
    const usd = parseFloat(paymentUsd) || 0;

    if (afn === 0 && usd === 0) {
      toast.error(
        language === "fa" ? "لطفاً مبلغ را وارد کنید" :
        language === "ps" ? "مهرباني وکړئ مقدار داخل کړئ" :
        "Please enter amount"
      );
      return;
    }

    addSupplierPayment({
      supplier_id: supplierId!,
      amount_afn: afn,
      amount_usd: usd,
      date: new Date().toISOString().split("T")[0],
      note: paymentNote,
    });

    toast.success(
      language === "fa" ? "پرداخت ثبت شد" :
      language === "ps" ? "تادیه ثبت شوه" :
      "Payment recorded"
    );

    setPaymentDialog(false);
    setPaymentAfn("");
    setPaymentUsd("");
    setPaymentNote("");
  };

  const handlePurchase = () => {
    const totalAfn = parseFloat(purchaseTotalAfn) || 0;
    const totalUsd = parseFloat(purchaseTotalUsd) || 0;
    const paidAfn = parseFloat(purchasePaidAfn) || 0;
    const paidUsd = parseFloat(purchasePaidUsd) || 0;

    if (totalAfn === 0 && totalUsd === 0) {
      toast.error(
        language === "fa" ? "لطفاً مبلغ کل را وارد کنید" :
        language === "ps" ? "مهرباني وکړئ ټول مقدار داخل کړئ" :
        "Please enter total amount"
      );
      return;
    }

    addSupplierPurchase({
      supplier_id: supplierId!,
      date: purchaseDate,
      total_amount_afn: totalAfn,
      total_amount_usd: totalUsd,
      paid_amount_afn: Math.min(paidAfn, totalAfn),
      paid_amount_usd: Math.min(paidUsd, totalUsd),
      items: JSON.stringify([]),
      description: purchaseDesc || (language === "fa" ? "معامله دستی" : language === "ps" ? "لاسي معامله" : "Manual Transaction"),
    });

    toast.success(
      language === "fa" ? "معامله ثبت شد" :
      language === "ps" ? "معامله ثبت شوه" :
      "Transaction recorded"
    );
    setPurchaseDialog(false);
    setPurchaseTotalAfn("");
    setPurchaseTotalUsd("");
    setPurchasePaidAfn("");
    setPurchasePaidUsd("");
    setPurchaseDesc("");
    setPurchaseDate(new Date().toISOString().split("T")[0]);
  };

  const printThermalReceipt = () => {
    const receiptContent = `
      <html>
        <head>
          <title>${language === "fa" ? "رسید سپلایر" : language === "ps" ? "د عرضه کوونکي رسید" : "Supplier Receipt"}</title>
          <style>
            @media print {
              @page { size: 80mm auto; margin: 0; }
              body { width: 80mm; font-family: 'Arial', sans-serif; font-size: 12px; margin: 10mm; }
            }
            body { font-family: 'Arial', sans-serif; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .header h2 { margin: 5px 0; font-size: 18px; }
            .section { margin: 10px 0; }
            .section-title { font-weight: bold; margin-bottom: 5px; border-bottom: 1px solid #000; }
            .row { display: flex; justify-content: space-between; margin: 3px 0; }
            .transaction { border-top: 1px dotted #ccc; padding-top: 5px; margin-top: 5px; }
            .footer { text-align: center; margin-top: 15px; border-top: 2px dashed #000; padding-top: 10px; }
          </style>
        </head>
        <body dir="${language === "fa" || language === "ps" ? "rtl" : "ltr"}">
          <div class="header">
            <h2>${supplier.company_name}</h2>
            <div>${supplier.name}</div>
            <div>${new Date().toLocaleDateString("fa-AF")}</div>
          </div>

          <div class="section">
            <div class="section-title">${language === "fa" ? "اطلاعات سپلایر" : language === "ps" ? "د عرضه کوونکي معلومات" : "Supplier Info"}</div>
            <div class="row"><span>${language === "fa" ? "شرکت:" : language === "ps" ? "شرکت:" : "Company:"}</span><span>${supplier.company_name}</span></div>
            <div class="row"><span>${language === "fa" ? "نام:" : language === "ps" ? "نوم:" : "Name:"}</span><span>${supplier.name}</span></div>
            <div class="row"><span>${language === "fa" ? "تلفن:" : language === "ps" ? "تلفون:" : "Phone:"}</span><span>${supplier.phone}</span></div>
          </div>

          <div class="section">
            <div class="section-title">${language === "fa" ? "خلاصه مالی" : language === "ps" ? "مالي لنډیز" : "Financial Summary"}</div>
            ${totalPurchasesAfn > 0 ? `<div class="row"><span>${language === "fa" ? "کل خرید (؋):" : language === "ps" ? "ټول پیرود (؋):" : "Total Purchases (AFN):"}</span><span>${formatCurrency(totalPurchasesAfn, "AFN")}</span></div>` : ""}
            ${totalPurchasesUsd > 0 ? `<div class="row"><span>${language === "fa" ? "کل خرید ($):" : language === "ps" ? "ټول پیرود ($):" : "Total Purchases (USD):"}</span><span>${formatCurrency(totalPurchasesUsd, "USD")}</span></div>` : ""}
            ${totalPaymentsAfn > 0 ? `<div class="row"><span>${language === "fa" ? "کل پرداخت (؋):" : language === "ps" ? "ټول تادیه (؋):" : "Total Payments (AFN):"}</span><span>${formatCurrency(totalPaymentsAfn, "AFN")}</span></div>` : ""}
            ${totalPaymentsUsd > 0 ? `<div class="row"><span>${language === "fa" ? "کل پرداخت ($):" : language === "ps" ? "ټول تادیه ($):" : "Total Payments (USD):"}</span><span>${formatCurrency(totalPaymentsUsd, "USD")}</span></div>` : ""}
            ${supplier.balance_afn > 0 ? `<div class="row"><span style="font-weight: bold;">${language === "fa" ? "باقی بدهی (؋):" : language === "ps" ? "پاتې پور (؋):" : "Remaining Debt (AFN):"}</span><span style="font-weight: bold; color: red;">${formatCurrency(supplier.balance_afn, "AFN")}</span></div>` : ""}
            ${supplier.balance_usd > 0 ? `<div class="row"><span style="font-weight: bold;">${language === "fa" ? "باقی بدهی ($):" : language === "ps" ? "پاتې پور ($):" : "Remaining Debt (USD):"}</span><span style="font-weight: bold; color: red;">${formatCurrency(supplier.balance_usd, "USD")}</span></div>` : ""}
          </div>

          <div class="footer">
            ${language === "fa" ? "تشکر از شما" : language === "ps" ? "له تاسو څخه مننه" : "Thank You"}
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(receiptContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }

    toast.success(
      language === "fa" ? "رسید آماده چاپ است" :
      language === "ps" ? "رسید د چاپ لپاره تیار دی" :
      "Receipt ready to print"
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <Button variant="outline" onClick={() => navigate("/suppliers")}>
            <ArrowLeft className="w-4 h-4 ml-2" />
            {language === "fa" ? "بازگشت" : language === "ps" ? "بیرته" : "Back"}
          </Button>

          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={printThermalReceipt}>
              <Printer className="w-4 h-4 ml-2" />
              {language === "fa" ? "چاپ" : language === "ps" ? "چاپ" : "Print"}
            </Button>
            <Button size="sm" className="bg-blue-500 hover:bg-blue-600" onClick={() => setPurchaseDialog(true)}>
              <Package className="w-4 h-4 ml-2" />
              {language === "fa" ? "ثبت معامله جدید" : language === "ps" ? "نوې معامله ثبت" : "New Transaction"}
            </Button>
            <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={() => setPaymentDialog(true)}>
              <Plus className="w-4 h-4 ml-2" />
              {language === "fa" ? "ثبت پرداخت" : language === "ps" ? "تادیه ثبت" : "Record Payment"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                <Building2 className="w-8 h-8 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl text-gray-800" style={{ fontWeight: 700 }}>
                  {supplier.company_name}
                </h1>
                <p className="text-gray-500">{supplier.name}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{supplier.phone || "-"}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{supplier.address || "-"}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-rose-50 rounded-xl p-4 border border-rose-200">
              <p className="text-rose-600 text-sm mb-1">
                {language === "fa" ? "بدهی افغانی" : language === "ps" ? "پور افغانۍ" : "Debt AFN"}
              </p>
              <p className="text-2xl text-rose-700" style={{ fontWeight: 700 }}>
                {formatCurrency(supplier.balance_afn, "AFN")}
              </p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <p className="text-amber-600 text-sm mb-1">
                {language === "fa" ? "بدهی دالر" : language === "ps" ? "پور ډالر" : "Debt USD"}
              </p>
              <p className="text-2xl text-amber-700" style={{ fontWeight: 700 }}>
                {formatCurrency(supplier.balance_usd, "USD")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-gray-500 text-sm">
                {language === "fa" ? "کل خریدها" :
                language === "ps" ? "ټول پیرودونه" :
                "Total Purchases"}
              </p>
              <div className="space-y-1">
                {totalPurchasesAfn > 0 && (
                  <p className="text-lg text-blue-600" style={{ fontWeight: 600 }}>
                    {formatCurrency(totalPurchasesAfn, "AFN")}
                  </p>
                )}
                {totalPurchasesUsd > 0 && (
                  <p className="text-lg text-blue-600" style={{ fontWeight: 600 }}>
                    {formatCurrency(totalPurchasesUsd, "USD")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-gray-500 text-sm">
                {language === "fa" ? "کل پرداخت‌ها" :
                language === "ps" ? "ټول تادیې" :
                "Total Payments"}
              </p>
              <div className="space-y-1">
                {totalPaymentsAfn > 0 && (
                  <p className="text-lg text-green-600" style={{ fontWeight: 600 }}>
                    {formatCurrency(totalPaymentsAfn, "AFN")}
                  </p>
                )}
                {totalPaymentsUsd > 0 && (
                  <p className="text-lg text-green-600" style={{ fontWeight: 600 }}>
                    {formatCurrency(totalPaymentsUsd, "USD")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-xl text-gray-800 mb-4" style={{ fontWeight: 700 }}>
          {language === "fa" ? "تاریخچه تراکنش‌ها" :
          language === "ps" ? "د تراکنش تاریخ" :
          "Transaction History"}
        </h2>

        <div className="space-y-3">
          {allTransactions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              {language === "fa" ? "تراکنشی ثبت نشده است" :
              language === "ps" ? "تراکنش ثبت شوی نه دی" :
              "No transactions recorded"}
            </p>
          ) : (
            allTransactions.map((transaction, index) => {
              const Icon = transaction.icon;
              return (
                <div key={index} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 bg-${transaction.color}-100 rounded-full flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 text-${transaction.color}-600`} />
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-800" style={{ fontWeight: 600 }}>
                          {transaction.description}
                        </p>
                        <p className="text-sm text-gray-500">
                          <Calendar className="w-3 h-3 inline ml-1" />
                          {transaction.date}
                        </p>
                      </div>

                      <div className="text-right">
                        {transaction.amount_afn > 0 && (
                          <p className={`text-lg text-${transaction.color}-600`} style={{ fontWeight: 600 }}>
                            {transaction.type === "payment" ? "-" : "+"}
                            {formatCurrency(transaction.amount_afn, "AFN")}
                          </p>
                        )}
                        {transaction.amount_usd > 0 && (
                          <p className={`text-lg text-${transaction.color}-600`} style={{ fontWeight: 600 }}>
                            {transaction.type === "payment" ? "-" : "+"}
                            {formatCurrency(transaction.amount_usd, "USD")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* New Transaction/Purchase Dialog */}
      {purchaseDialog && (
        <Dialog open={purchaseDialog} onOpenChange={setPurchaseDialog}>
          <DialogContent className="max-w-md" dir={language === "fa" || language === "ps" ? "rtl" : "ltr"} aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>
                {language === "fa" ? "ثبت معامله جدید" :
                language === "ps" ? "نوې معامله ثبت کړئ" :
                "Register New Transaction"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{language === "fa" ? "تاریخ" : language === "ps" ? "نیټه" : "Date"}</Label>
                <Input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{language === "fa" ? "کل مبلغ (افغانی)" : language === "ps" ? "ټول مقدار (افغانۍ)" : "Total (AFN)"}</Label>
                  <Input
                    type="number"
                    value={purchaseTotalAfn}
                    onChange={(e) => setPurchaseTotalAfn(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>{language === "fa" ? "کل مبلغ (دالر)" : language === "ps" ? "ټول مقدار (ډالر)" : "Total (USD)"}</Label>
                  <Input
                    type="number"
                    value={purchaseTotalUsd}
                    onChange={(e) => setPurchaseTotalUsd(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{language === "fa" ? "پرداخت شده (افغانی)" : language === "ps" ? "تادیه شوی (افغانۍ)" : "Paid (AFN)"}</Label>
                  <Input
                    type="number"
                    value={purchasePaidAfn}
                    onChange={(e) => setPurchasePaidAfn(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>{language === "fa" ? "پرداخت شده (دالر)" : language === "ps" ? "تادیه شوی (ډالر)" : "Paid (USD)"}</Label>
                  <Input
                    type="number"
                    value={purchasePaidUsd}
                    onChange={(e) => setPurchasePaidUsd(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <Label>{language === "fa" ? "توضیحات" : language === "ps" ? "تفصیل" : "Description"}</Label>
                <Input
                  value={purchaseDesc}
                  onChange={(e) => setPurchaseDesc(e.target.value)}
                  placeholder={language === "fa" ? "توضیحات..." : language === "ps" ? "تفصیل..." : "Description..."}
                />
              </div>
              <Button onClick={handlePurchase} className="w-full bg-blue-500 hover:bg-blue-600">
                {language === "fa" ? "ثبت معامله" :
                language === "ps" ? "معامله ثبت کړئ" :
                "Record Transaction"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Payment Dialog */}
      {paymentDialog && (
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
                <Label>{language === "fa" ? "مبلغ (افغانی)" : language === "ps" ? "مقدار (افغانۍ)" : "Amount (AFN)"}</Label>
                <Input
                  type="number"
                  value={paymentAfn}
                  onChange={(e) => setPaymentAfn(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>{language === "fa" ? "مبلغ (دالر)" : language === "ps" ? "مقدار (ډالر)" : "Amount (USD)"}</Label>
                <Input
                  type="number"
                  value={paymentUsd}
                  onChange={(e) => setPaymentUsd(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>{language === "fa" ? "یادداشت" : language === "ps" ? "یادښت" : "Note"}</Label>
                <Input
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder={language === "fa" ? "یادداشت..." : language === "ps" ? "یادښت..." : "Note..."}
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
