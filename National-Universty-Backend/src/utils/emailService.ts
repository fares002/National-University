import nodemailer from "nodemailer";

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail", // gmail, outlook, etc.
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD, // Use app password for Gmail
    },
  });
};

// Email templates
const getPasswordResetEmailTemplate = (resetUrl: string, userName: string) => {
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>إعادة تعيين كلمة المرور</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          background-color: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #007bff;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #007bff;
          margin: 0;
          font-size: 24px;
        }
        .content {
          margin-bottom: 30px;
        }
        .button {
          display: inline-block;
          background-color: #007bff;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
          margin: 20px 0;
        }
        .button:hover {
          background-color: #0056b3;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          color: #666;
          font-size: 14px;
        }
        .warning {
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          color: #856404;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>الجامعة الوطنية السودانية</h1>
          <p>نظام الإدارة المالية</p>
        </div>
        
        <div class="content">
          <h2>مرحباً ${userName}</h2>
          <p>لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك.</p>
          
          <p>إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد الإلكتروني.</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">إعادة تعيين كلمة المرور</a>
          </div>
          
          <div class="warning">
            <strong>ملاحظة مهمة:</strong>
            <p>هذا الرابط صالح لمدة 15 دقيقة فقط. بعد انتهاء المدة، ستحتاج إلى طلب رابط جديد.</p>
          </div>
          
          <p>إذا لم يعمل الزر أعلاه، يمكنك نسخ الرابط التالي ولصقه في متصفحك:</p>
          <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px;">
            ${resetUrl}
          </p>
        </div>
        
        <div class="footer">
          <p>هذا البريد الإلكتروني تم إرساله تلقائياً، يرجى عدم الرد عليه.</p>
          <p>© ${new Date().getFullYear()} الجامعة الوطنية السودانية - جميع الحقوق محفوظة</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send password reset email
export const sendPasswordResetEmail = async (
  to: string,
  resetUrl: string,
  userName: string
): Promise<boolean> => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: "إعادة تعيين كلمة المرور - الجامعة الوطنية السودانية",
      html: getPasswordResetEmailTemplate(resetUrl, userName),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("📧 Password reset email sent successfully:", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Error sending password reset email:", error);
    return false;
  }
};

// Test email configuration
export const testEmailConnection = async (): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log("✅ Email service is configured correctly");
    return true;
  } catch (error) {
    console.error("❌ Email service configuration error:", error);
    return false;
  }
};
