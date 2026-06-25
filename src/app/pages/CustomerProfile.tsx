import { useParams, useNavigate } from "react-router";
import { useApp, formatCurrency } from "../store/AppContext";
import { Button } from "../components/ui/button";
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  ShoppingCart,
  CreditCard,
  ArrowDownToLine,
  Calendar,
  Printer,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";

export default function CustomerProfile() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const { customers, sales, payments, withdrawals, saleItems, products, language } = useApp();

  const customer = customers.find((c) => c.customer_id === customerId);

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          {language === "fa" ? "مشتری یافت نشد" :
          language === "ps" ? "پیرودونکی و نه موندل شو" :
          "Customer not found"}
        </p>
        <Button onClick={() => navigate("/debts")} className="mt-4">
          {language === "fa" ? "بازگشت" : language === "ps" ? "بیرته" : "Go Back"}
        </Button>
      </div>
    );
  }

  // Get all transactions for this customer
  const customerSales = sales
    .filter((s) => s.customer_id === customer.customer_id)
    .map((s) => {
      // Get line items for this sale
      const items = saleItems
        .filter((item) => item.sale_id === s.sale_id)
        .map((item) => {
          const product = products.find((p) => p.product_id === item.product_id);
          const productName = product?.name ?? (language === "fa" ? "محصول حذف شده" : language === "ps" ? "حذف شوی محصول" : "Deleted Product");
          return {
            product_name: productName,
            quantity: item.quantity,
            unit_price: item.price ?? 0,
            total: (item.price ?? 0) * item.quantity,
          };
        });

      return {
        type: "sale" as const,
        sale_id: s.sale_id,
        date: s.date,
        time: s.time || "00:00",
        amount_afn: s.currency === "AFN" ? s.total_amount : 0,
        amount_usd: s.currency === "USD" ? s.total_amount : 0,
        paid_afn: s.currency === "AFN" ? s.paid_amount : 0,
        paid_usd: s.currency === "USD" ? s.paid_amount : 0,
        remaining_afn: s.currency === "AFN" ? s.remaining_amount : 0,
        remaining_usd: s.currency === "USD" ? s.remaining_amount : 0,
        discount: s.discount,
        currency: s.currency,
        description: language === "fa"
          ? `فروش${s.invoice_number ? ` #${s.invoice_number}` : ""}`
          : language === "ps"
          ? `پلور${s.invoice_number ? ` #${s.invoice_number}` : ""}`
          : `Sale${s.invoice_number ? ` #${s.invoice_number}` : ""}`,
        icon: ShoppingCart,
        color: "blue",
        items,
        payment_status: s.payment_status,
      };
    });

  const customerPayments = payments
    .filter((p) => p.customer_id === customer.customer_id)
    .map((p) => ({
      type: "payment" as const,
      date: p.date,
      time: "00:00",
      amount_afn: p.currency === "AFN" ? p.amount : 0,
      amount_usd: p.currency === "USD" ? p.amount : 0,
      description: p.note || (language === "fa" ? "پرداخت" : language === "ps" ? "تادیه" : "Payment"),
      icon: CreditCard,
      color: "green",
    }));

  const customerWithdrawals = withdrawals
    .filter((w) => w.category === "customer" && w.customer_id === customer.customer_id)
    .map((w) => ({
      type: "withdrawal" as const,
      date: w.date,
      time: "00:00",
      amount_afn: w.amount_afn,
      amount_usd: w.amount_usd,
      description: w.description || (language === "fa" ? "برداشت" : language === "ps" ? "وباسنه" : "Withdrawal"),
      icon: ArrowDownToLine,
      color: "purple",
    }));

  // Combine and sort all transactions
  const allTransactions = [...customerSales, ...customerPayments, ...customerWithdrawals].sort(
    (a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`).getTime();
      const dateB = new Date(`${b.date}T${b.time}`).getTime();
      return dateB - dateA;
    }
  );

  // Calculate totals
  const totalSalesAfn = customerSales.reduce((sum, s) => sum + s.amount_afn, 0);
  const totalSalesUsd = customerSales.reduce((sum, s) => sum + s.amount_usd, 0);
  const totalPaymentsAfn = customerPayments.reduce((sum, p) => sum + p.amount_afn, 0);
  const totalPaymentsUsd = customerPayments.reduce((sum, p) => sum + p.amount_usd, 0);
  const totalWithdrawalsAfn = customerWithdrawals.reduce((sum, w) => sum + w.amount_afn, 0);
  const totalWithdrawalsUsd = customerWithdrawals.reduce((sum, w) => sum + w.amount_usd, 0);

  const printThermalReceipt = () => {
    const receiptContent = `
      <html>
        <head>
          <title>${language === "fa" ? "رسید مشتری" : language === "ps" ? "د پیرودونکي رسید" : "Customer Receipt"}</title>
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
            <h2>${customer.name}</h2>
            <div>${language === "fa" ? "تاریخچه تراکنش‌ها" : language === "ps" ? "د تراکنش تاریخ" : "Transaction History"}</div>
            <div>${new Date().toLocaleDateString("fa-AF")}</div>
          </div>

          <div class="section">
            <div class="section-title">${language === "fa" ? "اطلاعات مشتری" : language === "ps" ? "د پیرودونکي معلومات" : "Customer Info"}</div>
            <div class="row"><span>${language === "fa" ? "نام:" : language === "ps" ? "نوم:" : "Name:"}</span><span>${customer.name}</span></div>
            <div class="row"><span>${language === "fa" ? "تلفن:" : language === "ps" ? "تلفون:" : "Phone:"}</span><span>${customer.phone}</span></div>
            <div class="row"><span>${language === "fa" ? "آدرس:" : language === "ps" ? "آدرس:" : "Address:"}</span><span>${customer.address || "-"}</span></div>
          </div>

          <div class="section">
            <div class="section-title">${language === "fa" ? "خلاصه مالی" : language === "ps" ? "مالي لنډیز" : "Financial Summary"}</div>
            ${totalSalesAfn > 0 ? `<div class="row"><span>${language === "fa" ? "کل خرید (؋):" : language === "ps" ? "ټول پیرود (؋):" : "Total Purchases (AFN):"}</span><span>${formatCurrency(totalSalesAfn, "AFN")}</span></div>` : ""}
            ${totalSalesUsd > 0 ? `<div class="row"><span>${language === "fa" ? "کل خرید ($):" : language === "ps" ? "ټول پیرود ($):" : "Total Purchases (USD):"}</span><span>${formatCurrency(totalSalesUsd, "USD")}</span></div>` : ""}
            ${totalPaymentsAfn > 0 ? `<div class="row"><span>${language === "fa" ? "کل پرداخت (؋):" : language === "ps" ? "ټول تادیه (؋):" : "Total Payments (AFN):"}</span><span>${formatCurrency(totalPaymentsAfn, "AFN")}</span></div>` : ""}
            ${totalPaymentsUsd > 0 ? `<div class="row"><span>${language === "fa" ? "کل پرداخت ($):" : language === "ps" ? "ټول تادیه ($):" : "Total Payments (USD):"}</span><span>${formatCurrency(totalPaymentsUsd, "USD")}</span></div>` : ""}
            ${customer.balance_afn > 0 ? `<div class="row"><span style="font-weight: bold;">${language === "fa" ? "باقی قرضه (؋):" : language === "ps" ? "پاتې پور (؋):" : "Remaining Debt (AFN):"}</span><span style="font-weight: bold; color: red;">${formatCurrency(customer.balance_afn, "AFN")}</span></div>` : ""}
            ${customer.balance_usd > 0 ? `<div class="row"><span style="font-weight: bold;">${language === "fa" ? "باقی قرضه ($):" : language === "ps" ? "پاتې پور ($):" : "Remaining Debt (USD):"}</span><span style="font-weight: bold; color: red;">${formatCurrency(customer.balance_usd, "USD")}</span></div>` : ""}
          </div>

          <div class="section">
            <div class="section-title">${language === "fa" ? "تاریخچه تراکنش‌ها" : language === "ps" ? "د تراکنش تاریخ" : "Transaction History"}</div>
            ${allTransactions.map((t) => `
              <div class="transaction">
                <div class="row"><span style="font-weight: bold;">${t.description}</span></div>
                <div class="row"><span>${t.date}</span><span style="color: ${t.type === "payment" ? "green" : t.type === "sale" ? "blue" : "purple"}; font-weight: bold;">${t.amount_afn > 0 ? formatCurrency(t.amount_afn, "AFN") : ""}${t.amount_usd > 0 ? formatCurrency(t.amount_usd, "USD") : ""}</span></div>
                ${"items" in t && t.items && t.items.length > 0 ? `
                  <div style="margin-top: 5px; padding-left: 10px; border-left: 2px solid #ddd;">
                    <div style="font-size: 11px; font-weight: bold; margin-bottom: 3px;">${language === "fa" ? "اقلام:" : language === "ps" ? "توکي:" : "Items:"}</div>
                    ${t.items.map((item: any) => `
                      <div class="row" style="font-size: 11px;">
                        <span>${item.product_name} × ${item.quantity}</span>
                        <span>${formatCurrency(item.total, t.currency)}</span>
                      </div>
                    `).join("")}
                  </div>
                ` : ""}
                ${"payment_status" in t ? `
                  <div style="font-size: 11px; color: ${t.payment_status === "paid" ? "green" : "red"}; margin-top: 3px;">
                    ${t.payment_status === "paid"
                      ? (language === "fa" ? "✓ پرداخت شده" : language === "ps" ? "✓ تادیه شوی" : "✓ Paid")
                      : (language === "fa" ? "⚠ قرضی" : language === "ps" ? "⚠ پور" : "⚠ Credit")}
                  </div>
                ` : ""}
              </div>
            `).join("")}
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

  const exportToExcel = () => {
    const headers = [
      language === "fa" ? "نوع" : language === "ps" ? "ډول" : "Type",
      language === "fa" ? "تاریخ" : language === "ps" ? "نیټه" : "Date",
      language === "fa" ? "مقدار افغانی" : language === "ps" ? "مقدار افغانۍ" : "Amount AFN",
      language === "fa" ? "مقدار دالر" : language === "ps" ? "مقدار ډالر" : "Amount USD",
      language === "fa" ? "توضیحات" : language === "ps" ? "تفصیل" : "Description",
      language === "fa" ? "اقلام" : language === "ps" ? "توکي" : "Items",
      language === "fa" ? "وضعیت" : language === "ps" ? "حالت" : "Status",
    ];

    const rows = allTransactions.flatMap((t) => {
      const typeLabel = t.type === "sale"
        ? (language === "fa" ? "فروش" : language === "ps" ? "پلور" : "Sale")
        : t.type === "payment"
        ? (language === "fa" ? "پرداخت" : language === "ps" ? "تادیه" : "Payment")
        : (language === "fa" ? "برداشت" : language === "ps" ? "وباسنه" : "Withdrawal");

      const statusLabel = "payment_status" in t
        ? (t.payment_status === "paid"
            ? (language === "fa" ? "پرداخت شده" : language === "ps" ? "تادیه شوی" : "Paid")
            : (language === "fa" ? "قرضی" : language === "ps" ? "پور" : "Credit"))
        : "";

      const itemsText = "items" in t && t.items && t.items.length > 0
        ? t.items.map((item: any) => `${item.product_name} × ${item.quantity} = ${formatCurrency(item.total, t.currency)}`).join(" | ")
        : "";

      return [[
        typeLabel,
        t.date,
        t.amount_afn,
        t.amount_usd,
        t.description,
        itemsText,
        statusLabel,
      ]];
    });

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `customer_${customer.name}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    toast.success(
      language === "fa" ? "فایل اکسل دانلود شد" :
      language === "ps" ? "اکسل فایل ډاونلوډ شو" :
      "Excel file downloaded"
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <Button variant="outline" onClick={() => navigate("/debts")}>
            <ArrowLeft className="w-4 h-4 ml-2" />
            {language === "fa" ? "بازگشت" : language === "ps" ? "بیرته" : "Back"}
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={printThermalReceipt}>
              <Printer className="w-4 h-4 ml-2" />
              {language === "fa" ? "چاپ" : language === "ps" ? "چاپ" : "Print"}
            </Button>
            <Button variant="outline" size="sm" onClick={exportToExcel}>
              <FileSpreadsheet className="w-4 h-4 ml-2" />
              {language === "fa" ? "اکسل" : language === "ps" ? "اکسل" : "Excel"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl text-gray-800 font-bold">
                  {customer.name}
                </h1>
                <p className="text-gray-500">
                  {language === "fa" ? "پروفایل مشتری" :
                  language === "ps" ? "د پیرودونکي پروفایل" :
                  "Customer Profile"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{customer.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{customer.address || "-"}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-red-50 rounded-xl p-4 border border-red-200">
              <p className="text-red-600 text-sm mb-1">
                {language === "fa" ? "قرضه افغانی" : language === "ps" ? "پور افغانۍ" : "Debt AFN"}
              </p>
              <p className="text-2xl text-red-700 font-bold">
                {formatCurrency(customer.balance_afn, "AFN")}
              </p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
              <p className="text-orange-600 text-sm mb-1">
                {language === "fa" ? "قرضه دالر" : language === "ps" ? "پور ډالر" : "Debt USD"}
              </p>
              <p className="text-2xl text-orange-700 font-bold">
                {formatCurrency(customer.balance_usd, "USD")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                {totalSalesAfn > 0 && (
                  <p className="text-lg text-blue-600 font-semibold">
                    {formatCurrency(totalSalesAfn, "AFN")}
                  </p>
                )}
                {totalSalesUsd > 0 && (
                  <p className="text-lg text-blue-600 font-semibold">
                    {formatCurrency(totalSalesUsd, "USD")}
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
                  <p className="text-lg text-green-600 font-semibold">
                    {formatCurrency(totalPaymentsAfn, "AFN")}
                  </p>
                )}
                {totalPaymentsUsd > 0 && (
                  <p className="text-lg text-green-600 font-semibold">
                    {formatCurrency(totalPaymentsUsd, "USD")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center gap-3">
            <ArrowDownToLine className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-gray-500 text-sm">
                {language === "fa" ? "کل برداشت‌ها" :
                language === "ps" ? "ټول وباسنې" :
                "Total Withdrawals"}
              </p>
              <div className="space-y-1">
                {totalWithdrawalsAfn > 0 && (
                  <p className="text-lg text-purple-600 font-semibold">
                    {formatCurrency(totalWithdrawalsAfn, "AFN")}
                  </p>
                )}
                {totalWithdrawalsUsd > 0 && (
                  <p className="text-lg text-purple-600 font-semibold">
                    {formatCurrency(totalWithdrawalsUsd, "USD")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-xl text-gray-800 mb-4 font-bold">
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
              const isSale = transaction.type === "sale";
              const isPayment = transaction.type === "payment";

              const cardBorder = isSale
                ? "border-blue-200 bg-blue-50/40"
                : isPayment
                ? "border-green-200 bg-green-50/40"
                : "border-purple-200 bg-purple-50/40";

              const iconBg = isSale ? "bg-blue-100" : isPayment ? "bg-green-100" : "bg-purple-100";
              const iconColor = isSale ? "text-blue-600" : isPayment ? "text-green-600" : "text-purple-600";
              const amountColor = isSale ? "text-blue-700" : isPayment ? "text-green-700" : "text-purple-700";

              const typeBadge = isSale
                ? { label: language === "fa" ? "خرید" : language === "ps" ? "پیرود" : "Purchase", cls: "bg-blue-100 text-blue-700" }
                : isPayment
                ? { label: language === "fa" ? "پرداخت" : language === "ps" ? "تادیه" : "Payment", cls: "bg-green-100 text-green-700" }
                : { label: language === "fa" ? "برداشت" : language === "ps" ? "وباسنه" : "Withdrawal", cls: "bg-purple-100 text-purple-700" };

              return (
                <div key={index} className={`rounded-xl border p-4 ${cardBorder} transition-all`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 ${iconBg} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Icon className={`w-5 h-5 ${iconColor}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Top row: type badge + description + amount */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${typeBadge.cls}`}>
                              {typeBadge.label}
                            </span>
                            <span className="text-sm text-gray-800 font-semibold">
                              {transaction.description}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>{transaction.date}</span>
                            {transaction.time && transaction.time !== "00:00" && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span>{transaction.time}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          {transaction.amount_afn > 0 && (
                            <p className={`text-lg ${amountColor} font-bold`}>
                              {isPayment ? "- " : ""}{formatCurrency(transaction.amount_afn, "AFN")}
                            </p>
                          )}
                          {transaction.amount_usd > 0 && (
                            <p className={`text-lg ${amountColor} font-bold`}>
                              {isPayment ? "- " : ""}{formatCurrency(transaction.amount_usd, "USD")}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Paid / Remaining row — only for sales */}
                      {isSale && "paid_afn" in transaction && (
                        <div className="grid grid-cols-3 gap-2 mt-2 mb-2">
                          <div className="bg-white rounded-lg px-3 py-2 border border-blue-100 text-center">
                            <p className="text-xs text-gray-400 mb-0.5">
                              {language === "fa" ? "مجموع" : language === "ps" ? "ټول" : "Total"}
                            </p>
                            <p className="text-sm text-blue-700 font-bold">
                              {formatCurrency(
                                transaction.amount_afn > 0 ? transaction.amount_afn : transaction.amount_usd,
                                (transaction as any).currency
                              )}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg px-3 py-2 border border-green-100 text-center">
                            <p className="text-xs text-gray-400 mb-0.5">
                              {language === "fa" ? "پرداخت‌شده" : language === "ps" ? "تادیه شوی" : "Paid"}
                            </p>
                            <p className="text-sm text-green-700 font-bold">
                              {formatCurrency(
                                (transaction as any).paid_afn > 0 ? (transaction as any).paid_afn : (transaction as any).paid_usd,
                                (transaction as any).currency
                              )}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg px-3 py-2 border border-red-100 text-center">
                            <p className="text-xs text-gray-400 mb-0.5">
                              {language === "fa" ? "باقی‌مانده" : language === "ps" ? "پاتې" : "Remaining"}
                            </p>
                            <p className={`text-sm ${(transaction as any).remaining_afn > 0 || (transaction as any).remaining_usd > 0 ? "text-red-600" : "text-green-600"} font-bold`}>
                              {formatCurrency(
                                (transaction as any).remaining_afn > 0 ? (transaction as any).remaining_afn : (transaction as any).remaining_usd,
                                (transaction as any).currency
                              )}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Payment status badge for sales */}
                      {"payment_status" in transaction && transaction.payment_status && (
                        <div className="mb-2">
                          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
                            transaction.payment_status === "paid"
                              ? "bg-green-100 text-green-700"
                              : transaction.payment_status === "partial"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-600"
                          }`}>
                            {transaction.payment_status === "paid"
                              ? (language === "fa" ? "✓ تسویه کامل" : language === "ps" ? "✓ بشپړه تادیه" : "✓ Fully Paid")
                              : transaction.payment_status === "partial"
                              ? (language === "fa" ? "◑ پرداخت جزئی" : language === "ps" ? "◑ برخه تادیه" : "◑ Partial Payment")
                              : (language === "fa" ? "⚠ قرضی" : language === "ps" ? "⚠ پور" : "⚠ Credit")}
                          </span>
                        </div>
                      )}

                      {/* Line items for sales */}
                      {"items" in transaction && transaction.items && transaction.items.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-blue-100">
                          <p className="text-xs text-gray-500 mb-1.5 font-semibold">
                            {language === "fa" ? "اقلام فروش:" : language === "ps" ? "د پلور توکي:" : "Items:"}
                          </p>
                          <div className="space-y-1">
                            {transaction.items.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-xs bg-white px-3 py-2 rounded-lg border border-gray-100">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />
                                  <span className="text-gray-700 truncate font-medium">{item.product_name}</span>
                                  <span className="text-gray-400 flex-shrink-0">× {item.quantity}</span>
                                  <span className="text-gray-400 flex-shrink-0">@ {formatCurrency(item.unit_price, (transaction as any).currency)}</span>
                                </div>
                                <span className="text-gray-800 flex-shrink-0 font-semibold">
                                  {formatCurrency(item.total, (transaction as any).currency)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
