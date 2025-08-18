import { Response } from "express";
export interface ReportData {
  title: string;
  subtitle: string;
  date: string;
  payments: any[];
  expenses: any[];
  summary: {
    totalPayments: number;
    totalExpenses: number;
    netIncome: number;
    paymentCount: number;
    expenseCount: number;
    [key: string]: any;
  };
}
function generateHTML(data: ReportData): string {
  const formatCurrency = (amount: number) =>
    `${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} ج.س`;
  const formatDate = (date: string | Date) =>
    new Date(date).toLocaleDateString("en-US");
  const formatTime = (date: string | Date) =>
    new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.title}</title>
    <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }

                @page { size: A4; margin: 12mm; }

                body {
                    font-family: 'Segoe UI', Tahoma, Arial, 'Noto Kufi Arabic', 'Cairo', sans-serif;
                    line-height: 1.6;
                    color: #111827; /* slate-900 */
                    background: #ffffff;
                    font-size: 11pt;
                    direction: rtl;
                    text-align: right;
                }

                .container { padding: 16px; }

        .header {
          padding-bottom: 12px;
          margin-bottom: 12px;
          border-bottom: 1px solid #e5e7eb; /* gray-200 */
          page-break-after: avoid;
        }
                .header h1 {
                    font-size: 22px;
                    font-weight: 700;
                    color: #111827;
                }
                .header .subtitle { font-size: 12px; color: #6b7280; /* gray-500 */ }
                .header .generated { font-size: 10px; color: #9ca3af; margin-top: 4px; }

        .report-info {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
          padding: 8px 0 12px 0;
          margin-bottom: 12px;
          page-break-after: avoid;
                }
                .report-title { font-size: 14px; font-weight: 600; color: #111827; }
                .report-date { font-size: 12px; color: #374151; }

                .section { margin-bottom: 16px; page-break-inside: auto; break-inside: auto; }
                .section-header {
                    font-size: 12px;
                    font-weight: 600;
                    color: #111827;
                    padding: 8px 0;
                    border-top: 1px solid #e5e7eb;
                    border-bottom: 1px solid #e5e7eb;
                    background: #f9fafb; /* gray-50 */
                }

                .table-container { background: white; border: 1px solid #e5e7eb; }
                table { width: 100%; border-collapse: collapse; font-size: 10pt; }
                th {
                    background: #f9fafb; color: #111827; padding: 8px 8px; text-align: right; font-weight: 600;
                    border-bottom: 1px solid #e5e7eb; font-size: 10pt;
                }
                td { padding: 8px; border-bottom: 1px solid #f3f4f6; color: #111827; }
                tr:nth-child(even) { background: #fff; }

                .amount, .expense-amount { font-weight: 700; color: #111827; }
                .no-data { text-align: center; padding: 24px; color: #6b7280; background: #f9fafb; border: 1px solid #e5e7eb; font-size: 11pt; }

                .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
                .summary-card { background: white; padding: 16px; border: 1px solid #e5e7eb; }
                .summary-card h3 { color: #111827; font-size: 12px; margin-bottom: 12px; font-weight: 600; }
                .summary-item { display: flex; justify-content: space-between; margin-bottom: 8px; }
                .summary-label { color: #374151; font-weight: 400; font-size: 11pt; }
                .summary-value { font-weight: 700; color: #111827; font-size: 11pt; }

                .net-income { margin-top: 18px; padding: 14px; border: 1px solid #e5e7eb; background: #f9fafb; text-align: center; }
                .net-income h3 { color: #111827; margin-bottom: 8px; font-size: 13px; font-weight: 700; }
                .net-income .value { font-size: 20px; font-weight: 800; color: #111827; display: inline-block; min-width: 180px; border: 1px solid #e5e7eb; padding: 8px; background: #fff; }

                .footer { margin-top: 24px; padding-top: 12px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 10pt; color: #6b7280; page-break-inside: avoid; }
                .footer strong { color: #111827; }

                .ltr { direction: ltr; unicode-bidi: bidi-override; }

        @media print {
                    body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .section { page-break-inside: auto; break-inside: auto; }
                    .table-container { border: 1px solid #e5e7eb !important; }
                    .header { border-bottom: 1px solid #e5e7eb !important; }
                }
    </style>
</head>
<body>
        <div class="container">
            <div class="header">
                <h1>الجامعة الوطنية</h1>
                <div class="subtitle">نظام الإدارة المالية</div>
                <div class="generated">تم الإنشاء: ${new Date().toLocaleString(
                  "ar-EG"
                )}</div>
            </div>
    
            <div class="report-info">
                <div class="report-title">${data.title}</div>
                <div class="report-date">${data.subtitle}</div>
            </div>
    
    <!-- Payments Section -->
  <!-- Payments Section -->
  ${
    data.payments.length > 0
      ? `
  <div class="section">
        <div class="section-header">معاملات الدفع (${data.payments.length} سجل)</div>
        <div class="table-container">
      ` +
        `
            <table>
                <thead>
                    <tr>
                        <th>التاريخ</th>
                                                <th>الوقت</th>
                        <th>رقم الإيصال</th>
                        <th>اسم الطالب</th>
                        <th>نوع الرسوم</th>
                        <th>طريقة الدفع</th>
                                                <th>المبلغ</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.payments
                      .map(
                        (payment) => `
                    <tr>
                        <td>${formatDate(payment.paymentDate)}</td>
                        <td>${formatTime(payment.paymentDate)}</td>
                        <td>${payment.receiptNumber || "N/A"}</td>
                        <td>${payment.studentName || "N/A"}</td>
                        <td>${payment.feeType || "N/A"}</td>
                        <td>${payment.paymentMethod || "N/A"}</td>
                                                <td class="amount ltr">${formatCurrency(
                                                  Number(payment.amount)
                                                )}</td>
                    </tr>
                    `
                      )
                      .join("")}
                </tbody>
            </table>
    </div>
  </div>
  `
      : ``
  }
    
    <!-- Expenses Section -->
  <!-- Expenses Section -->
  ${
    data.expenses.length > 0
      ? `
  <div class="section">
        <div class="section-header">معاملات المصروفات (${data.expenses.length} سجل)</div>
        <div class="table-container">
      ` +
        `
            <table>
                <thead>
                    <tr>
                        <th>التاريخ</th>
                        <th>الوقت</th>
                        <th>الفئة</th>
                        <th>المورد</th>
                        <th>الوصف</th>
                                                <th>المبلغ</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.expenses
                      .map(
                        (expense) => `
                    <tr>
                        <td>${formatDate(expense.date)}</td>
                        <td>${formatTime(expense.date)}</td>
                        <td>${expense.category || "N/A"}</td>
                        <td>${expense.vendor || "N/A"}</td>
                        <td>${expense.description || "N/A"}</td>
                                                <td class="expense-amount ltr">${formatCurrency(
                                                  Number(expense.amount)
                                                )}</td>
                    </tr>
                    `
                      )
                      .join("")}
                </tbody>
            </table>
    </div>
  </div>
  `
      : ``
  }
    
    <!-- Summary Section -->
    <div class="summary-grid">
        <div class="summary-card">
                        <h3>تحليل المدفوعات</h3>
            <div class="summary-item">
                <span class="summary-label">إجمالي الإيرادات:</span>
                                <span class="summary-value ltr">${formatCurrency(
                                  data.summary.totalPayments
                                )}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">عدد المعاملات:</span>
                <span class="summary-value">${data.summary.paymentCount}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">متوسط الدفعة:</span>
                                <span class="summary-value ltr">${formatCurrency(
                                  data.summary.paymentCount > 0
                                    ? data.summary.totalPayments /
                                        data.summary.paymentCount
                                    : 0
                                )}</span>
            </div>
        </div>
        
        <div class="summary-card">
            <h3>تحليل المصروفات</h3>
            <div class="summary-item">
                <span class="summary-label">إجمالي المصروفات:</span>
                                <span class="summary-value ltr">${formatCurrency(
                                  data.summary.totalExpenses
                                )}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">عدد المعاملات:</span>
                <span class="summary-value">${data.summary.expenseCount}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">متوسط المصروف:</span>
                                <span class="summary-value ltr">${formatCurrency(
                                  data.summary.expenseCount > 0
                                    ? data.summary.totalExpenses /
                                        data.summary.expenseCount
                                    : 0
                                )}</span>
            </div>
        </div>
    </div>
    
    <div class="net-income">
        <h3>صافي الدخل</h3>
                <div class="value ltr">${formatCurrency(
                  data.summary.netIncome
                )}</div>
    </div>
    
        <div class="footer">
            <p><strong>الجامعة الوطنية - نظام الإدارة المالية</strong></p>
            <p>تم إنشاء هذا التقرير تلقائياً في ${new Date().toLocaleDateString(
              "ar-EG"
            )} في ${new Date().toLocaleTimeString("ar-EG", {
    timeStyle: "short",
  })}</p>
            <p>للاستفسارات حول هذا التقرير، يرجى الاتصال بقسم المالية</p>
        </div>
        </div>
</body>
</html>
`;
}
export async function generatePDF(
  data: ReportData,
  filename: string,
  res: Response
): Promise<void> {
  const puppeteer = require("puppeteer");
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    const html = generateHTML(data);
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      scale: 0.98,
      margin: {
        top: "10mm",
        right: "10mm",
        bottom: "12mm",
        left: "10mm",
      },
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdf.length);
    res.send(pdf);
  } catch (error) {
    console.error("PDF generation error:", error);
    throw new Error(
      `Failed to generate PDF: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
