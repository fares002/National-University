import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Search,
  Filter,
  Receipt,
  DollarSign,
  Calendar,
  Eye,
  ExternalLink,
  Pencil,
  Trash2,
  ListChecks,
  BarChart2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Loading from "@/components/common/Loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
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
import expenseService, {
  Expense,
  ExpenseStatistics,
  ExpenseFilters,
  ExpenseCategory,
} from "@/services/expenseService";
import { useDebounce } from "@/hooks/useDebounce";
import {
  ExpenseForm,
  ExpenseSubmissionData,
} from "@/components/forms/ExpenseForm";
import i18n from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Expense categories that match the API categories, labels are localized via i18n
const expenseCategories: { value: ExpenseCategory; label: string }[] = [
  { value: "Fixed Assets", label: "categories.fixedAssets" },
  { value: "Part-time Professors", label: "categories.partTimeProfessors" },
  {
    value: "Rent of study and administrative premises",
    label: "categories.rentStudyPremises",
  },
  { value: "Salaries", label: "categories.salaries" },
  { value: "Student Fees Refund", label: "categories.studentFeesRefund" },
  { value: "Advances", label: "categories.advances" },
  { value: "Bonuses", label: "categories.bonuses" },
  {
    value: "General and Administrative Expenses",
    label: "categories.generalAdminExpenses",
  },
  { value: "Library Supplies", label: "categories.librarySupplies" },
  { value: "Lab Consumables", label: "categories.labConsumables" },
  { value: "Student Training", label: "categories.studentTraining" },
  { value: "Saudi-Egyptian Company", label: "categories.saudiEgyptianCompany" },
  { value: "other", label: "categories.other" },
];

// Map API category values to translation keys
const categoryKeyMap: Record<string, string> = {
  "Fixed Assets": "categories.fixedAssets",
  "Part-time Professors": "categories.partTimeProfessors",

  // New canonical label used across app
  "Rent of study and administrative premises": "categories.rentStudyPremises",
  Salaries: "categories.salaries",
  "Student Fees Refund": "categories.studentFeesRefund",
  Advances: "categories.advances",
  Bonuses: "categories.bonuses",
  "General and Administrative Expenses": "categories.generalAdminExpenses",
  "General & Administrative Expenses": "categories.generalAdminExpenses",
  "Library Supplies": "categories.librarySupplies",
  "Lab Consumables": "categories.labConsumables",
  "Student Training": "categories.studentTraining",
  "Saudi-Egyptian Company": "categories.saudiEgyptianCompany",
  // Support lowercase 'other' coming from API and capitalized variant
  other: "categories.other",
  Other: "categories.other",
};

