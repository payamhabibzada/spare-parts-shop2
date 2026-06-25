import * as XLSX from 'xlsx';
import type {
  Product,
  Customer,
  Sale,
  SaleItem,
  Payment,
  Withdrawal,
  Expense,
  ShareHolder,
  User,
  ActivityLog,
  Supplier,
  SupplierPurchase,
  SupplierPayment,
  Language,
} from '../store/AppContext';

interface ExportAllDataParams {
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  saleItems: SaleItem[];
  payments: Payment[];
  withdrawals: Withdrawal[];
  expenses: Expense[];
  shareholders: ShareHolder[];
  users: User[];
  activityLogs: ActivityLog[];
  suppliers: Supplier[];
  supplierPurchases: SupplierPurchase[];
  supplierPayments: SupplierPayment[];
  cashAfn: number;
  cashUsd: number;
  language: Language;
  dateFrom?: string;
  dateTo?: string;
}

export function exportAllDataToExcel(params: ExportAllDataParams) {
  const {
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
    dateFrom,
    dateTo,
  } = params;

  const isFa = language === 'fa';
  const workbook = XLSX.utils.book_new();

  // فیلتر بر اساس تاریخ
  const filterByDate = (date: string) => {
    if (!dateFrom && !dateTo) return true;
    if (dateFrom && date < dateFrom) return false;
    if (dateTo && date > dateTo) return false;
    return true;
  };

  // ===== Sheet 1: خلاصه مالی =====
  const summaryData = [
    [isFa ? 'گزارش کامل سیستم' : 'Complete System Report'],
    [isFa ? 'تاریخ تولید گزارش:' : 'Report Date:', new Date().toLocaleDateString('fa-IR')],
    [isFa ? 'بازه زمانی:' : 'Date Range:', dateFrom || 'همه', 'تا', dateTo || 'همه'],
    [],
    [isFa ? 'خلاصه مالی' : 'Financial Summary'],
    [isFa ? 'پول نقد (افغانی):' : 'Cash (AFN):', cashAfn],
    [isFa ? 'پول نقد (دالر):' : 'Cash (USD):', cashUsd],
    [isFa ? 'تعداد مشتریان:' : 'Total Customers:', customers.length],
    [isFa ? 'تعداد فروش:' : 'Total Sales:', sales.filter(s => filterByDate(s.date)).length],
    [isFa ? 'تعداد اجناس:' : 'Total Products:', products.length],
    [isFa ? 'تعداد کاربران:' : 'Total Users:', users.length],
    [],
    [isFa ? 'کل قرضه‌ها (افغانی):' : 'Total Debts (AFN):', customers.reduce((sum, c) => sum + c.balance_afn, 0)],
    [isFa ? 'کل قرضه‌ها (دالر):' : 'Total Debts (USD):', customers.reduce((sum, c) => sum + c.balance_usd, 0)],
    [isFa ? 'تعداد خریدهای تامین‌کننده:' : 'Supplier Purchases:', supplierPurchases.length],
    [isFa ? 'تعداد پرداخت‌های تامین‌کننده:' : 'Supplier Payments:', supplierPayments.length],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, isFa ? 'خلاصه' : 'Summary');

  // ===== Sheet 2: اجناس =====
  const productsData = [
    [
      isFa ? 'نام جنس' : 'Product Name',
      isFa ? 'دسته‌بندی' : 'Category',
      isFa ? 'قیمت خرید (افغانی)' : 'Buy Price (AFN)',
      isFa ? 'قیمت خرید (دالر)' : 'Buy Price (USD)',
      isFa ? 'قیمت فروش (افغانی)' : 'Sell Price (AFN)',
      isFa ? 'قیمت فروش (دالر)' : 'Sell Price (USD)',
      isFa ? 'موجودی' : 'Stock',
      isFa ? 'حداقل موجودی' : 'Min Stock',
      isFa ? 'بارکود' : 'Barcode',
      isFa ? 'توضیحات' : 'Description',
    ],
    ...products.map(p => [
      p.name,
      p.category,
      p.buy_price_afn,
      p.buy_price_usd,
      p.sell_price_afn,
      p.sell_price_usd,
      p.stock,
      p.min_stock,
      p.barcode || '',
      p.description,
    ]),
  ];
  const productsSheet = XLSX.utils.aoa_to_sheet(productsData);
  XLSX.utils.book_append_sheet(workbook, productsSheet, isFa ? 'اجناس' : 'Products');

  // ===== Sheet 3: مشتریان =====
  const customersData = [
    [
      isFa ? 'نام' : 'Name',
      isFa ? 'تلفن' : 'Phone',
      isFa ? 'آدرس' : 'Address',
      isFa ? 'قرضه (افغانی)' : 'Balance (AFN)',
      isFa ? 'قرضه (دالر)' : 'Balance (USD)',
    ],
    ...customers.map(c => [
      c.name,
      c.phone,
      c.address,
      c.balance_afn,
      c.balance_usd,
    ]),
    [],
    [isFa ? 'مجموع قرضه‌ها (افغانی):' : 'Total Debts (AFN):', customers.reduce((sum, c) => sum + c.balance_afn, 0)],
    [isFa ? 'مجموع قرضه‌ها (دالر):' : 'Total Debts (USD):', customers.reduce((sum, c) => sum + c.balance_usd, 0)],
  ];
  const customersSheet = XLSX.utils.aoa_to_sheet(customersData);
  XLSX.utils.book_append_sheet(workbook, customersSheet, isFa ? 'مشتریان' : 'Customers');

  // ===== Sheet 4: فروش =====
  const filteredSales = sales.filter(s => filterByDate(s.date));
  const salesData = [
    [
      isFa ? 'شماره فاکتور' : 'Invoice No',
      isFa ? 'تاریخ' : 'Date',
      isFa ? 'نام مشتری' : 'Customer',
      isFa ? 'واحد پول' : 'Currency',
      isFa ? 'مبلغ کل' : 'Total Amount',
      isFa ? 'تخفیف' : 'Discount',
      isFa ? 'مبلغ پرداختی' : 'Paid Amount',
      isFa ? 'باقی‌مانده' : 'Remaining',
      isFa ? 'وضعیت' : 'Status',
    ],
    ...filteredSales.map(s => {
      const customer = customers.find(c => c.customer_id === s.customer_id);
      return [
        s.invoice_number || s.sale_id,
        s.date,
        customer?.name || '',
        s.currency,
        s.total_amount,
        s.discount,
        s.paid_amount,
        s.remaining_amount,
        s.payment_status || (s.remaining_amount === 0 ? 'paid' : s.paid_amount === 0 ? 'credit' : 'partial'),
      ];
    }),
    [],
    [isFa ? 'مجموع فروش:' : 'Total Sales:', filteredSales.reduce((sum, s) => sum + s.total_amount, 0)],
    [isFa ? 'مجموع پرداختی:' : 'Total Paid:', filteredSales.reduce((sum, s) => sum + s.paid_amount, 0)],
    [isFa ? 'مجموع باقی‌مانده:' : 'Total Remaining:', filteredSales.reduce((sum, s) => sum + s.remaining_amount, 0)],
  ];
  const salesSheet = XLSX.utils.aoa_to_sheet(salesData);
  XLSX.utils.book_append_sheet(workbook, salesSheet, isFa ? 'فروش' : 'Sales');

  // ===== Sheet 5: جزئیات فروش =====
  const saleItemsData = [
    [
      isFa ? 'شماره فاکتور' : 'Invoice No',
      isFa ? 'نام جنس' : 'Product',
      isFa ? 'تعداد' : 'Quantity',
      isFa ? 'قیمت واحد' : 'Unit Price',
      isFa ? 'مجموع' : 'Total',
    ],
    ...saleItems
      .filter(item => {
        const sale = sales.find(s => s.sale_id === item.sale_id);
        return sale && filterByDate(sale.date);
      })
      .map(item => {
        const product = products.find(p => p.product_id === item.product_id);
        const sale = sales.find(s => s.sale_id === item.sale_id);
        return [
          sale?.invoice_number || item.sale_id,
          product?.name || '',
          item.quantity,
          item.price,
          item.quantity * item.price,
        ];
      }),
  ];
  const saleItemsSheet = XLSX.utils.aoa_to_sheet(saleItemsData);
  XLSX.utils.book_append_sheet(workbook, saleItemsSheet, isFa ? 'جزئیات فروش' : 'Sale Items');

  // ===== Sheet 6: پرداخت‌ها =====
  const filteredPayments = payments.filter(p => filterByDate(p.date));
  const paymentsData = [
    [
      isFa ? 'تاریخ' : 'Date',
      isFa ? 'نام مشتری' : 'Customer',
      isFa ? 'مبلغ' : 'Amount',
      isFa ? 'واحد پول' : 'Currency',
      isFa ? 'یادداشت' : 'Note',
    ],
    ...filteredPayments.map(p => {
      const customer = customers.find(c => c.customer_id === p.customer_id);
      return [p.date, customer?.name || '', p.amount, p.currency, p.note];
    }),
    [],
    [isFa ? 'مجموع پرداخت‌ها:' : 'Total Payments:', filteredPayments.reduce((sum, p) => sum + p.amount, 0)],
  ];
  const paymentsSheet = XLSX.utils.aoa_to_sheet(paymentsData);
  XLSX.utils.book_append_sheet(workbook, paymentsSheet, isFa ? 'پرداخت‌ها' : 'Payments');

  // ===== Sheet 7: مصارف =====
  const filteredExpenses = expenses.filter(e => filterByDate(e.date));
  const expensesData = [
    [
      isFa ? 'تاریخ' : 'Date',
      isFa ? 'دسته‌بندی' : 'Category',
      isFa ? 'مبلغ (افغانی)' : 'Amount (AFN)',
      isFa ? 'مبلغ (دالر)' : 'Amount (USD)',
      isFa ? 'توضیحات' : 'Description',
    ],
    ...filteredExpenses.map(e => [e.date, e.category, e.amount_afn, e.amount_usd, e.description]),
    [],
    [isFa ? 'مجموع مصارف (افغانی):' : 'Total Expenses (AFN):', filteredExpenses.reduce((sum, e) => sum + e.amount_afn, 0)],
    [isFa ? 'مجموع مصارف (دالر):' : 'Total Expenses (USD):', filteredExpenses.reduce((sum, e) => sum + e.amount_usd, 0)],
  ];
  const expensesSheet = XLSX.utils.aoa_to_sheet(expensesData);
  XLSX.utils.book_append_sheet(workbook, expensesSheet, isFa ? 'مصارف' : 'Expenses');

  // ===== Sheet 8: برداشت‌ها =====
  const filteredWithdrawals = withdrawals.filter(w => filterByDate(w.date));
  const withdrawalsData = [
    [
      isFa ? 'تاریخ' : 'Date',
      isFa ? 'دسته‌بندی' : 'Category',
      isFa ? 'نام شخص' : 'Person Name',
      isFa ? 'مبلغ (افغانی)' : 'Amount (AFN)',
      isFa ? 'مبلغ (دالر)' : 'Amount (USD)',
      isFa ? 'توضیحات' : 'Description',
    ],
    ...filteredWithdrawals.map(w => [
      w.date,
      w.category,
      w.person_name,
      w.amount_afn,
      w.amount_usd,
      w.description,
    ]),
    [],
    [isFa ? 'مجموع برداشت‌ها (افغانی):' : 'Total Withdrawals (AFN):', filteredWithdrawals.reduce((sum, w) => sum + w.amount_afn, 0)],
    [isFa ? 'مجموع برداشت‌ها (دالر):' : 'Total Withdrawals (USD):', filteredWithdrawals.reduce((sum, w) => sum + w.amount_usd, 0)],
  ];
  const withdrawalsSheet = XLSX.utils.aoa_to_sheet(withdrawalsData);
  XLSX.utils.book_append_sheet(workbook, withdrawalsSheet, isFa ? 'برداشت‌ها' : 'Withdrawals');

  // ===== Sheet 9: سهامداران =====
  const shareholdersData = [
    [
      isFa ? 'نام' : 'Name',
      isFa ? 'تلفن' : 'Phone',
      isFa ? 'آدرس' : 'Address',
      isFa ? 'سرمایه (افغانی)' : 'Investment (AFN)',
      isFa ? 'سرمایه (دالر)' : 'Investment (USD)',
      isFa ? 'درصد سهام' : 'Share %',
      isFa ? 'سود ماهانه (افغانی)' : 'Monthly Profit (AFN)',
      isFa ? 'سود ماهانه (دالر)' : 'Monthly Profit (USD)',
    ],
    ...shareholders.map(s => [
      s.name,
      s.phone,
      s.address,
      s.investment_amount_afn,
      s.investment_amount_usd,
      s.share_percentage,
      s.monthly_profit_afn,
      s.monthly_profit_usd,
    ]),
    [],
    [isFa ? 'مجموع سرمایه (افغانی):' : 'Total Investment (AFN):', shareholders.reduce((sum, s) => sum + s.investment_amount_afn, 0)],
    [isFa ? 'مجموع سرمایه (دالر):' : 'Total Investment (USD):', shareholders.reduce((sum, s) => sum + s.investment_amount_usd, 0)],
  ];
  const shareholdersSheet = XLSX.utils.aoa_to_sheet(shareholdersData);
  XLSX.utils.book_append_sheet(workbook, shareholdersSheet, isFa ? 'سهامداران' : 'Shareholders');

  // ===== Sheet 10: سپلایرها =====
  const suppliersData = [
    [
      isFa ? 'نام' : 'Name',
      isFa ? 'نام شرکت' : 'Company',
      isFa ? 'تلفن' : 'Phone',
      isFa ? 'آدرس' : 'Address',
      isFa ? 'بدهی (افغانی)' : 'Balance (AFN)',
      isFa ? 'بدهی (دالر)' : 'Balance (USD)',
    ],
    ...suppliers.map(s => [
      s.name,
      s.company_name,
      s.phone,
      s.address,
      s.balance_afn,
      s.balance_usd,
    ]),
    [],
    [isFa ? 'مجموع بدهی (افغانی):' : 'Total Balance (AFN):', suppliers.reduce((sum, s) => sum + s.balance_afn, 0)],
    [isFa ? 'مجموع بدهی (دالر):' : 'Total Balance (USD):', suppliers.reduce((sum, s) => sum + s.balance_usd, 0)],
  ];
  const suppliersSheet = XLSX.utils.aoa_to_sheet(suppliersData);
  XLSX.utils.book_append_sheet(workbook, suppliersSheet, isFa ? 'سپلایرها' : 'Suppliers');

  // ===== Sheet 11: کاربران =====
  const usersData = [
    [
      isFa ? 'نام کامل' : 'Full Name',
      isFa ? 'نام کاربری' : 'Username',
      isFa ? 'ایمیل' : 'Email',
      isFa ? 'نقش' : 'Role',
      isFa ? 'وضعیت' : 'Status',
      isFa ? 'دسترسی‌ها' : 'Permissions',
    ],
    ...users.map(u => [
      u.full_name,
      u.username,
      u.email,
      u.role,
      u.is_active ? (isFa ? 'فعال' : 'Active') : (isFa ? 'غیرفعال' : 'Inactive'),
      u.permissions.join(', '),
    ]),
  ];
  const usersSheet = XLSX.utils.aoa_to_sheet(usersData);
  XLSX.utils.book_append_sheet(workbook, usersSheet, isFa ? 'کاربران' : 'Users');

  // ===== Sheet 12: لاگ فعالیت =====
  const filteredLogs = activityLogs.filter(l => filterByDate(l.date));
  const logsData = [
    [
      isFa ? 'تاریخ' : 'Date',
      isFa ? 'زمان' : 'Time',
      isFa ? 'نام کاربر' : 'User',
      isFa ? 'نام کامل' : 'Full Name',
      isFa ? 'عملیات' : 'Action',
      isFa ? 'بخش' : 'Entity',
      isFa ? 'نام موجودیت' : 'Entity Name',
      isFa ? 'توضیحات' : 'Description',
    ],
    ...filteredLogs.map(l => [
      l.date,
      l.time,
      l.username,
      l.full_name,
      l.action,
      l.entity,
      l.entity_name,
      l.description,
    ]),
  ];
  const logsSheet = XLSX.utils.aoa_to_sheet(logsData);
  XLSX.utils.book_append_sheet(workbook, logsSheet, isFa ? 'لاگ فعالیت' : 'Activity Log');

  // ذخیره فایل
  const fileName = `System_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
