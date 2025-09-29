import { Response } from "express";

export interface HorizontalMonthlySection {
  columns: string[]; // keys
  columnLabels: Record<string, string>; // key -> displayed label
  matrix: number[][]; // days x columns amounts in local currency
}

export interface HorizontalMonthlyData {
  title: string; // Arabic title
  subtitle: string; // e.g., September 2025
  monthYear: string; // YYYY-MM
  currencyLabel?: string; // default: "USD"
  payments?: HorizontalMonthlySection;
  expenses?: HorizontalMonthlySection;
}

// Arabic translations for fee types (redeclared here to avoid cross-file coupling)
function translateFeeType(key: string): string {
  const map: Record<string, string> = {
    NEW_YEAR: "رسوم سنة جديدة",
    SUPPLEMENTARY: "رسوم ملحق",
    TRAINING: "رسوم تدريب",
    STUDENT_SERVICES: "رسوم خدمات طلابية",
    EXAM: "رسوم امتحان",
    OTHER: "أخرى",
  };
  return map[key] ?? key;
}

// Default pretty label generator for payments/expenses columns
function defaultLabel(kind: "payments" | "expenses", key: string): string {
  if (kind === "payments") return translateFeeType(key);
  return translateExpenseCategory(key);
}

// Arabic translations for expense categories
function translateExpenseCategory(category: string): string {
  const translations: Record<string, string> = {
    "Fixed Assets": "أصول ثابتة",
    "Part-time Professors": "الأساتذه المتعاونون",
    "Rent of study and administrative premises": "ايجار مقرات الدراسه والادارة",
    Salaries: "رواتب",
    "Student Fees Refund": "استرداد رسوم الطلاب",
    Advances: "سلف",
    Bonuses: "مكافآت",
    "General & Administrative Expenses": "مصاريف عامة وإدارية",
    "General and Administrative Expenses": "مصاريف عامة وإدارية",
    "Library Supplies": "مستلزمات المكتبة",
    "Lab Consumables": "مستهلكات المعامل",
    "Student Training": "تدريب الطلاب",
    "Saudi-Egyptian Company": "شركة سعودية-مصرية",
    other: "آخرى",
  };
  return translations[category] || category;
}

