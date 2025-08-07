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
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            color: #2c2c2c;
            background: #ffffff;
            font-size: 11pt;
            direction: rtl;
            text-align: right;
        }
        
        .header {
            border-bottom: 3px solid #000;
            padding: 25px 0;
            text-align: center;
            margin-bottom: 35px;
            background: #ffffff;
        }
        
        .header h1 {
            font-size: 28px;
            margin-bottom: 8px;
            font-weight: bold;
            color: #000;
            letter-spacing: 2px;
            text-transform: uppercase;
        }
        
        .header .subtitle {
            font-size: 16px;
            margin-bottom: 15px;
            color: #444;
            font-style: italic;
            font-weight: normal;
        }
        
        .header .generated {
            font-size: 11px;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 10px;
            margin-top: 15px;
        }
        
        .report-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 35px;
            padding: 20px 0;
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
        }
        
        .report-title {
            font-size: 18px;
            font-weight: bold;
            color: #000;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .report-date {
            font-size: 14px;
            color: #444;
            font-style: italic;
        }
        
        .section {
            margin-bottom: 35px;
            page-break-inside: avoid;
        }
        
        .section-header {
            background: #000;
            color: white;
            padding: 15px 20px;
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 0;
            border: none;
        }
        
        .table-container {
            background: white;
            border: 2px solid #000;
            border-top: none;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10pt;
            font-family: 'Times New Roman', serif;
        }
        
        th {
            background: #f5f5f5;
            color: #000;
            padding: 12px 10px;
            text-align: right;
            font-weight: bold;
            border-bottom: 2px solid #000;
            border-right: 1px solid #ccc;
            text-transform: uppercase;
            font-size: 9pt;
            letter-spacing: 0.5px;
        }
        
        th:last-child {
            border-right: none;
        }
        
        th.text-right, td.text-right {
            text-align: left;
        }
        
        td {
            padding: 10px;
            border-bottom: 1px solid #ddd;
            border-right: 1px solid #eee;
            color: #333;
        }
        
        td:last-child {
            border-right: none;
        }
        
        tr:nth-child(even) {
            background: #fafafa;
        }
        
        .amount {
            font-weight: bold;
            color: #000;
            font-family: 'Courier New', monospace;
        }
        
        .expense-amount {
            font-weight: bold;
            color: #000;
            font-family: 'Courier New', monospace;
        }
        
        .no-data {
            text-align: center;
            padding: 50px;
            color: #666;
            font-style: italic;
            background: #f9f9f9;
            border: 1px solid #ddd;
            font-size: 12pt;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 25px;
            margin-top: 35px;
        }
        
        .summary-card {
            background: white;
            padding: 25px;
            border: 2px solid #000;
        }
        
        .summary-card h3 {
            color: #000;
            font-size: 14px;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: bold;
        }
        
        .summary-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            padding: 8px 0;
            border-bottom: 1px dotted #ccc;
        }
        
        .summary-item:last-child {
            border-bottom: none;
        }
        
        .summary-label {
            color: #444;
            font-weight: normal;
            font-size: 11pt;
        }
        
        .summary-value {
            font-weight: bold;
            color: #000;
            font-family: 'Courier New', monospace;
            font-size: 11pt;
        }
        
        .summary-value.positive {
            color: #000;
        }
        
        .summary-value.negative {
            color: #000;
        }
        
        .net-income {
            background: #f9f9f9;
            padding: 25px;
            border: 3px solid #000;
            margin-top: 30px;
            text-align: center;
        }
        
        .net-income h3 {
            color: #000;
            margin-bottom: 15px;
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 2px;
            font-weight: bold;
        }
        
        .net-income .value {
            font-size: 24px;
            font-weight: bold;
            color: #000;
            font-family: 'Courier New', monospace;
            border: 2px solid #000;
            padding: 10px;
            display: inline-block;
            min-width: 200px;
        }
        
        .footer {
            margin-top: 50px;
            padding: 25px 0;
            text-align: center;
            border-top: 2px solid #000;
            font-size: 10pt;
            color: #666;
            page-break-inside: avoid;
        }
        
        .footer p {
            margin-bottom: 5px;
        }
        
        .footer strong {
            color: #000;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        @media print {
            body { 
                margin: 0;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .section { 
                page-break-inside: avoid;
                break-inside: avoid;
            }
            .table-container { 
                border: 2px solid #000 !important;
            }
            .header {
                border-bottom: 3px solid #000 !important;
            }
        }
    </style>
</head>
<body>
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
    <div class="section">
        <div class="section-header">
            معاملات الدفع (${data.payments.length} سجل)
        </div>
        <div class="table-container">
            ${
                data.payments.length > 0
                ? `
            <table>
                <thead>
                    <tr>
                        <th>التاريخ</th>
                        <th >الوقت</th>
                        <th>رقم الإيصال</th>
                        <th>اسم الطالب</th>
                        <th>نوع الرسوم</th>
                        <th>طريقة الدفع</th>
                        <th class="text-right">المبلغ</th>
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
                        <td class="text-right amount">${formatCurrency(
                            Number(payment.amount)
                        )}</td>
                    </tr>
                    `
                        )
                        .join("")}
                </tbody>
            </table>
            `
                : `
            <div class="no-data">لم يتم العثور على معاملات دفع لهذه الفترة</div>
            `
            }
        </div>
    </div>
    
    <!-- Expenses Section -->
    <div class="section">
        <div class="section-header">
            معاملات المصروفات (${data.expenses.length} سجل)
        </div>
        <div class="table-container">
            ${
                data.expenses.length > 0
                ? `
            <table>
                <thead>
                    <tr>
                        <th>التاريخ</th>
                        <th>الوقت</th>
                        <th>الفئة</th>
                        <th>المورد</th>
                        <th>الوصف</th>
                        <th class="text-right">المبلغ</th>
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
                        <td class="text-right expense-amount">${formatCurrency(
                            Number(expense.amount)
                        )}</td>
                    </tr>
                    `
                        )
                        .join("")}
                </tbody>
            </table>
            `
                : `
            <div class="no-data">لم يتم العثور على معاملات مصروفات لهذه الفترة</div>
            `
            }
        </div>
    </div>
    
    <!-- Summary Section -->
    <div class="summary-grid">
        <div class="summary-card">
            <h3>تحليل المدفوعات</h3>
            <div class="summary-item">
                <span class="summary-label">إجمالي الإيرادات:</span>
                <span class="summary-value positive">${formatCurrency(
                    data.summary.totalPayments
                )}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">عدد المعاملات:</span>
                <span class="summary-value">${
                    data.summary.paymentCount
                }</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">متوسط الدفعة:</span>
                <span class="summary-value">${formatCurrency(
                    data.summary.paymentCount > 0
                    ? data.summary.totalPayments / data.summary.paymentCount
                    : 0
                )}</span>
            </div>
        </div>
        
        <div class="summary-card">
            <h3>تحليل المصروفات</h3>
            <div class="summary-item">
                <span class="summary-label">إجمالي المصروفات:</span>
                <span class="summary-value negative">${formatCurrency(
                    data.summary.totalExpenses
                )}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">عدد المعاملات:</span>
                <span class="summary-value">${
                    data.summary.expenseCount
                }</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">متوسط المصروف:</span>
                <span class="summary-value">${formatCurrency(
                    data.summary.expenseCount > 0
                    ? data.summary.totalExpenses / data.summary.expenseCount
                    : 0
                )}</span>
            </div>
        </div>
    </div>
    
    <div class="net-income">
        <h3>صافي الدخل</h3>
        <div class="value ${
            data.summary.netIncome >= 0 ? "positive" : "negative"
        }">
            ${formatCurrency(data.summary.netIncome)}
        </div>
    </div>
    
    <div class="footer">
        <p><strong>الجامعة الوطنية - نظام الإدارة المالية</strong></p>
        <p>تم إنشاء هذا التقرير تلقائياً في ${new Date().toLocaleDateString(
            "ar-EG"
        )} في ${new Date().toLocaleTimeString("ar-EG",{timeStyle: "short"})}</p>
        <p>للاستفسارات حول هذا التقرير، يرجى الاتصال بقسم المالية</p>
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
    margin: {
        top: "20px",
        right: "20px",
        bottom: "20px",
        left: "20px",
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