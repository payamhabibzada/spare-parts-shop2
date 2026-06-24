import { useState } from "react";
import { useApp, formatCurrency } from "../store/AppContext";
import { Plus, Search, Trash2, CreditCard, X, CheckCircle } from "lucide-react";

interface PaymentFormData {
  customer_id: string;
  amount: string;
  currency: "AFN" | "USD";
  date: string;
  note: string;
}

const today = new Date().toISOString().split("T")[0];
const emptyForm: PaymentFormData = { customer_id: "", amount: "", currency: "AFN", date: today, note: "" };

export default function Payments() {
  const { payments, customers, addPayment, deletePayment, getCustomerById, language, currency } = useApp();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<PaymentFormData>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = [...payments]
    .filter(p => {
      const customer = getCustomerById(p.customer_id);
      return customer?.name.toLowerCase().includes(search.toLowerCase()) ||
        p.note.toLowerCase().includes(search.toLowerCase()) ||
        p.date.includes(search);
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_id || !form.amount) return;
    addPayment({
      customer_id: form.customer_id,
      amount: Number(form.amount),
      currency: form.currency,
      date: form.date,
      note: form.note,
    });
    setShowModal(false);
    setForm(emptyForm);
  };

  const selectedCustomer = form.customer_id ? customers.find(c => c.customer_id === form.customer_id) : null;

  const debtorCustomers = customers.filter(c => c.balance_afn > 0 || c.balance_usd > 0);
  const totalPaymentsAfn = payments.filter(p => p.currency === "AFN").reduce((s, p) => s + p.amount, 0);
  const totalPaymentsUsd = payments.filter(p => p.currency === "USD").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm mb-1">{language === "fa" ? "پرداخت‌ها (افغانی)" : "Payments (AFN)"}</p>
          <p className="text-gray-800" style={{ fontWeight: 700 }}>{formatCurrency(totalPaymentsAfn, "AFN")}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm mb-1">{language === "fa" ? "پرداخت‌ها (دالر)" : "Payments (USD)"}</p>
          <p className="text-gray-800" style={{ fontWeight: 700 }}>{formatCurrency(totalPaymentsUsd, "USD")}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm mb-1">{language === "fa" ? "تعداد پرداخت‌ها" : "Total Payments"}</p>
          <p className="text-gray-800" style={{ fontWeight: 700 }}>{payments.length} {language === "fa" ? "پرداخت" : "payments"}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm mb-1">{language === "fa" ? "مشتریان بدهکار" : "Debtors"}</p>
          <p className="text-red-500" style={{ fontWeight: 700 }}>{debtorCustomers.length} {language === "fa" ? "نفر" : "customers"}</p>
        </div>
      </div>

      {/* Debtors quick list */}
      {debtorCustomers.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
          <h4 className="text-red-700 text-sm mb-3" style={{ fontWeight: 600 }}>{language === "fa" ? "مشتریان بدهکار" : "Debtors"}</h4>
          <div className="flex flex-wrap gap-2">
            {debtorCustomers.map(c => (
              <div key={c.customer_id} className="bg-white rounded-xl px-3 py-2 text-sm border border-red-100">
                <span className="text-gray-800" style={{ fontWeight: 500 }}>{c.name}</span>
                {c.balance_afn > 0 && (
                  <span className="text-red-500 mr-2" style={{ fontWeight: 600 }}>{formatCurrency(c.balance_afn, "AFN")}</span>
                )}
                {c.balance_usd > 0 && (
                  <span className="text-red-500 mr-2" style={{ fontWeight: 600 }}>{formatCurrency(c.balance_usd, "USD")}</span>
                )}
                <button
                  onClick={() => {
                    setForm({ ...emptyForm, customer_id: c.customer_id, currency: c.balance_afn > 0 ? "AFN" : "USD" });
                    setShowModal(true);
                  }}
                  className="text-blue-500 hover:text-blue-700 text-xs mr-1"
                  style={{ fontWeight: 500 }}
                >
                  {language === "fa" ? "ثبت پرداخت" : "Add Payment"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="flex gap-3 items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className={`absolute ${language === "fa" ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={language === "fa" ? "جستجوی پرداخت..." : "Search payments..."}
            className={`w-full bg-white border border-gray-200 rounded-xl ${language === "fa" ? "pr-10 pl-4" : "pl-10 pr-4"} py-2.5 text-sm focus:outline-none focus:border-blue-400`}
          />
        </div>
        <button
          onClick={() => { setForm(emptyForm); setShowModal(true); }}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl transition-colors text-sm"
          style={{ fontWeight: 600 }}
        >
          <Plus className="w-4 h-4" />
          {language === "fa" ? "ثبت پرداخت" : "Add Payment"}
        </button>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className={language === "fa" ? "text-right" : "text-left"}>
                <th className="px-4 py-3 text-gray-500" style={{ fontWeight: 500 }}>{language === "fa" ? "مشتری" : "Customer"}</th>
                <th className="px-4 py-3 text-gray-500" style={{ fontWeight: 500 }}>{language === "fa" ? "مبلغ" : "Amount"}</th>
                <th className="px-4 py-3 text-gray-500" style={{ fontWeight: 500 }}>{language === "fa" ? "واحد پول" : "Currency"}</th>
                <th className="px-4 py-3 text-gray-500 hidden sm:table-cell" style={{ fontWeight: 500 }}>{language === "fa" ? "تاریخ" : "Date"}</th>
                <th className="px-4 py-3 text-gray-500 hidden md:table-cell" style={{ fontWeight: 500 }}>{language === "fa" ? "یادداشت" : "Note"}</th>
                <th className="px-4 py-3 text-gray-500 hidden md:table-cell" style={{ fontWeight: 500 }}>{language === "fa" ? "قرضه باقی‌مانده" : "Remaining Debt"}</th>
                <th className="px-4 py-3 text-gray-500 text-center" style={{ fontWeight: 500 }}>{language === "fa" ? "عملیات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(payment => {
                const customer = getCustomerById(payment.customer_id);
                const customerDebt = payment.currency === "AFN" ? customer?.balance_afn || 0 : customer?.balance_usd || 0;
                return (
                  <tr key={payment.payment_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        </div>
                        <span className="text-gray-800" style={{ fontWeight: 500 }}>{customer?.name || (language === "fa" ? "نامشخص" : "Unknown")}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-emerald-600" style={{ fontWeight: 700 }}>
                      {formatCurrency(payment.amount, payment.currency)}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{payment.currency}</td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{payment.date}</td>
                    <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{payment.note || "-"}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {customer && customerDebt > 0 ? (
                        <span className="text-red-500 text-xs" style={{ fontWeight: 500 }}>
                          {formatCurrency(customerDebt, payment.currency)}
                        </span>
                      ) : (
                        <span className="text-emerald-500 text-xs" style={{ fontWeight: 500 }}>{language === "fa" ? "تسویه" : "Settled"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setDeleteConfirm(payment.payment_id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{language === "fa" ? "هیچ پرداختی ثبت نشده" : "No payments recorded"}</p>
          </div>
        )}
      </div>

      {/* Add Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir={language === "fa" ? "rtl" : "ltr"}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-gray-800" style={{ fontWeight: 700 }}>{language === "fa" ? "ثبت پرداخت جدید" : "Add New Payment"}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">{language === "fa" ? "مشتری *" : "Customer *"}</label>
                <select
                  required
                  value={form.customer_id}
                  onChange={e => setForm({ ...form, customer_id: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white"
                >
                  <option value="">{language === "fa" ? "انتخاب مشتری..." : "Select customer..."}</option>
                  {customers.map(c => {
                    const hasDebt = c.balance_afn > 0 || c.balance_usd > 0;
                    const debtText = hasDebt
                      ? `(${c.balance_afn > 0 ? formatCurrency(c.balance_afn, "AFN") : ""} ${c.balance_usd > 0 ? formatCurrency(c.balance_usd, "USD") : ""})`
                      : language === "fa" ? "(تسویه)" : "(Settled)";
                    return (
                      <option key={c.customer_id} value={c.customer_id}>
                        {c.name} {debtText}
                      </option>
                    );
                  })}
                </select>
                {selectedCustomer && (selectedCustomer.balance_afn > 0 || selectedCustomer.balance_usd > 0) && (
                  <p className="text-red-500 text-xs mt-1.5">
                    {language === "fa" ? "قرضه باقی‌مانده:" : "Remaining debt:"} {selectedCustomer.balance_afn > 0 && formatCurrency(selectedCustomer.balance_afn, "AFN")} {selectedCustomer.balance_usd > 0 && formatCurrency(selectedCustomer.balance_usd, "USD")}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">{language === "fa" ? "واحد پول *" : "Currency *"}</label>
                <select
                  required
                  value={form.currency}
                  onChange={e => setForm({ ...form, currency: e.target.value as "AFN" | "USD" })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white"
                >
                  <option value="AFN">{language === "fa" ? "افغانی (؋)" : "Afghani (AFN)"}</option>
                  <option value="USD">{language === "fa" ? "دالر ($)" : "Dollar (USD)"}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">{language === "fa" ? "مبلغ پرداختی *" : "Payment Amount *"}</label>
                <input
                  required
                  type="number"
                  min="1"
                  step="0.01"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                  placeholder="0"
                />
                {selectedCustomer && form.currency && (
                  <div className="flex gap-2 mt-1.5">
                    {form.currency === "AFN" && selectedCustomer.balance_afn > 0 && (
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, amount: selectedCustomer.balance_afn.toString() })}
                        className="text-blue-500 text-xs hover:underline"
                        style={{ fontWeight: 500 }}
                      >
                        {language === "fa" ? "پرداخت کامل قرضه" : "Pay full debt"} ({formatCurrency(selectedCustomer.balance_afn, "AFN")})
                      </button>
                    )}
                    {form.currency === "USD" && selectedCustomer.balance_usd > 0 && (
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, amount: selectedCustomer.balance_usd.toString() })}
                        className="text-blue-500 text-xs hover:underline"
                        style={{ fontWeight: 500 }}
                      >
                        {language === "fa" ? "پرداخت کامل قرضه" : "Pay full debt"} ({formatCurrency(selectedCustomer.balance_usd, "USD")})
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">{language === "fa" ? "تاریخ *" : "Date *"}</label>
                <input
                  required
                  type="date"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">{language === "fa" ? "یادداشت" : "Note"}</label>
                <input
                  value={form.note}
                  onChange={e => setForm({ ...form, note: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                  placeholder={language === "fa" ? "مثلاً: پرداخت نقد، انتقال بانکی..." : "e.g: Cash payment, Bank transfer..."}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl text-sm transition-colors"
                  style={{ fontWeight: 600 }}
                >
                  {language === "fa" ? "ثبت پرداخت" : "Add Payment"}
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
            <h3 className="text-gray-800 mb-2" style={{ fontWeight: 700 }}>{language === "fa" ? "حذف پرداخت" : "Delete Payment"}</h3>
            <p className="text-gray-500 text-sm mb-6">{language === "fa" ? "با حذف این پرداخت، قرضه مشتری دوباره اضافه می‌شود." : "Deleting this payment will restore the customer's debt."}</p>
            <div className="flex gap-3">
              <button
                onClick={() => { deletePayment(deleteConfirm); setDeleteConfirm(null); }}
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
