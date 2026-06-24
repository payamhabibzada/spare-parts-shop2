import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportToExcel = (data: any[], filename: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportToPDF = (
  columns: string[],
  rows: any[][],
  filename: string,
  title: string
) => {
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(16);
  doc.text(title, 14, 15);

  // Add table
  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: 25,
    styles: {
      font: "helvetica",
      fontSize: 10,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
    },
  });

  doc.save(`${filename}.pdf`);
};

// Thermal printer receipt (58mm width)
export const printThermalReceipt = (
  customerName: string,
  customerPhone: string,
  items: { name: string; quantity: number; price: number; total: number }[],
  subtotal: number,
  discount: number,
  total: number,
  currency: string
) => {
  const currencySymbol = currency === "AFN" ? "؋" : "$";

  // Create print content
  let content = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: 58mm auto;
      margin: 0;
    }
    body {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      margin: 0;
      padding: 5mm;
      width: 48mm;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .line { border-top: 1px dashed #000; margin: 5px 0; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 2px 0; }
    .right { text-align: right; }
  </style>
</head>
<body>
  <div class="center bold" style="font-size: 14px;">سیستم دوکانداری</div>
  <div class="center" style="font-size: 10px;">فاکتور فروش</div>
  <div class="line"></div>

  <table>
    <tr><td>مشتری:</td><td class="right bold">${customerName}</td></tr>
    <tr><td>تماس:</td><td class="right">${customerPhone}</td></tr>
    <tr><td>تاریخ:</td><td class="right">${new Date().toLocaleDateString("fa-AF")}</td></tr>
  </table>

  <div class="line"></div>

  <table>
    <tr>
      <td class="bold">جنس</td>
      <td class="bold center">تعداد</td>
      <td class="bold right">قیمت</td>
      <td class="bold right">مجموع</td>
    </tr>
`;

  items.forEach((item) => {
    content += `
    <tr>
      <td colspan="4">${item.name}</td>
    </tr>
    <tr>
      <td></td>
      <td class="center">${item.quantity}</td>
      <td class="right">${item.price.toLocaleString()}</td>
      <td class="right bold">${item.total.toLocaleString()} ${currencySymbol}</td>
    </tr>
`;
  });

  content += `
  </table>

  <div class="line"></div>

  <table>
    <tr><td>مجموع:</td><td class="right bold">${subtotal.toLocaleString()} ${currencySymbol}</td></tr>
    ${discount > 0 ? `<tr><td>تخفیف:</td><td class="right">-${discount.toLocaleString()} ${currencySymbol}</td></tr>` : ""}
    <tr style="font-size: 14px;"><td class="bold">کل:</td><td class="right bold">${total.toLocaleString()} ${currencySymbol}</td></tr>
  </table>

  <div class="line"></div>
  <div class="center" style="font-size: 10px; margin-top: 10px;">
    از خرید شما متشکریم!
  </div>
</body>
</html>
`;

  // Open print dialog
  const printWindow = window.open("", "", "width=300,height=600");
  if (printWindow) {
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};
