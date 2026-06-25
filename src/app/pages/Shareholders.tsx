import { useState } from "react";
import { useApp, formatCurrency, ShareHolder } from "../store/AppContext";
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
import { Plus, Trash2, Edit, Eye } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export default function Shareholders() {
  const navigate = useNavigate();
  const {
    shareholders,
    addShareHolder,
    updateShareHolder,
    deleteShareHolder,
    language,
  } = useApp();

  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentShareholder, setCurrentShareholder] = useState<ShareHolder | null>(null);

  const [name, setName] = useState("");
  const [investmentAfn, setInvestmentAfn] = useState("");
  const [investmentUsd, setInvestmentUsd] = useState("");
  const [sharePercentage, setSharePercentage] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [monthlyProfitAfn, setMonthlyProfitAfn] = useState("");
  const [monthlyProfitUsd, setMonthlyProfitUsd] = useState("");
  const [remainingProfitAfn, setRemainingProfitAfn] = useState("");
  const [remainingProfitUsd, setRemainingProfitUsd] = useState("");

  const resetForm = () => {
    setName("");
    setInvestmentAfn("");
    setInvestmentUsd("");
    setSharePercentage("");
    setPhone("");
    setAddress("");
    setMonthlyProfitAfn("");
    setMonthlyProfitUsd("");
    setRemainingProfitAfn("");
    setRemainingProfitUsd("");
    setEditMode(false);
    setCurrentShareholder(null);
  };

  const handleAdd = () => {
    if (!name.trim()) {
      toast.error(language === "fa" ? "نام الزامی است" : "Name is required");
      return;
    }

    const afn = parseFloat(investmentAfn) || 0;
    const usd = parseFloat(investmentUsd) || 0;
    const percentage = parseFloat(sharePercentage) || 0;
    const mpAfn = parseFloat(monthlyProfitAfn) || 0;
    const mpUsd = parseFloat(monthlyProfitUsd) || 0;
    const rpAfn = parseFloat(remainingProfitAfn) || 0;
    const rpUsd = parseFloat(remainingProfitUsd) || 0;

    if (percentage <= 0 || percentage > 100) {
      toast.error(
        language === "fa" ? "فیصدی سهام باید بین ۱ تا ۱۰۰ باشد" :
        language === "ps" ? "د ونډې سلنه باید د ۱ څخه تر ۱۰۰ پورې وي" :
        "Share percentage must be between 1 and 100"
      );
      return;
    }

    if (editMode && currentShareholder) {
      updateShareHolder({
        ...currentShareholder,
        name,
        investment_amount_afn: afn,
        investment_amount_usd: usd,
        share_percentage: percentage,
        phone,
        address,
        monthly_profit_afn: mpAfn,
        monthly_profit_usd: mpUsd,
        remaining_profit_afn: rpAfn,
        remaining_profit_usd: rpUsd,
      });
      toast.success(
        language === "fa" ? "سهام‌دار بروزرسانی شد" :
        language === "ps" ? "ونډه لرونکی تازه شو" :
        "Shareholder updated"
      );
    } else {
      addShareHolder({
        name,
        investment_amount_afn: afn,
        investment_amount_usd: usd,
        share_percentage: percentage,
        phone,
        address,
        monthly_profit_afn: mpAfn,
        monthly_profit_usd: mpUsd,
        remaining_profit_afn: rpAfn,
        remaining_profit_usd: rpUsd,
      });
      toast.success(
        language === "fa" ? "سهام‌دار اضافه شد" :
        language === "ps" ? "ونډه لرونکی اضافه شو" :
        "Shareholder added"
      );
    }

    setOpen(false);
    resetForm();
  };

  const handleEdit = (sh: ShareHolder) => {
    setCurrentShareholder(sh);
    setName(sh.name);
    setInvestmentAfn(sh.investment_amount_afn.toString());
    setInvestmentUsd(sh.investment_amount_usd.toString());
    setSharePercentage(sh.share_percentage.toString());
    setPhone(sh.phone);
    setAddress(sh.address);
    setMonthlyProfitAfn(sh.monthly_profit_afn.toString());
    setMonthlyProfitUsd(sh.monthly_profit_usd.toString());
    setRemainingProfitAfn(sh.remaining_profit_afn.toString());
    setRemainingProfitUsd(sh.remaining_profit_usd.toString());
    setEditMode(true);
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(language === "fa" ? "آیا مطمئن هستید؟" : language === "ps" ? "ایا تاسو ډاډه یاست؟" : "Are you sure?")) {
      deleteShareHolder(id);
      toast.success(
        language === "fa" ? "سهام‌دار حذف شد" :
        language === "ps" ? "ونډه لرونکی حذف شو" :
        "Shareholder deleted"
      );
    }
  };

  // Totals were calculated previously but are unused; removed to silence TS warnings


  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-500 hover:bg-blue-600">
              <Plus className="w-4 h-4 ml-2" />
              {language === "fa" ? "افزودن سهام‌دار" : language === "ps" ? "ونډه لرونکی اضافه کول" : "Add Shareholder"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" dir={language === "fa" ? "rtl" : "ltr"} aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>
                {editMode
                  ? (language === "fa" ? "ویرایش سهام‌دار" : language === "ps" ? "ونډه لرونکي سمول" : "Edit Shareholder")
                  : (language === "fa" ? "افزودن سهام‌دار جدید" : language === "ps" ? "نوی ونډه لرونکی اضافه کول" : "Add New Shareholder")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{language === "fa" ? "نام سهام‌دار" : language === "ps" ? "د ونډه لرونکي نوم" : "Shareholder Name"}</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={language === "fa" ? "نام را وارد کنید" : language === "ps" ? "نوم دننه کړئ" : "Enter name"}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{language === "fa" ? "سرمایه (افغانی)" : language === "ps" ? "پانګه (افغانۍ)" : "Investment (AFN)"}</Label>
                  <Input
                    type="number"
                    value={investmentAfn}
                    onChange={(e) => setInvestmentAfn(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>{language === "fa" ? "سرمایه (دالر)" : language === "ps" ? "پانګه (ډالر)" : "Investment (USD)"}</Label>
                  <Input
                    type="number"
                    value={investmentUsd}
                    onChange={(e) => setInvestmentUsd(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <Label>{language === "fa" ? "فیصدی سهام (%)" : language === "ps" ? "د ونډې سلنه (%)" : "Share Percentage (%)"}</Label>
                <Input
                  type="number"
                  value={sharePercentage}
                  onChange={(e) => setSharePercentage(e.target.value)}
                  placeholder="0"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <Label>{language === "fa" ? "شماره تماس" : language === "ps" ? "د اړیکې شمیره" : "Phone"}</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={language === "fa" ? "شماره تماس" : language === "ps" ? "د اړیکې شمیره" : "Phone number"}
                />
              </div>
              <div>
                <Label>{language === "fa" ? "آدرس" : language === "ps" ? "پته" : "Address"}</Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={language === "fa" ? "آدرس" : language === "ps" ? "پته" : "Address"}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  
                  
                </div>
                <div>
                  
                  
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  
                  
                </div>
                <div>
                  
                  
                </div>
              </div>
              <Button onClick={handleAdd} className="w-full">
                {editMode
                  ? (language === "fa" ? "بروزرسانی" : language === "ps" ? "تازه کول" : "Update")
                  : (language === "fa" ? "افزودن" : language === "ps" ? "اضافه کول" : "Add")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">{language === "fa" ? "نام" : language === "ps" ? "نوم" : "Name"}</TableHead>
              <TableHead className="text-right">{language === "fa" ? "سرمایه (افغانی)" : language === "ps" ? "پانګه (افغانۍ)" : "Investment (AFN)"}</TableHead>
              <TableHead className="text-right">{language === "fa" ? "سرمایه (دالر)" : language === "ps" ? "پانګه (ډالر)" : "Investment (USD)"}</TableHead>
              <TableHead className="text-right">{language === "fa" ? "فیصدی سهام" : language === "ps" ? "د ونډې سلنه" : "Share %"}</TableHead>
              <TableHead className="text-right">{language === "fa" ? "تماس" : language === "ps" ? "اړیکه" : "Phone"}</TableHead>
              <TableHead className="text-right">{language === "fa" ? "عملیات" : language === "ps" ? "عملیات" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shareholders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                  {language === "fa" ? "سهام‌داری ثبت نشده است" : language === "ps" ? "ونډه لرونکی ثبت شوی نه دی" : "No shareholders added"}
                </TableCell>
              </TableRow>
            ) : (
              shareholders.map((sh) => (
                <TableRow key={sh.shareholder_id}>
                  <TableCell className="font-medium">{sh.name}</TableCell>
                  <TableCell>{formatCurrency(sh.investment_amount_afn, "AFN")}</TableCell>
                  <TableCell>{formatCurrency(sh.investment_amount_usd, "USD")}</TableCell>
                  <TableCell>
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-sm font-medium">
                      {sh.share_percentage}%
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-600">{sh.phone || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/shareholder-profile/${sh.shareholder_id}`)}
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(sh)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(sh.shareholder_id)}
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
    </div>
  );
}
