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
  PaymentStatistics,
} from "@/services/paymentService";
import i18n from "@/lib/i18n";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Printer, AlertTriangle } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";

// NOTE: Requires i18n keys: appliedRate, amountUSD, usd. Ensure they are added in i18n resources.

export function Payments() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const isArabic = i18n.language === "ar";

  // API state
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [feeTypeFilter, setFeeTypeFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null);
  const [stats, setStats] = useState<PaymentStatistics | null>(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 1500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Check if user can edit (admin only)
  const canEdit = user?.role === "admin";

  // Fetch payments from API
  const fetchPayments = async (filters: PaymentFilters = {}) => {
    try {
      setLoading(true);
      setError(null);

      let response;
      const hasSearch = debouncedSearchTerm.trim().length > 0;
      if (hasSearch) {
        response = await paymentService.searchPayments(
          debouncedSearchTerm.trim(),
          currentPage,
          pagination.limit
        );
      } else {
        const currentFilters: PaymentFilters = {
          page: currentPage,
          limit: pagination.limit,
          ...filters,
        };
        if (feeTypeFilter !== "all") currentFilters.feeType = feeTypeFilter;
        if (paymentMethodFilter !== "all")
          currentFilters.paymentMethod = paymentMethodFilter;
        response = await paymentService.getAllPayments(currentFilters);
      }

      setPayments(response.data.payments);
      setPagination(response.data.pagination);
      setTotalPages(response.data.pagination.totalPages);
      // Preserve previous stats if search endpoint (or filtered call) doesn't include them
      setStats((prev) => (response.data as any).statistics ?? prev);
    } catch (err: any) {
      setError(err.message || "Failed to load payments");
      console.error("Payment API error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and whenever page or filters change (match Expenses behavior)
  useEffect(() => {
    fetchPayments();
  }, [currentPage, debouncedSearchTerm, feeTypeFilter, paymentMethodFilter]);

  // Helper functions
  const getFeeTypeBadge = (feeType: string) => {
    const feeTypeMap: Record<string, string> = {
      NEW_YEAR: "رسوم سنة جديدة",
      SUPPLEMENTARY: "رسوم ملحق",
      LAB: "رسوم مختبر",
      STUDENT_SERVICES: "رسوم خدمات طلابية",
      OTHER: "أخرى",
      EXAM: "رسوم امتحان",
      TRAINING: "رسوم تدريب",
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

  // Use centralized helpers for numbers/currency

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-SD");
  };

  const handlePaymentSubmit = async (data: PaymentSubmissionData) => {
    try {
      if (editingPayment) {
        // Update flow
        const updatePayload: Partial<CreatePaymentData> = {
          studentId: data.studentId,
          studentName: data.studentName,
          feeType: data.feeType,
          amount: data.amount,
          // allow editing receipt number if provided
          receiptNumber: data.receiptNumber,
          paymentMethod: data.paymentMethod,
          paymentDate: data.paymentDate.toISOString(),
          notes: data.notes || "",
        };
        const resp = await paymentService.updatePayment(
          editingPayment.id,
          updatePayload
        );
        toast({ title: t("paymentupdatesuccessfully"), description: t("success") });
        setEditingPayment(null);
        setIsPaymentDialogOpen(false);
        fetchPayments();
      } else {
        // Create flow
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
        fetchPayments();
      }
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
      <div className="flex items-center justify-between"></div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Daily Total (EGP & USD) */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("todayTotal")}
                </p>
                <p className="text-lg font-bold text-success">
                  {formatCurrency(stats?.daily.totalAmount ?? 0)} {t("sdg")}
                </p>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  {formatCurrency((stats?.daily as any)?.totalAmountUSD ?? 0)}{" "}
                  {t("usd")}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        {/* Daily Operations Count */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("todayOperations")}
                </p>
                <p className="text-lg font-bold text-foreground">
                  {stats?.daily.operationsCount ?? 0}
                </p>
              </div>
              <Receipt className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        {/* Monthly Average Daily Income */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("averageDailyIncome")}
                </p>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(stats?.monthly.averageDailyIncome ?? 0)}{" "}
                  {t("sdg")}
                </p>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  {formatCurrency(
                    (stats?.monthly as any)?.averageTransactionAmountUSD ?? 0
                  )}{" "}
                  {t("usd")}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-secondary" />
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
                  <SelectItem value="TRAINING">{t("training")}</SelectItem>
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
            </div>
            {canEdit && (
              <Dialog
                open={isPaymentDialogOpen}
                onOpenChange={setIsPaymentDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    className="bg-gradient-primary hover:opacity-90"
                    onClick={() => {
                      setEditingPayment(null);
                      setIsPaymentDialogOpen(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t("addPayment")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingPayment
                        ? t("editPaymentTitle")
                        : t("addPaymentTitle")}
                    </DialogTitle>
                    <DialogDescription>
                      {editingPayment
                        ? t("editPaymentDesc")
                        : t("addPaymentDesc")}
                    </DialogDescription>
                  </DialogHeader>
                  <PaymentForm
                    onSubmit={handlePaymentSubmit}
                    onCancel={() => {
                      setIsPaymentDialogOpen(false);
                      setEditingPayment(null);
                    }}
                    initialValues={
                      editingPayment
                        ? {
                            studentId: editingPayment.studentId,
                            studentName: editingPayment.studentName,
                            feeType: editingPayment.feeType as any,
                            amount: String(editingPayment.amount),
                            receiptNumber: editingPayment.receiptNumber,
                            paymentMethod: editingPayment.paymentMethod as any,
                            paymentDate: new Date(editingPayment.paymentDate),
                            notes: editingPayment.notes || "",
                          }
                        : undefined
                    }
                    isEdit={Boolean(editingPayment)}
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
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {t("paymentRecords")} ({pagination.totalCount})
          </CardTitle>
          {totalPages > 1 && (
            <div className="flex gap-4 items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {t("pageOf", { current: currentPage, total: totalPages })}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  {t("previous")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  {t("next")}
                </Button>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader className={isArabic ? "text-right" : "text-left"}>
                <TableRow>
                  <TableHead className={isArabic ? "text-right" : "text-left"}>
                    {t("receiptNumber")}
                  </TableHead>
                  <TableHead className={isArabic ? "text-right" : "text-left"}>
                    {t("studentData")}
                  </TableHead>
                  <TableHead className={isArabic ? "text-right" : "text-left"}>
                    {t("feeType")}
                  </TableHead>
                  <TableHead className={isArabic ? "text-right" : "text-left"}>
                    {t("amount")}
                  </TableHead>
                  <TableHead className={isArabic ? "text-right" : "text-left"}>
                    {t("appliedRate")}
                  </TableHead>
                  <TableHead className={isArabic ? "text-right" : "text-left"}>
                    {t("amountUSD")}
                  </TableHead>
                  <TableHead className={isArabic ? "text-right" : "text-left"}>
                    {t("paymentMethod")}
                  </TableHead>
                  <TableHead className={isArabic ? "text-right" : "text-left"}>
                    {t("paymentDate")}
                  </TableHead>
                  <TableHead className={isArabic ? "text-right" : "text-left"}>
                    {t("employee")}
                  </TableHead>
                  <TableHead
                    className={isArabic ? "text-center" : "text-center"}
                  >
                    {t("actions")}
                  </TableHead>
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
                      {formatCurrency(payment.amount)} {t("sdg")}
                    </TableCell>
                    <TableCell className="text-sm">
                      {payment.usdAppliedRate !== undefined
                        ? Number(payment.usdAppliedRate).toFixed(2)
                        : "-"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {payment.amountUSD !== undefined
                        ? `${formatCurrency(payment.amountUSD)} ${t("usd")}`
                        : "-"}
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
                          onClick={() =>
                            paymentService.openReceiptPdf(payment.id)
                          }
                          title="طباعة"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        {canEdit && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-warning"
                              onClick={() => {
                                setEditingPayment(payment);
                                setIsPaymentDialogOpen(true);
                              }}
                              title="تعديل"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive"
                                  title="حذف"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="sm:max-w-[430px] p-6 bg-background border border-destructive/20 shadow-lg">
                                <div className="flex items-start gap-4">
                                  <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                                    <AlertTriangle className="h-7 w-7 text-destructive" />
                                  </div>
                                  <div className="space-y-3 w-full">
                                    <AlertDialogHeader className="space-y-2 p-0">
                                      <AlertDialogTitle className="text-xl font-bold text-destructive">
                                        {t("deletePaymentTitle")}
                                      </AlertDialogTitle>
                                      <AlertDialogDescription className="text-muted-foreground leading-relaxed text-sm">
                                        {t("deletePaymentDescription")}
                                        <span className="block mt-3 text-foreground font-medium text-xs sm:text-sm">
                                          {t("receiptNumber")}:{" "}
                                          {payment.receiptNumber} —{" "}
                                          {t("amount")}:{" "}
                                          {formatCurrency(payment.amount)}{" "}
                                          {t("sdg")}
                                        </span>
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="pt-1 flex sm:justify-end gap-2">
                                      <AlertDialogCancel className="mt-0">
                                        إلغاء
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-destructive hover:bg-destructive/90 focus-visible:ring-destructive"
                                        onClick={async () => {
                                          try {
                                            await paymentService.deletePayment(
                                              payment.id
                                            );
                                            toast({
                                              title: t("paymentDeleteSuccess"),
                                            });
                                            fetchPayments();
                                          } catch (e: any) {
                                            toast({
                                              title: t("paymentDeleteFailure"),
                                              description: e?.message,
                                              variant: "destructive",
                                            });
                                          }
                                        }}
                                      >
                                        {t("deletePermanently")}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </div>
                                </div>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
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
