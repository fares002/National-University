import { Response } from "express";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const QRCode = require("qrcode");

export interface PaymentForReceipt {
  id: string;
  studentId: string;
  studentName: string;
  feeType: string;
  amount: number;
  receiptNumber: string;
  paymentMethod: string;
  paymentDate: string | Date;
  createdBy?: { username?: string } | null;
}

function formatCurrency(amount: number) {
  return `${amount.toLocaleString("en-US", { minimumFractionDigits: 0 })} ج.م`;
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("ar-EG");
}

function formatTime(date: string | Date) {
  return new Date(date).toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Arabic translations for fee types
function translateFeeType(feeType: string): string {
  const translations: Record<string, string> = {
    NEW_YEAR: "رسوم سنة جديدة",
    SUPPLEMENTARY: "رسوم ملحق",
    TRAINING: "رسوم تدريب",
    STUDENT_SERVICES: "رسوم خدمات طلابية",
    EXAM: "رسوم امتحان",
    OTHER: "أخرى",
  };
  return translations[feeType] || feeType;
}

// Arabic translations for payment methods
function translatePaymentMethod(paymentMethod: string): string {
  const translations: Record<string, string> = {
    CASH: "نقداً",
    TRANSFER: "تحويل",
    CHEQUE: "شيك",
  };
  return translations[paymentMethod] || paymentMethod;
}

function receiptHTML(payment: PaymentForReceipt, qrDataUrl: string) {
  return `<!DOCTYPE html>
  <html lang="ar" dir="rtl">
    <head>
      <meta charset="utf-8" />
      <title>إيصال دفع - ${payment.receiptNumber}</title>
      <style>
        @page { size: A6; margin: 6mm; }
        * { box-sizing: border-box; }
        body { font-family: FreeSerif, serif; color: #111827; }
        .wrap { border: 1px dashed #d1d5db; padding: 10px; }
        .header { text-align: center; margin-bottom: 8px; }
        .title { font-size: 14px; font-weight: 800; }
        .subtitle { font-size: 11px; color: #6b7280; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px; font-size: 11px; }
        .row { display: contents; }
        .label { color: #374151; }
        .val { font-weight: 700; }
        .amount { text-align: center; margin: 8px 0; padding: 6px; border: 1px solid #e5e7eb; background: #f9fafb; font-size: 13px; font-weight: 800; }
        .footer { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
        .qr { width: 84px; height: 84px; }
        .note { font-size: 10px; color: #6b7280; text-align: center; margin-top: 6px; }
      </style>
    </head>
    <body>
      <div class="wrap">
        <div class="header">
          <div class="title">الجامعة الوطنية</div>
          <div class="subtitle">نظام الإدارة المالية</div>
        </div>

        <div class="grid">
          <div class="row"><div class="label">رقم الإيصال:</div><div class="val">${
            payment.receiptNumber
          }</div></div>
          <div class="row"><div class="label">التاريخ:</div><div class="val">${formatDate(
            payment.paymentDate
          )} ${formatTime(payment.paymentDate)}</div></div>
          <div class="row"><div class="label">اسم الطالب:</div><div class="val">${
            payment.studentName
          }</div></div>
          <div class="row"><div class="label">الرقم الجامعي:</div><div class="val">${
            payment.studentId
          }</div></div>
          <div class="row"><div class="label">نوع الرسوم:</div><div class="val">${translateFeeType(
            payment.feeType
          )}</div></div>
          <div class="row"><div class="label">طريقة الدفع:</div><div class="val">${translatePaymentMethod(
            payment.paymentMethod
          )}</div></div>
        </div>

        <div class="amount">المبلغ: ${formatCurrency(
          Number(payment.amount)
        )}</div>

        <div class="footer">
          <div>
            <div class="label">الموظف:</div>
            <div class="val">${payment.createdBy?.username || "-"}</div>
          </div>
          <img class="qr" src="${qrDataUrl}" alt="QR" />
        </div>

        <div class="note">إيصال إلكتروني - صالح للاستخدام الداخلي</div>
      </div>
    </body>
  </html>`;
}

export async function generatePaymentReceiptPDF(
  payment: PaymentForReceipt,
  res: Response
) {
  const puppeteer = require("puppeteer");
  let browser: any;
  try {
    // Create QR code with URL to receipt verification page
    const verificationUrl = `${
      process.env.FRONTEND_URL || "http://localhost:5173"
    }/verify-receipt/${payment.receiptNumber}`;
    const qrPayload = JSON.stringify({
      url: verificationUrl,
      r: payment.receiptNumber,
      s: payment.studentId,
      n: payment.studentName,
      a: payment.amount,
      d: payment.paymentDate,
      m: payment.paymentMethod,
    });
    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      margin: 1,
      width: 256,
    });

    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(receiptHTML(payment, qrDataUrl), {
      waitUntil: "networkidle0",
    });
    const pdf = await page.pdf({
      format: "A6",
      printBackground: true,
      margin: { top: "6mm", right: "6mm", bottom: "6mm", left: "6mm" },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="receipt-${payment.receiptNumber}.pdf"`
    );
    res.setHeader("Content-Length", pdf.length);
    res.send(pdf);
  } finally {
    if (browser) await browser.close();
  }
}
