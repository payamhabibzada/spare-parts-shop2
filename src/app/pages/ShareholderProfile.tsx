import { useParams, useNavigate } from "react-router";
import { useApp, formatCurrency } from "../store/AppContext";
import { Button } from "../components/ui/button";
import { ArrowLeft, Banknote, TrendingUp, ArrowDownToLine, User, Phone, MapPin, Calendar, DollarSign } from "lucide-react";

export default function ShareholderProfile() {
  const { shareholderId } = useParams<{ shareholderId: string }>();
  const navigate = useNavigate();
  const { shareholders, withdrawals, language } = useApp();

  const shareholder = shareholders.find(sh => sh.shareholder_id === shareholderId);
  const shareholderWithdrawals = withdrawals
    .filter((w) => w.category === "shareholder" && w.person_name === shareholder?.name)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (!shareholder) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          {language === "fa" ? "سهام‌دار یافت نشد" :
          language === "ps" ? "ونډه لرونکی و نه موندل شو" :
          "Shareholder not found"}
        </p>
        <Button onClick={() => navigate("/shareholders")} className="mt-4">
          {language === "fa" ? "بازگشت" : language === "ps" ? "بیرته" : "Go Back"}
        </Button>
      </div>
    );
  }

  // Calculate totals
  const totalWithdrawalsAfn = shareholderWithdrawals.reduce((sum, w) => sum + w.amount_afn, 0);
  const totalWithdrawalsUsd = shareholderWithdrawals.reduce((sum, w) => sum + w.amount_usd, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" onClick={() => navigate("/shareholders")}>
            <ArrowLeft className="w-4 h-4 ml-2" />
            {language === "fa" ? "بازگشت" : language === "ps" ? "بیرته" : "Back"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl text-gray-800" style={{ fontWeight: 700 }}>
                  {shareholder.name}
                </h1>
                <p className="text-gray-500">
                  {language === "fa" ? "پروفایل سهام‌دار" :
                  language === "ps" ? "د ونډه لرونکي پروفایل" :
                  "Shareholder Profile"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{shareholder.phone || "-"}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{shareholder.address || "-"}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <TrendingUp className="w-4 h-4" />
                <span>
                  {language === "fa" ? "سهم:" : language === "ps" ? "ونډه:" : "Share:"} {shareholder.share_percentage}%
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <p className="text-blue-600 text-sm mb-1">
                {language === "fa" ? "سرمایه افغانی" : language === "ps" ? "پانګه افغانۍ" : "Capital AFN"}
              </p>
              <p className="text-2xl text-blue-700" style={{ fontWeight: 700 }}>
                {formatCurrency(shareholder.investment_amount_afn, "AFN")}
              </p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <p className="text-green-600 text-sm mb-1">
                {language === "fa" ? "سرمایه دالر" : language === "ps" ? "پانګه ډالر" : "Capital USD"}
              </p>
              <p className="text-2xl text-green-700" style={{ fontWeight: 700 }}>
                {formatCurrency(shareholder.investment_amount_usd, "USD")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Profit Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8" />
            <div>
              <p className="text-emerald-100 text-sm">
                {language === "fa" ? "مفاد ماهانه (؋)" : language === "ps" ? "میاشتنۍ ګټه (؋)" : "Monthly Profit (AFN)"}
              </p>
              <p className="text-2xl mt-1" style={{ fontWeight: 700 }}>
                {formatCurrency(shareholder.monthly_profit_afn, "AFN")}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-5 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8" />
            <div>
              <p className="text-teal-100 text-sm">
                {language === "fa" ? "مفاد ماهانه ($)" : language === "ps" ? "میاشتنۍ ګټه ($)" : "Monthly Profit (USD)"}
              </p>
              <p className="text-2xl mt-1" style={{ fontWeight: 700 }}>
                {formatCurrency(shareholder.monthly_profit_usd, "USD")}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8" />
            <div>
              <p className="text-amber-100 text-sm">
                {language === "fa" ? "باقی مفاد (؋)" : language === "ps" ? "پاتې ګټه (؋)" : "Remaining Profit (AFN)"}
              </p>
              <p className="text-2xl mt-1" style={{ fontWeight: 700 }}>
                {formatCurrency(shareholder.remaining_profit_afn, "AFN")}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8" />
            <div>
              <p className="text-orange-100 text-sm">
                {language === "fa" ? "باقی مفاد ($)" : language === "ps" ? "پاتې ګټه ($)" : "Remaining Profit (USD)"}
              </p>
              <p className="text-2xl mt-1" style={{ fontWeight: 700 }}>
                {formatCurrency(shareholder.remaining_profit_usd, "USD")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center gap-3">
            <ArrowDownToLine className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-gray-500 text-sm">
                {language === "fa" ? "کل برداشت (افغانی)" :
                language === "ps" ? "ټول وباسنې (افغانۍ)" :
                "Total Withdrawals (AFN)"}
              </p>
              <p className="text-xl text-red-600" style={{ fontWeight: 600 }}>
                {formatCurrency(totalWithdrawalsAfn, "AFN")}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center gap-3">
            <ArrowDownToLine className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-gray-500 text-sm">
                {language === "fa" ? "کل برداشت (دالر)" :
                language === "ps" ? "ټول وباسنې (ډالر)" :
                "Total Withdrawals (USD)"}
              </p>
              <p className="text-xl text-orange-600" style={{ fontWeight: 600 }}>
                {formatCurrency(totalWithdrawalsUsd, "USD")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Withdrawals History */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-xl text-gray-800 mb-4" style={{ fontWeight: 700 }}>
          {language === "fa" ? "تاریخچه برداشت‌ها" :
          language === "ps" ? "د وباسنو تاریخ" :
          "Withdrawals History"}
        </h2>

        <div className="space-y-3">
          {shareholderWithdrawals.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              {language === "fa" ? "برداشتی ثبت نشده است" :
              language === "ps" ? "وباسنه ثبت شوې نه ده" :
              "No withdrawals recorded"}
            </p>
          ) : (
            shareholderWithdrawals.map((withdrawal, index) => (
              <div key={index} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <ArrowDownToLine className="w-5 h-5 text-red-600" />
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-800" style={{ fontWeight: 600 }}>
                        {language === "fa" ? "برداشت" : language === "ps" ? "وباسنه" : "Withdrawal"}
                      </p>
                      <p className="text-sm text-gray-500">
                        <Calendar className="w-3 h-3 inline ml-1" />
                        {withdrawal.date}
                      </p>
                      {withdrawal.description && (
                        <p className="text-xs text-gray-500 mt-1">{withdrawal.description}</p>
                      )}
                    </div>

                    <div className="text-right">
                      {withdrawal.amount_afn > 0 && (
                        <p className="text-lg text-red-600" style={{ fontWeight: 600 }}>
                          -{formatCurrency(withdrawal.amount_afn, "AFN")}
                        </p>
                      )}
                      {withdrawal.amount_usd > 0 && (
                        <p className="text-lg text-red-600" style={{ fontWeight: 600 }}>
                          -{formatCurrency(withdrawal.amount_usd, "USD")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