export function Expenses() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();

  // State management
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [statistics, setStatistics] = useState<ExpenseStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [operation, setOperation] = useState("");
  const isArabic = i18n.language === "ar";
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Debounce search query to avoid excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 1500);

  // Check if user can edit (admin only)
  const canEdit = user?.role === "admin";

  // Fetch expenses from API
  const fetchExpenses = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const filters: ExpenseFilters = {
        page: currentPage,
        limit: 10,
      };

      if (debouncedSearchQuery.trim()) {
        filters.search = debouncedSearchQuery.trim();
      }

      if (selectedCategory && selectedCategory !== "all") {
        filters.category = selectedCategory;
      }

      let response;
      if (debouncedSearchQuery.trim()) {
        response = await expenseService.searchExpenses(
          debouncedSearchQuery.trim(),
          currentPage,
          10
        );
      } else {
        response = await expenseService.getAllExpenses(filters);
      }

      setExpenses(response.data.expenses);
      // statistics only available on getAll endpoint; keep when present
      // Preserve previous statistics if not included in response
      setStatistics((prev) => {
        const anyData: any = response.data as any;
        return anyData.statistics ?? prev;
      });
      setTotalPages(response.data.pagination.totalPages);
      setOperation(response.data.pagination.totalExpenses);
    } catch (error) {
      console.error("❌ Error loading expenses:", error);
      toast({
        title: t("error"),
        description: t("loading"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load expenses on component mount and when filters change
  useEffect(() => {
    fetchExpenses();
  }, [currentPage, debouncedSearchQuery, selectedCategory]);

  // Handle refresh
  const handleRefresh = () => {
    fetchExpenses(true);
  };

  // Handle add expense
  const handleAddExpense = async (formData: ExpenseSubmissionData) => {
    try {
      const response = await expenseService.createExpense(formData);

      toast({
        title: t("success"),
        description: t("saveExpenseBtn"),
      });

      setIsAddDialogOpen(false);
      fetchExpenses(true); // Refresh the expenses list
    } catch (error) {
      console.error("❌ Error adding expense:", error);
      const err: any = error as any;
      const validatorMsg = Array.isArray(err?.response?.data?.errors)
        ? err.response.data.errors[0]?.msg
        : undefined;
      const message =
        validatorMsg ||
        err?.response?.data?.data?.message ||
        err?.response?.data?.message ||
        err?.message ||
        t("error");
      toast({
        title: t("error"),
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleEditExpense = async (
    id: string,
    formData: ExpenseSubmissionData
  ) => {
    try {
      await expenseService.updateExpense(id, {
        description: formData.description,
        category: formData.category,
        amount: formData.amount,
        vendor: formData.vendor,
        receiptUrl: formData.receiptUrl,
        date: formData.date,
      });
      toast({ title: t("success"), description: t("saving") });
      setIsAddDialogOpen(false);
      setEditingExpense(null);
      fetchExpenses(true);
    } catch (error: any) {
      toast({
        title: t("error"),
        description: error?.message || t("error"),
        variant: "destructive",
      });
    }
  };

  const confirmDeleteExpense = async (id: string) => {
    try {
      await expenseService.deleteExpense(id);
      toast({ title: t("success"), description: t("deleted") });
      fetchExpenses(true);
    } catch (error: any) {
      toast({
        title: t("error"),
        description: error?.message || t("error"),
        variant: "destructive",
      });
    }
  };

  // Use centralized helpers for numbers/currency

  const categoryBadge = (category: string) => (
    <Badge variant="outline" className="font-normal">
      {getCategoryLabel(category)}
    </Badge>
  );

  const getCategoryLabel = (category: string) => {
    const key = categoryKeyMap[category as ExpenseCategory];
    return key ? t(key) : category;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Loading state
  if (loading) {
    return <Loading labelKey="loadingExpenses" size="lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Daily Total (EGP & USD) with original simple icon style */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("todayExpensesTotal")}
                </p>
                <p className="text-lg font-bold text-destructive">
                  {formatCurrency(statistics?.daily.totalAmount ?? 0)}{" "}
                  {t("sdg")}
                </p>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  {formatCurrency(
                    (statistics?.daily as any)?.totalAmountUSD ?? 0
                  )}{" "}
                  {t("usd")}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        {/* Operations Count aligned like first card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("expensesCount")}
                </p>
                <p className="text-lg font-bold text-foreground">
                  {statistics?.daily.operationsCount ?? 0}
                </p>
              </div>
              <ListChecks className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        {/* Average Daily Expenditure aligned like first card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("averageExpense")}
                </p>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(
                    statistics?.monthly.averageDailyExpenditure ?? 0
                  )}{" "}
                  {t("sdg")}
                </p>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  {formatCurrency(
                    (statistics?.monthly as any)?.averageDailyExpenditureUSD ??
                      0
                  )}{" "}
                  {t("usd")}
                </p>
              </div>
              <BarChart2 className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Add */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("search")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={t("filter")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allCategories")}</SelectItem>
                  {expenseCategories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {t(c.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {canEdit && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-gradient-primary hover:opacity-90"
                    onClick={() => {
                      setEditingExpense(null);
                      setIsAddDialogOpen(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t("addExpense")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingExpense ? t("editExpense") : t("addExpense")}
                    </DialogTitle>
                  </DialogHeader>
                  <ExpenseForm
                    onSubmit={(data) =>
                      editingExpense
                        ? handleEditExpense(editingExpense.id, data)
                        : handleAddExpense(data)
                    }
                    onCancel={() => {
                      setIsAddDialogOpen(false);
                      setEditingExpense(null);
                    }}
                    initialValues={
                      editingExpense
                        ? {
                            description: editingExpense.description,
                            category:
                              editingExpense.category as ExpenseCategory,
                            amount: String(editingExpense.amount),
                            vendor: editingExpense.vendor,
                            receiptUrl: editingExpense.receiptUrl,
                            date: editingExpense.date.slice(0, 10),
                          }
                        : undefined
                    }
                    isEdit={Boolean(editingExpense)}
                  />
                </DialogContent>
              </Dialog>
            )}
            {!canEdit && (
              <Badge variant="outline" className="text-muted-foreground">
                <Eye className="mr-1 h-3 w-3" />
                {t("viewOnly")}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pagination above table (optional if many pages) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {t("pageOf", { current: currentPage, total: totalPages })}
          </span>
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

      {/* Expenses Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {t("expenseRecords")} ({operation})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader className={isArabic ? "text-right" : "text-left"}>
                <TableRow>
                  <TableHead className={isArabic ? "text-right" : "text-left"}>
                    {t("description")}
                  </TableHead>
                  <TableHead className={isArabic ? "text-right" : "text-left"}>
                    {t("category")}
                  </TableHead>
                  <TableHead className={isArabic ? "text-right" : "text-left"}>
                    {t("vendor")}
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
                    {t("date")}
                  </TableHead>
                  <TableHead className={isArabic ? "text-right" : "text-left"}>
                    {t("employee")}
                  </TableHead>
                  <TableHead className="text-center">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col gap-1">
                        <span>{expense.description || t("noData")}</span>
                        {expense.receiptUrl && (
                          <a
                            href={expense.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary inline-flex items-center gap-1 hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />{" "}
                            {t("viewReceipt")}
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{categoryBadge(expense.category)}</TableCell>
                    <TableCell className="text-sm">
                      {expense.vendor || "-"}
                    </TableCell>
                    <TableCell className="font-bold text-destructive">
                      {formatCurrency(expense.amount)} {t("sdg")}
                    </TableCell>
                    <TableCell className="text-sm">
                      {expense.usdAppliedRate !== undefined &&
                      expense.usdAppliedRate !== null
                        ? Number(expense.usdAppliedRate).toFixed(2)
                        : "-"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {expense.amountUSD !== undefined &&
                      expense.amountUSD !== null
                        ? `${formatCurrency(expense.amountUSD)} ${t("usd")}`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(expense.date)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {expense.creator.username}
                    </TableCell>
                    <TableCell>
                      {canEdit ? (
                        <div className="flex items-center gap-2 justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-warning"
                            onClick={() => {
                              setEditingExpense(expense);
                              setIsAddDialogOpen(true);
                            }}
                            title={t("edit") || ""}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                title={t("delete") || ""}
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
                                      {t("confirmDeleteTitle")}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-muted-foreground leading-relaxed text-sm">
                                      {t("confirmDeleteDescription")}
                                      <span className="block mt-3 text-foreground font-medium text-xs sm:text-sm">
                                        {t("amount")}:{" "}
                                        {formatCurrency(expense.amount)}{" "}
                                        {t("sdg")} — {t("description")}:{" "}
                                        {expense.description || t("noData")}
                                      </span>
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter className="pt-1 flex sm:justify-end gap-2">
                                    <AlertDialogCancel className="mt-0">
                                      {t("cancelBtn")}
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive hover:bg-destructive/90 focus-visible:ring-destructive"
                                      onClick={() =>
                                        confirmDeleteExpense(expense.id)
                                      }
                                    >
                                      {t("delete")}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </div>
                              </div>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {t("viewOnly")}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {expenses.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {t("noData")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
