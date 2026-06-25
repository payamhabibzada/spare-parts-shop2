import { useState, useMemo } from "react";
import { useApp, formatCurrency } from "../store/AppContext";
import { useShopUser } from "../store/ShopUserContext";
import {
  Package,
  Users,
  ShoppingCart,
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  DollarSign,
  TrendingDown,
  Banknote,
  Calendar,
  PieChart as PieChartIcon,
  Building2,
  Download,
} from "lucide-react";
import { exportAllDataToExcel } from "../utils/exportAllData";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function Dashboard() {
  const {
    products,
    customers,
    sales,
    saleItems,
    expenses,
    shareholders,
    suppliers,
    supplierPayments,
    supplierPurchases,
    payments,
    withdrawals,
    users,
    activityLogs,
    cashAfn,
    cashUsd,
    currentUser,
    language,
    currency,
  } = useApp();
  const { currentShopUser } = useShopUser();

  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month" | "custom">("month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // بررسی دسترسی Export - فقط برای ادمین و سوپرادمین
  const isAdmin = currentUser?.role === "super_admin" || currentUser?.role === "admin" || (!currentUser && !!currentShopUser);

  // Export All Data Function
  const handleExportAllData = () => {
    if (!isAdmin) {
      toast.error(
        language === "fa" ? "فقط ادمین و سوپرادمین می‌توانند گزارش کامل را دانلود کنند" :
        "Only admins and super admins can download the complete report"
      );
      return;
    }

    try {
      exportAllDataToExcel({
        products,
        customers,
        sales,
        saleItems,
        payments,
        withdrawals,
        expenses,
        shareholders,
        users,
        activityLogs,
        suppliers,
        supplierPurchases,
        supplierPayments,
        cashAfn,
        cashUsd,
        language,
        dateFrom: customStartDate || undefined,
        dateTo: customEndDate || undefined,
      });

      toast.success(
        language === "fa" ? "گزارش کامل سیستم با موفقیت دانلود شد" :
        "Complete system report downloaded successfully"
      );
    } catch (error) {
      console.error("Export error:", error);
      toast.error(
        language === "fa" ? "خطا در دانلود گزارش" :
        "Error downloading report"
      );
    }
  };

  // Date filter logic
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

  const [startDate, endDate] = getDateRange();

  const filteredSales = useMemo(() => {
    if (!startDate || !endDate) return sales;
    return sales.filter((s) => {
      const saleDate = new Date(s.date);
      return saleDate >= startDate && saleDate <= endDate;
    });
  }, [sales, startDate, endDate]);

  const filteredExpenses = useMemo(() => {
    if (!startDate || !endDate) return expenses;
    return expenses.filter((e) => {
      const expenseDate = new Date(e.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });
  }, [expenses, startDate, endDate]);

  // Financial Calculations
  const totalSalesAfn = filteredSales.filter((s) => s.currency === "AFN").reduce((a, s) => a + s.total_amount, 0);
  const totalSalesUsd = filteredSales.filter((s) => s.currency === "USD").reduce((a, s) => a + s.total_amount, 0);

  const totalExpensesAfn = filteredExpenses.reduce((a, e) => a + e.amount_afn, 0);
  const totalExpensesUsd = filteredExpenses.reduce((a, e) => a + e.amount_usd, 0);

  // Calculate total cost of sold items based on buy price
  const totalCostAfn = filteredSales
    .filter((s) => s.currency === "AFN")
    .reduce((total, sale) => {
      const items = saleItems.filter((si) => si.sale_id === sale.sale_id);
      const saleCost = items.reduce((cost, item) => {
        const product = products.find((p) => p.product_id === item.product_id);
        if (product) {
          return cost + product.buy_price_afn * item.quantity;
        }
        return cost;
      }, 0);
      return total + saleCost;
    }, 0);

  const totalCostUsd = filteredSales
    .filter((s) => s.currency === "USD")
    .reduce((total, sale) => {
      const items = saleItems.filter((si) => si.sale_id === sale.sale_id);
      const saleCost = items.reduce((cost, item) => {
        const product = products.find((p) => p.product_id === item.product_id);
        if (product) {
          return cost + product.buy_price_usd * item.quantity;
        }
        return cost;
      }, 0);
      return total + saleCost;
    }, 0);

  // Net Profit = Sales - Cost - Expenses
  const netProfitAfn = totalSalesAfn - totalCostAfn - totalExpensesAfn;
  const netProfitUsd = totalSalesUsd - totalCostUsd - totalExpensesUsd;

  const totalDebtAfn = customers.reduce((a, c) => a + c.balance_afn, 0);
  const totalDebtUsd = customers.reduce((a, c) => a + c.balance_usd, 0);

  const totalPaidAfn = filteredSales.filter((s) => s.currency === "AFN").reduce((a, s) => a + s.paid_amount, 0);
  const totalPaidUsd = filteredSales.filter((s) => s.currency === "USD").reduce((a, s) => a + s.paid_amount, 0);

  // Shareholders calculations

  // Total Capital Calculation (Stock Value + Cash Received + Customer Debts)
  const stockValueAfn = products.reduce((total, p) => total + (p.buy_price_afn * p.stock), 0);
  const stockValueUsd = products.reduce((total, p) => total + (p.buy_price_usd * p.stock), 0);

  // Using all sales (not filtered) for total capital
  const allPaidAfn = sales.filter((s) => s.currency === "AFN").reduce((a, s) => a + s.paid_amount, 0);
  const allPaidUsd = sales.filter((s) => s.currency === "USD").reduce((a, s) => a + s.paid_amount, 0);

  const totalCapitalAfn = stockValueAfn + allPaidAfn + totalDebtAfn;
  const totalCapitalUsd = stockValueUsd + allPaidUsd + totalDebtUsd;

  const shareholderShares = shareholders.map((sh) => {
    const shareAfn = (netProfitAfn * sh.share_percentage) / 100;
    const shareUsd = (netProfitUsd * sh.share_percentage) / 100;
    return {
      ...sh,
      shareAfn,
      shareUsd,
    };
  });

  const lowStockProducts = products.filter((p) => p.stock <= 3).length;

  // Supplier calculations
  const totalSupplierDebtAfn = suppliers.reduce((a, s) => a + s.balance_afn, 0);
  const totalSupplierDebtUsd = suppliers.reduce((a, s) => a + s.balance_usd, 0);

  const totalSupplierPaymentsAfn = supplierPayments.reduce((a, p) => a + p.amount_afn, 0);
  const totalSupplierPaymentsUsd = supplierPayments.reduce((a, p) => a + p.amount_usd, 0);

  const totalSupplierPurchasesAfn = supplierPurchases.reduce((a, p) => a + p.total_amount_afn, 0);
  const totalSupplierPurchasesUsd = supplierPurchases.reduce((a, p) => a + p.total_amount_usd, 0);

  const totalSupplierDebt = currency === "AFN" ? totalSupplierDebtAfn : totalSupplierDebtUsd;
  const totalSupplierPayments = currency === "AFN" ? totalSupplierPaymentsAfn : totalSupplierPaymentsUsd;
  const totalSupplierPurchases = currency === "AFN" ? totalSupplierPurchasesAfn : totalSupplierPurchasesUsd;

  const totalSales = currency === "AFN" ? totalSalesAfn : totalSalesUsd;
  const totalDebt = currency === "AFN" ? totalDebtAfn : totalDebtUsd;
  const totalPaid = currency === "AFN" ? totalPaidAfn : totalPaidUsd;
  const totalExpenses = currency === "AFN" ? totalExpensesAfn : totalExpensesUsd;
  const netProfit = currency === "AFN" ? netProfitAfn : netProfitUsd;
  const totalCapital = currency === "AFN" ? totalCapitalAfn : totalCapitalUsd;
  const stockValue = currency === "AFN" ? stockValueAfn : stockValueUsd;
  const allPaid = currency === "AFN" ? allPaidAfn : allPaidUsd;

  // Category distribution — filter out empty/undefined names to avoid duplicate keys in recharts
  const categoryMap: Record<string, number> = {};
  products.forEach((p) => {
    const cat = p.category || (language === "fa" ? "سایر" : "Other");
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });
  const categoryData = Object.entries(categoryMap)
    .filter(([name]) => name.trim() !== "")
    .map(([name, value], idx) => ({ name, value, id: `cat-${idx}` }));

  // Monthly sales data (last 6 months)
  const monthNames =
    language === "fa"
      ? ["جنوری", "فبروری", "مارس", "اپریل", "می", "جون", "جولای", "اگست", "سپتمبر", "اکتوبر", "نوامبر", "دسامبر"]
      : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const monthlySalesData = useMemo(() => {
    const last6Months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthSales = sales.filter((s) => {
        const saleDate = new Date(s.date);
        return saleDate >= month && saleDate <= monthEnd;
      });

      const amountAfn = monthSales.filter((s) => s.currency === "AFN").reduce((a, s) => a + s.total_amount, 0);
      const amountUsd = monthSales.filter((s) => s.currency === "USD").reduce((a, s) => a + s.total_amount, 0);

      last6Months.push({
        month: `${monthNames[month.getMonth()]}-${5 - i}`,
        monthLabel: monthNames[month.getMonth()],
        amount: currency === "AFN" ? amountAfn : amountUsd,
      });
    }

    return last6Months;
  }, [sales, currency, language]);

  // Recent sales (last 5)
  const recentSales = [...filteredSales]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const stats = [
    {
      label: language === "fa" ? "کل فروش" : language === "ps" ? "ټول پلور" : "Total Sales",
      value: formatCurrency(totalSales, currency),
      icon: ShoppingCart,
      color: "bg-blue-500",
      light: "bg-blue-50",
      textColor: "text-blue-500",
    },
    {
      label: language === "fa" ? "مجموع مصارف" : language === "ps" ? "ٹول لګښتونه" : "Total Expenses",
      value: formatCurrency(totalExpenses, currency),
      icon: TrendingDown,
      color: "bg-red-500",
      light: "bg-red-50",
      textColor: "text-red-500",
    },
    {
      label: language === "fa" ? "عواید خالص" : language === "ps" ? "خالص عاید" : "Net Profit",
      value: formatCurrency(netProfit, currency),
      icon: TrendingUp,
      color: "bg-emerald-500",
      light: "bg-emerald-50",
      textColor: "text-emerald-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Date Filter */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h3 className="text-gray-800 font-semibold">
              {language === "fa" ? "فلتر زمانی راپور" : "Report Time Filter"}
            </h3>
          </div>

          {/* دکمه Export All Data - فقط برای ادمین */}
          {isAdmin && (
            <Button
              onClick={handleExportAllData}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
            >
              <Download className="w-4 h-4 ml-2" />
              {language === "fa" ? "دانلود گزارش کامل" : "Export All Data"}
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex gap-2">
            {[
              { value: "all", label: language === "fa" ? "همه" : "All" },
              { value: "today", label: language === "fa" ? "امروز" : "Today" },
              { value: "week", label: language === "fa" ? "هفته" : "Week" },
              { value: "month", label: language === "fa" ? "ماه" : "Month" },
              { value: "custom", label: language === "fa" ? "دلخواه" : "Custom" },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setDateFilter(filter.value as any)}
                className={`px-4 py-2 rounded-xl text-sm transition-colors font-medium ${
                  dateFilter === filter.value ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {dateFilter === "custom" && (
            <div className="flex gap-3">
              <div>
                <label htmlFor="dashboard-from-date" className="block text-xs text-gray-500 mb-1">{language === "fa" ? "از تاریخ" : "From"}</label>
                <input
                  id="dashboard-from-date"
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="dashboard-to-date" className="block text-xs text-gray-500 mb-1">{language === "fa" ? "تا تاریخ" : "To"}</label>
                <input
                  id="dashboard-to-date"
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Total Capital Card */}
      <div className="bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl p-6 shadow-lg text-white">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
            <Banknote className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-violet-100 text-sm mb-1">
              {language === "fa" ? "کل سرمایه" : "Total Capital"}
            </p>
            <p className="text-4xl font-bold">
              {formatCurrency(totalCapital, currency)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-violet-200" />
              <p className="text-violet-100 text-xs">
                {language === "fa" ? "ارزش موجودی انبار" : "Stock Value"}
              </p>
            </div>
            <p className="text-xl text-white font-semibold">
              {formatCurrency(stockValue, currency)}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-violet-200" />
              <p className="text-violet-100 text-xs">
                {language === "fa" ? "پول نقد دریافتی" : "Cash Received"}
              </p>
            </div>
            <p className="text-xl text-white font-semibold">
              {formatCurrency(allPaid, currency)}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-violet-200" />
              <p className="text-violet-100 text-xs">
                {language === "fa" ? "طلب از مشتریان" : "Customer Debts"}
              </p>
            </div>
            <p className="text-xl text-white font-semibold">
              {formatCurrency(totalDebt, currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Net Profit Card */}
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 shadow-lg text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-emerald-100 text-sm mb-1">
                {language === "fa" ? "عواید خالص (دریافتی)" : "Net Profit (Received)"}
              </p>
              <p className="text-4xl font-bold">
                {formatCurrency(netProfit, currency)}
              </p>
              <p className="text-emerald-200 text-xs mt-1">
                {language === "fa" ? `فروش - خرید - مصارف` : `Sales - Cost - Expenses`}
              </p>
            </div>
          </div>
          <div className="text-left">
            <p className="text-emerald-100 text-sm mb-1">{language === "fa" ? "از مجموع فروش" : "Out of Total Sales"}</p>
            <p className="text-xl font-semibold">
              {formatCurrency(totalPaid, currency)}
            </p>
            <p className="text-emerald-200 text-xs mt-1">
              {totalSales > 0 ? `${Math.round((totalPaid / totalSales) * 100)}%` : "0%"}{" "}
              {language === "fa" ? "دریافت شده" : "received"}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-5 shadow-sm border border-gray-100 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-11 h-11 rounded-xl ${stat.light} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-300" />
            </div>
            <p className="text-gray-500 text-sm mb-1">{stat.label}</p>
            <p className="text-gray-900 text-xl font-bold">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 shadow-sm border border-gray-100 rounded-2xl">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-gray-500 text-sm">{language === "fa" ? "تعداد مشتریان" : "Total Customers"}</p>
              <p className="text-2xl font-bold">
                {customers.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 shadow-sm border border-gray-100 rounded-2xl">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-violet-500" />
            <div>
              <p className="text-gray-500 text-sm">{language === "fa" ? "تعداد اجناس" : "Total Products"}</p>
              <p className="text-2xl font-bold">
                {products.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 shadow-sm border border-gray-100 rounded-2xl">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-gray-500 text-sm">{language === "fa" ? "قرضه مشتریان" : "Customer Debt"}</p>
              <p className="text-2xl font-bold">
                {formatCurrency(totalDebt, currency)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 shadow-sm border border-gray-100 rounded-2xl">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-amber-500" />
            <div>
              <p className="text-gray-500 text-sm">{language === "fa" ? "کم موجودی" : "Low Stock"}</p>
              <p className="text-2xl font-bold">
                {lowStockProducts}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Monthly Sales Chart */}
        <div className="xl:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <h3 className="text-gray-800 font-semibold">
              {language === "fa" ? `فروش ماهانه (${currency === "AFN" ? "افغانی" : "دالر"})` : `Monthly Sales (${currency})`}
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart id="monthly-sales-chart" data={monthlySalesData} barSize={32}>
              <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis key="xaxis" dataKey="month" tickFormatter={(v) => v.split("-")[0]} tick={{ fontSize: 12, fontFamily: "Vazirmatn" }} />
              <YAxis key="yaxis" tick={{ fontSize: 12, fontFamily: "Vazirmatn" }} />
              <Tooltip
                key="tooltip"
                formatter={(v: number) => [formatCurrency(v, currency), language === "fa" ? "فروش" : "Sales"]}
                wrapperClassName="recharts-tooltip-rtl"
                labelClassName="recharts-tooltip-label-rtl"
              />
              <Bar key="bar" dataKey="amount" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-gray-800 mb-5 font-semibold">
            {language === "fa" ? "دسته‌بندی اجناس" : "Product Categories"}
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart id="category-pie-chart">
              <Pie
                key="pie"
                data={categoryData}
                cx="50%"
                cy="45%"
                outerRadius={80}
                dataKey="value"
                nameKey="name"
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={{ stroke: "#ccc" }}
              >
                {categoryData.map((entry, idx) => (
                  <Cell key={entry.id} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Legend
                key="legend"
                formatter={(value) => <span className="text-[12px]">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Shareholders Section */}
      {shareholders.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-5 h-5 text-violet-500" />
            <h3 className="text-gray-800 font-semibold">
              {language === "fa" ? "سهم سهام‌داران از مفاد" : language === "ps" ? "د ونډه لرونکو د ګټې ونډه" : "Shareholder Profit Distribution"}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-right border-b border-gray-100">
                  <th className="pb-3 text-gray-500 pr-0 font-medium">
                    {language === "fa" ? "نام" : language === "ps" ? "نوم" : "Name"}
                  </th>
                  <th className="pb-3 text-gray-500 font-medium">
                    {language === "fa" ? "سرمایه (AFN)" : language === "ps" ? "پانګه (؋)" : "Investment (AFN)"}
                  </th>
                  <th className="pb-3 text-gray-500 font-medium">
                    {language === "fa" ? "سرمایه (USD)" : language === "ps" ? "پانګه ($)" : "Investment (USD)"}
                  </th>
                  <th className="pb-3 text-gray-500 font-medium">
                    {language === "fa" ? "فیصدی" : language === "ps" ? "سلنه" : "Share %"}
                  </th>
                  <th className="pb-3 text-gray-500 font-medium">
                    {language === "fa" ? `سهم از مفاد (${currency})` : language === "ps" ? `د ګټې ونډه (${currency})` : `Profit Share (${currency})`}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {shareholderShares.map((sh) => (
                  <tr key={sh.shareholder_id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 text-gray-800 pr-0 font-medium">
                      {sh.name}
                    </td>
                    <td className="py-3 text-gray-600">{formatCurrency(sh.investment_amount_afn, "AFN")}</td>
                    <td className="py-3 text-gray-600">{formatCurrency(sh.investment_amount_usd, "USD")}</td>
                    <td className="py-3 text-gray-800">{sh.share_percentage}%</td>
                    <td className="py-3 text-emerald-600 font-semibold">
                      {formatCurrency(currency === "AFN" ? sh.shareAfn : sh.shareUsd, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Supplier Overview Section */}
      {suppliers.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-indigo-500" />
            <h3 className="text-gray-800 font-semibold">
              {language === "fa" ? "وضعیت سپلایرها" : language === "ps" ? "د عرضه کوونکو حالت" : "Supplier Overview"}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <p className="text-indigo-700 text-sm font-medium">
                  {language === "fa" ? "تعداد سپلایرها" : language === "ps" ? "د عرضه کوونکو شمیر" : "Total Suppliers"}
                </p>
              </div>
              <p className="text-2xl text-indigo-900 font-bold">
                {suppliers.length}
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                <p className="text-blue-700 text-sm font-medium">
                  {language === "fa" ? "کل خریداری" : language === "ps" ? "ټول پیرودنه" : "Total Purchases"}
                </p>
              </div>
              <p className="text-2xl text-blue-900 font-bold">
                {formatCurrency(totalSupplierPurchases, currency)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <p className="text-emerald-700 text-sm font-medium">
                  {language === "fa" ? "کل پرداخت‌ها" : language === "ps" ? "ټول تادیات" : "Total Payments"}
                </p>
              </div>
              <p className="text-2xl text-emerald-900 font-bold">
                {formatCurrency(totalSupplierPayments, currency)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <p className="text-rose-700 text-sm font-medium">
                  {language === "fa" ? "بدهی باقی‌مانده" : language === "ps" ? "پاتې پور" : "Remaining Debt"}
                </p>
              </div>
              <p className="text-2xl text-rose-900 font-bold">
                {formatCurrency(totalSupplierDebt, currency)}
              </p>
            </div>
          </div>

          {/* Payment Status Bar */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-700 text-sm font-medium">
                {language === "fa" ? "وضعیت پرداخت‌ها" : language === "ps" ? "د تادیاتو حالت" : "Payment Status"}
              </p>
              <p className="text-gray-600 text-sm">
                {totalSupplierPurchases > 0
                  ? `${Math.round((totalSupplierPayments / totalSupplierPurchases) * 100)}%`
                  : "0%"}{" "}
                {language === "fa" ? "پرداخت شده" : language === "ps" ? "تادیه شوی" : "paid"}
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <Progress
                value={totalSupplierPurchases > 0 ? Math.round((totalSupplierPayments / totalSupplierPurchases) * 100) : 0}
                className="h-3 rounded-full bg-gray-200"
              />
            </div>
          </div>
        </div>
      )}

      {/* Recent Sales Table */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-gray-800 mb-4 font-semibold">
          {language === "fa" ? "آخرین فروش‌ها" : "Recent Sales"}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-right border-b border-gray-100">
                <th className="pb-3 text-gray-500 pr-0 font-medium">
                  {language === "fa" ? "مشتری" : "Customer"}
                </th>
                <th className="pb-3 text-gray-500 font-medium">
                  {language === "fa" ? "تاریخ" : "Date"}
                </th>
                <th className="pb-3 text-gray-500 font-medium">
                  {language === "fa" ? "مبلغ کل" : "Total"}
                </th>
                <th className="pb-3 text-gray-500 font-medium">
                  {language === "fa" ? "وضعیت" : "Status"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentSales.map((sale) => {
                const customer = customers.find((c) => c.customer_id === sale.customer_id);
                return (
                  <tr key={sale.sale_id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 text-gray-800 pr-0 font-medium">
                      {customer?.name || (language === "fa" ? "نامشخص" : "Unknown")}
                    </td>
                    <td className="py-3 text-gray-500">{sale.date}</td>
                    <td className="py-3 text-gray-800">{formatCurrency(sale.total_amount, sale.currency)}</td>
                    <td className="py-3">
                      {sale.remaining_amount === 0 ? (
                        <span
                          className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-medium"
                        >
                          {language === "fa" ? "پرداخت شده" : "Paid"}
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium">
                          {formatCurrency(sale.remaining_amount, sale.currency)} {language === "fa" ? "باقی" : "remaining"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
