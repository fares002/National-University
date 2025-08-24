import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, AlertCircle, Printer } from "lucide-react";
import Loading from "@/components/common/Loading";
import { paymentService } from "@/services/paymentService";

interface ReceiptData {
  receiptNumber: string;
  studentId: string;
  studentName: string;
  feeType: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  employee?: string;
  verified: boolean;
}

// Arabic translations for fee types
const translateFeeType = (feeType: string): string => {
  const translations: Record<string, string> = {
    NEW_YEAR: "رسوم سنة جديدة",
    SUPPLEMENTARY: "رسوم ملحق",
    LAB: "رسوم مختبر",
    STUDENT_SERVICES: "رسوم خدمات طلابية",
    OTHER: "أخرى",
    EXAM: "رسوم امتحان",
    TRAINING: "رسوم تدريب",
    TRINING: "رسوم تدريب", // Handle typo in backend
  };
  return translations[feeType] || feeType;
};

// Arabic translations for payment methods
const translatePaymentMethod = (paymentMethod: string): string => {
  const translations: Record<string, string> = {
    CASH: "نقداً",
    TRANSFER: "تحويل",
    CHEQUE: "شيك",
  };
  return translations[paymentMethod] || paymentMethod;
};

const ReceiptVerification = () => {
  const { receiptNumber } = useParams<{ receiptNumber: string }>();
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (receiptNumber) {
      verifyReceipt(receiptNumber);
    }
  }, [receiptNumber]);

  const verifyReceipt = async (receiptNum: string) => {
    try {
      setLoading(true);

      // Use the existing payment service method
      const response = await paymentService.getPaymentByReceipt(receiptNum);
      const payment = response.data.payment;

      // Transform the backend data to match our frontend interface
      const receiptData: ReceiptData = {
        receiptNumber: payment.receiptNumber,
        studentId: payment.studentId,
        studentName: payment.studentName,
        feeType: translateFeeType(payment.feeType),
        amount: payment.amount,
        paymentMethod: translatePaymentMethod(payment.paymentMethod),
        paymentDate: new Date(payment.paymentDate).toLocaleDateString("ar-EG"),
        employee: payment.createdBy?.username,
        verified: true,
      };

      setReceiptData(receiptData);
    } catch (err: any) {
      console.error("Receipt verification error:", err);

      if (err.status === "fail" && err.message?.includes("not found")) {
        setError("لم يتم العثور على الإيصال المطلوب");
      } else if (err.status === "fail") {
        setError(err.message || "حدث خطأ أثناء التحقق من الإيصال");
      } else {
        setError("حدث خطأ أثناء التحقق من الإيصال");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              خطأ في التحقق
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!receiptData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-yellow-600 mb-2">
              إيصال غير موجود
            </h2>
            <p className="text-gray-600 mb-4">
              لم يتم العثور على الإيصال المطلوب
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          body {
            background: white !important;
          }
          .receipt-card {
            box-shadow: none !important;
            border: 1px solid #000 !important;
          }
        }
        @media screen {
          .print-only {
            display: none !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6 no-print">
            <h1 className="text-3xl font-bold text-gray-900 text-center">
              التحقق من الإيصال
            </h1>
            <p className="text-gray-600 text-center mt-2">
              رقم الإيصال: {receiptData.receiptNumber}
            </p>
          </div>

          {/* Print Header */}
          <div className="print-only text-center mb-6">
            <h1 className="text-2xl font-bold">الجامعة الوطنية السودانية</h1>
            <h2 className="text-xl">نظام الإدارة المالية</h2>
            <h3 className="text-lg">صفحة التحقق من الإيصال</h3>
          </div>

          {/* Receipt Card */}
          <Card className="mb-6 receipt-card">
            <CardHeader className="text-center border-b">
              <div className="flex items-center justify-center mb-4">
                {receiptData.verified ? (
                  <CheckCircle className="h-8 w-8 text-green-500 ml-2" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-500 ml-2" />
                )}
                <CardTitle className="text-2xl">
                  {receiptData.verified ? "إيصال صحيح" : "إيصال غير صحيح"}
                </CardTitle>
              </div>
              <Badge
                variant={receiptData.verified ? "default" : "destructive"}
                className="text-sm"
              >
                {receiptData.verified ? "متحقق" : "غير متحقق"}
              </Badge>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Receipt Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-gray-900 mb-4">
                    تفاصيل الإيصال
                  </h3>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">رقم الإيصال:</span>
                      <span className="font-medium">
                        {receiptData.receiptNumber}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">التاريخ:</span>
                      <span className="font-medium">
                        {receiptData.paymentDate}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">الموظف:</span>
                      <span className="font-medium">
                        {receiptData.employee || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Student Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-gray-900 mb-4">
                    بيانات الطالب
                  </h3>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">الرقم الجامعي:</span>
                      <span className="font-medium">
                        {receiptData.studentId}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">اسم الطالب:</span>
                      <span className="font-medium">
                        {receiptData.studentName}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">نوع الرسوم:</span>
                      <span className="font-medium">{receiptData.feeType}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">طريقة الدفع:</span>
                      <span className="font-medium">
                        {receiptData.paymentMethod}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Amount Section */}
              <div className="text-center">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    المبلغ المدفوع
                  </h3>
                  <div className="text-3xl font-bold text-green-600">
                    {receiptData.amount.toLocaleString("ar-EG")} ج.م
                  </div>
                </div>
              </div>

              {/* Verification Note */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-blue-500 ml-2 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800">ملاحظة مهمة</h4>
                    <p className="text-blue-700 text-sm mt-1">
                      هذا الإيصال تم التحقق من صحته من قاعدة بيانات الجامعة
                      الوطنية السودانية. يمكنك استخدامه كدليل رسمي على الدفع.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-center no-print">
            <Button onClick={handlePrint} variant="outline" size="lg">
              <Printer className="h-4 w-4 ml-2" />
              طباعة
            </Button>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500 no-print">
            <p>الجامعة الوطنية السودانية - نظام الإدارة المالية</p>
            <p className="mt-1">
              جميع الحقوق محفوظة © {new Date().getFullYear()}
            </p>
          </div>

          {/* Print Footer */}
          <div className="print-only text-center text-sm mt-8">
            <p>تم طباعة هذا المستند في: {new Date().toLocaleString("ar-EG")}</p>
            <p>الجامعة الوطنية السودانية - نظام الإدارة المالية</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReceiptVerification;
