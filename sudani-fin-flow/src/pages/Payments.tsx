import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Search,
  Filter,
  Receipt,
  Calendar,
  DollarSign,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Loading from "@/components/common/Loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  PaymentForm,
  PaymentSubmissionData,
} from "@/components/forms/PaymentForm";
import { useToast } from "@/hooks/use-toast";
import {
  paymentService,
  Payment,
  PaymentFilters,
  CreatePaymentData,
} from "@/services/paymentService";

export function Payments() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();

  // API state
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [feeTypeFilter, setFeeTypeFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Check if user can edit (admin only)
  const canEdit = user?.role === "admin";

  // Fetch payments from API
  const fetchPayments = async (filters: PaymentFilters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const currentFilters: PaymentFilters = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      };

      // Only add non-empty filters
      if (debouncedSearchTerm.trim())
        currentFilters.search = debouncedSearchTerm.trim();
      if (feeTypeFilter !== "all") currentFilters.feeType = feeTypeFilter;
      if (paymentMethodFilter !== "all")
        currentFilters.paymentMethod = paymentMethodFilter;

      const response = await paymentService.getAllPayments(currentFilters);

      setPayments(response.data.payments);
      setPagination(response.data.pagination);
    } catch (err: any) {
      setError(err.message || "Failed to load payments");
      console.error("Payment API error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and whenever filters change
  useEffect(() => {
    fetchPayments({
      page: 1,
      search: debouncedSearchTerm,
      feeType: feeTypeFilter !== "all" ? feeTypeFilter : undefined,
      paymentMethod:
        paymentMethodFilter !== "all" ? paymentMethodFilter : undefined,
    });
  }, [debouncedSearchTerm, feeTypeFilter, paymentMethodFilter]);

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    fetchPayments({ page: newPage });
  };

  // Helper functions
  const getFeeTypeBadge = (feeType: string) => {
    const feeTypeMap: Record<string, string> = {
      NEW_YEAR: "رسوم سنة جديدة",
      SUPPLEMENTARY: "رسوم ملحق",
      LAB: "رسوم مختبر",
      STUDENT_SERVICES: "رسوم خدمات طلابية",
      OTHER: "أخرى",
      EXAM: "رسوم امتحان",
    };
    return feeTypeMap[feeType] || feeType;
  };

  const getPaymentMethodBadge = (method: string) => {
    const methodMap: Record<string, { label: string; className: string }> = {
      CASH: { label: "نقداً", className: "text-success border-success" },
      TRANSFER: { label: "تحويل", className: "text-primary border-primary" },
      CHEQUE: { label: "شيك", className: "text-warning border-warning" },
    };

    const methodData = methodMap[method] || { label: method, className: "" };

    return (
      <Badge variant="outline" className={methodData.className}>
        {methodData.label}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ar-SD").format(amount) + " ج.س";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-SD");
  };

  const handlePaymentSubmit = async (data: PaymentSubmissionData) => {
    try {
      // Prepare payment data for API (already in the correct format)
      const paymentData: CreatePaymentData = {
        studentId: data.studentId,
        studentName: data.studentName,
        feeType: data.feeType,
        amount: data.amount,
        receiptNumber: data.receiptNumber,
        paymentMethod: data.paymentMethod,
        paymentDate: data.paymentDate.toISOString(),
        notes: data.notes || "",
      };

      const response = await paymentService.createPayment(paymentData);

      toast({
        title: "تم تسجيل الدفعة بنجاح",
        description: `رقم الإيصال: ${response.data.payment.receiptNumber}`,
      });

      setIsPaymentDialogOpen(false);

      // Refresh payments list
      fetchPayments();
    } catch (err: any) {
      toast({
        title: "خطأ في تسجيل الدفعة",
        description: err.message || "حدث خطأ أثناء تسجيل الدفعة",
        variant: "destructive",
      });
    }
  };

  // Calculate totals from current payments
  const totalAmount = payments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );
  const completedPayments = payments; // All payments from API are considered completed
  const completedAmount = completedPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );

  if (loading) {
    return <Loading labelKey="loadingPayments" />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => fetchPayments()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t("paymentManagement")}
          </h1>
          <p className="text-muted-foreground">
            {t("paymentManagement")} - {t("addPayment")}
          </p>
        </div>
        {canEdit && (
          <Dialog
            open={isPaymentDialogOpen}
            onOpenChange={setIsPaymentDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:opacity-90">
                <Plus className="mr-2 h-4 w-4" />
                {t("addPayment")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>تسجيل دفعة جديدة</DialogTitle>
                <DialogDescription>
                  قم بإدخال بيانات الدفعة الجديدة وإصدار الإيصال
                </DialogDescription>
              </DialogHeader>
              <PaymentForm
                onSubmit={handlePaymentSubmit}
                onCancel={() => setIsPaymentDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
        {!canEdit && (
          <Badge variant="outline" className="text-muted-foreground">
            <Eye className="mr-1 h-3 w-3" />
            عرض فقط
          </Badge>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-success flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(completedAmount)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("todayTotal")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Receipt className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">
                  {completedPayments.length}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("completedTransactions")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-secondary flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">
                  {pagination.totalCount}
                </p>
                <p className="text-sm text-muted-foreground">
                  إجمالي المعاملات
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                <Receipt className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(totalAmount)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("totalAmount")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={feeTypeFilter} onValueChange={setFeeTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={t("feeTypePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allTypes")}</SelectItem>
                  <SelectItem value="NEW_YEAR">{t("newYear")}</SelectItem>
                  <SelectItem value="SUPPLEMENTARY">
                    {t("supplementary")}
                  </SelectItem>
                  <SelectItem value="LAB">{t("laboratory")}</SelectItem>
                  <SelectItem value="STUDENT_SERVICES">
                    {t("studentServices")}
                  </SelectItem>
                  <SelectItem value="EXAM">{t("examination")}</SelectItem>
                  <SelectItem value="OTHER">{t("otherFees")}</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={paymentMethodFilter}
                onValueChange={setPaymentMethodFilter}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={t("paymentMethodPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allMethods")}</SelectItem>
                  <SelectItem value="CASH">{t("cash")}</SelectItem>
                  <SelectItem value="TRANSFER">{t("transfer")}</SelectItem>
                  <SelectItem value="CHEQUE">{t("check")}</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                {t("advancedFilterBtn")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {t("paymentRecords")} ({pagination.totalCount})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrevPage}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              {t("pageOf", {
                current: pagination.page,
                total: pagination.totalPages,
              })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الإيصال</TableHead>
                  <TableHead>بيانات الطالب</TableHead>
                  <TableHead>نوع الرسوم</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>طريقة الدفع</TableHead>
                  <TableHead>تاريخ الدفع</TableHead>
                  <TableHead>الموظف</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {payment.receiptNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{payment.studentName}</p>
                        <p className="text-sm text-muted-foreground">
                          {payment.studentId}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{getFeeTypeBadge(payment.feeType)}</TableCell>
                    <TableCell className="font-bold text-success">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell>
                      <div>
                        {getPaymentMethodBadge(payment.paymentMethod)}
                        {payment.notes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {payment.notes}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                    <TableCell className="text-sm">
                      {payment.createdBy.username}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:text-primary"
                        >
                          <Receipt className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          طباعة
                        </Button>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-warning"
                          >
                            تعديل
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