function buildHTML(data: HorizontalMonthlyData): string {
  const currency = data.currencyLabel ?? "USD";
  // Extract month number from YYYY-MM (default to 1 if parsing fails)
  let monthNumber = 1;
  if (data.monthYear) {
    const parts = data.monthYear.split("-");
    if (parts.length >= 2) {
      const m = parseInt(parts[1], 10);
      if (!isNaN(m) && m >= 1 && m <= 12) monthNumber = m;
    }
  }

  const renderTable = (
    title: string,
    section?: HorizontalMonthlySection,
    kind?: "payments" | "expenses"
  ) => {
    if (!section || section.columns.length === 0) {
      return "";
    }

    const cols = section.columns;
    const labels = section.columnLabels;
    const mat = section.matrix;

    // compute totals
    const rowTotals = mat.map((row) => row.reduce((a, b) => a + (b || 0), 0));
    const colTotals = cols.map((_, ci) =>
      mat.reduce((acc, row) => acc + (row[ci] || 0), 0)
    );
    const grandTotal = colTotals.reduce((a, b) => a + b, 0);

    const fmt = (n: number) =>
      `${Number(n || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
      })} ${currency}`;

    const groupTitle = kind === "payments" ? "أنواع الرسوم" : "فئات المصروفات";
    const thead = `
      <thead>
        <tr class="subhead">
          <th class="sticky-left">اليوم</th>
          <th class="group-header" colspan="${cols.length}">${groupTitle}</th>
          <th>الإجمالي اليومي</th>
        </tr>
        <tr>
          <th class="sticky-left">اليوم</th>
          ${cols
            .map(
              (c) =>
                `<th>${labels[c] ?? defaultLabel(kind ?? "payments", c)}</th>`
            )
            .join("")}
          <th>الإجمالي اليومي</th>
        </tr>
      </thead>`;

    const tbody = `
      <tbody>
        ${mat
          .map((row, ri) => {
            const day = ri + 1;
            const dateLabel = `${monthNumber}/${day}`;
            return `
              <tr>
                <td class="sticky-left">${dateLabel}</td>
                ${row
                  .map((v) => `<td class="num">${v ? fmt(v) : "-"}</td>`)
                  .join("")}
                <td class="num strong">${fmt(rowTotals[ri])}</td>
              </tr>`;
          })
          .join("")}
      </tbody>`;

    const tfoot = `
      <tfoot>
        <tr>
          <th class="sticky-left">الإجمالي</th>
          ${colTotals.map((v) => `<th class="num">${fmt(v)}</th>`).join("")}
          <th class="num strong">${fmt(grandTotal)}</th>
        </tr>
      </tfoot>`;

    return `
      <div class="section">
        <div class="section-header">${title}</div>
        <div class="table-wrapper">
          <table>
            ${thead}
            ${tbody}
            ${tfoot}
          </table>
        </div>
      </div>`;
  };

  const maxCols = Math.max(
    data.payments?.columns.length || 0,
    data.expenses?.columns.length || 0
  );
  const densityClass =
    maxCols > 14 ? "very-narrow" : maxCols > 10 ? "narrow" : "";

  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${data.title}</title>
    <style>
      * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Arial, 'Noto Kufi Arabic', 'Cairo', sans-serif; color: #111827; margin: 0; background: #f5f7fa; }
  .container { padding: 24px; background: #ffffff; margin: 0 auto; max-width: 100%; }
      .header { border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 12px; }
      .header h1 { margin: 0 0 6px; font-size: 20px; }
      .subtitle { color: #6b7280; font-size: 12px; }
      .meta { color: #9ca3af; font-size: 10px; margin-top: 4px; }

      .section { margin: 16px 0 18px; }
      .section-header { font-weight: 700; background: #f9fafb; border: 1px solid #e5e7eb; padding: 12px; margin-bottom: 10px; }

      .table-wrapper { overflow: hidden; border: 1px solid #d1d5db; border-radius: 6px; padding: 8px; background: #fff; }
      table { width: 100%; border-collapse: collapse; font-size: 9.8pt; table-layout: fixed; }
      thead th, tfoot th { background: #e9eff7; border: 1px solid #cbd5e1; padding: 8px; text-align: center; word-break: break-word; }
      thead tr.subhead th { background: #eef2f7; font-weight: 800; }
      thead th.group-header { text-align: center; font-weight: 700; }
      tbody td { border: 1px solid #e5e7eb; padding: 8px; text-align: center; word-break: break-word; background: #fff; }
      tbody tr:nth-child(even) { background: #fafafa; }
      tfoot th { background: #f1f5f9; font-weight: 800; }
      .num { font-family: 'Segoe UI', Tahoma, Arial; direction: ltr; unicode-bidi: bidi-override; text-align: right; padding-inline-end: 10px; font-variant-numeric: tabular-nums; }
      .strong { font-weight: 700; }
      th.sticky-left, td.sticky-left { position: sticky; right: 0; background: #fff; z-index: 1; box-shadow: -1px 0 0 #e5e7eb inset; min-width: 80px; border-left: 1px solid #e5e7eb; }
      thead th.sticky-left, tfoot th.sticky-left { z-index: 2; }
      /* In print/PDF, disable sticky to avoid layout shift to the left */
      @media print {
        th.sticky-left, td.sticky-left { position: static; box-shadow: none; }
      }

      /* Dense layouts for many columns */
      body:not(.narrow):not(.very-narrow) th:not(.sticky-left),
      body:not(.narrow):not(.very-narrow) td:not(.sticky-left) { min-width: 92px; }
      body.narrow thead th, body.narrow tfoot th { padding: 6px; font-size: 8.8pt; }
      body.narrow tbody td { padding: 6px; font-size: 8.8pt; }
      body.narrow th:not(.sticky-left), body.narrow td:not(.sticky-left) { min-width: 78px; }
      body.very-narrow thead th, body.very-narrow tfoot th { padding: 4px; font-size: 8pt; }
      body.very-narrow tbody td { padding: 4px; font-size: 8pt; }
      body.very-narrow th:not(.sticky-left), body.very-narrow td:not(.sticky-left) { min-width: 64px; }
    </style>
  </head>
  <body class="${densityClass}">
    <div class="container">
      <div class="header">
        <h1>الجامعة الوطنية - التقرير الشهري الأفقي</h1>
        <div class="subtitle">${data.title} — ${data.subtitle}</div>
        <div class="meta">تم الإنشاء: ${new Date().toLocaleString(
          "ar-EG"
        )}</div>
      </div>

      ${renderTable(
        "مدفوعات الشهر حسب الأيام وأنواع الرسوم",
        data.payments,
        "payments"
      )}
      ${renderTable(
        "مصروفات الشهر حسب الأيام والفئات",
        data.expenses,
        "expenses"
      )}
    </div>
  </body>
</html>
`;
}

export async function generateHorizontalMonthlyPDF(
  data: HorizontalMonthlyData,
  filename: string,
  res: Response
): Promise<void> {
  const puppeteer = require("puppeteer");
  let browser: any;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    const html = buildHTML(data);
    await page.setContent(html, { waitUntil: "networkidle0" });

    // Determine paper size based on number of columns
    const maxCols = Math.max(
      data.payments?.columns.length || 0,
      data.expenses?.columns.length || 0
    );
    const useA3 = maxCols > 14; // if too many columns, go A3

    const pdf = await page.pdf({
      format: useA3 ? "A3" : "A4",
      landscape: true,
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "12mm", right: "12mm", bottom: "14mm", left: "12mm" },
      timeout: 60000,
      scale: useA3 ? 0.96 : 0.95,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdf.length);
    res.send(pdf);
  } catch (error) {
    console.error("Horizontal monthly PDF generation error:", error);
    throw new Error(
      `Failed to generate horizontal monthly PDF: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  } finally {
    if (browser) await browser.close();
  }
}
