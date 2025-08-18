import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Search,
  Filter,
  Receipt,
  DollarSign,
  Calendar,
  Building,
  Eye,
  Loader2,
  RefreshCw,
  ExternalLink,
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

// Expense categories that match the API categories, labels are localized via i18n
const expenseCategories: { value: ExpenseCategory; label: string }[] = [
  { value: "Fixed Assets", label: "categories.fixedAssets" },
  { value: "Part-time Professors", label: "categories.partTimeProfessors" },
  {
    value: "Study Materials and Administration Leaves",
    label: "categories.studyMaterialsAdminLeaves",
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
];

// Map API category values to translation keys
const categoryKeyMap: Record<string, string> = {
  "Fixed Assets": "categories.fixedAssets",
  "Part-time Professors": "categories.partTimeProfessors",
  // Support both legacy '&' and new 'and'
  "Study Materials and Administration Leaves":
    "categories.studyMaterialsAdminLeaves",
  "Study Materials & Administration Leaves":
    "categories.studyMaterialsAdminLeaves",
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

  // Debounce search query to avoid excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

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

      const response = await expenseService.getAllExpenses(filters);

      setExpenses(response.data.expenses);
      setStatistics(response.data.statistics);
      setTotalPages(response.data.pagination.totalPages);

      console.log("✅ Expenses loaded successfully:", {
        count: response.data.expenses.length,
        statistics: response.data.statistics,
        cached: response.data.cached,
      });
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
      console.log("🔄 Creating expense:", formData);

      const response = await expenseService.createExpense(formData);

      console.log("✅ Expense created successfully:", response);

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

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("ar-SD").format(numAmount);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Fixed Assets": "bg-green-100 text-green-800",
      "Part-time Professors": "bg-blue-100 text-blue-800",
      "Study Materials and Administration Leaves":
        "bg-orange-100 text-orange-800",
      Salaries: "bg-purple-100 text-purple-800",
      "Student Fees Refund": "bg-yellow-100 text-yellow-800",
      Advances: "bg-indigo-100 text-indigo-800",
      Bonuses: "bg-pink-100 text-pink-800",
      "General and Administrative Expenses": "bg-red-100 text-red-800",
      "Library Supplies": "bg-cyan-100 text-cyan-800",
      "Lab Consumables": "bg-teal-100 text-teal-800",
      "Student Training": "bg-lime-100 text-lime-800",
      "Saudi-Egyptian Company": "bg-amber-100 text-amber-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

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
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("todayExpensesTotal")}
                </p>
                <p className="text-2xl font-bold text-destructive">
                  {statistics?.daily.totalAmount
                    ? formatCurrency(statistics.daily.totalAmount)
                    : "0"}{" "}
                  {t("sdg")}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("expensesCount")}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {statistics?.daily.operationsCount || 0}
                </p>
              </div>
              <Receipt className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("averageExpense")}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {statistics?.monthly.averageDailyExpenditure
                    ? formatCurrency(statistics.monthly.averageDailyExpenditure)
                    : "0"}{" "}
                  ج.س
                </p>
              </div>
              <Calendar className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={t("filter")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allCategories")}</SelectItem>
              {expenseCategories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {t(category.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {t("refresh")}
          </Button>
        </div>

        {canEdit && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:opacity-90">
                <Plus className="h-4 w-4 mr-2" />
                {t("addExpense")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t("addExpense")}</DialogTitle>
              </DialogHeader>
              <ExpenseForm
                onSubmit={handleAddExpense}
                onCancel={() => setIsAddDialogOpen(false)}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
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

      {/* Expenses List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            {t("expenseRecords")}
            {statistics && (
              <Badge variant="outline" className="ml-auto">
                {statistics.daily.operationsCount}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-sm">
                      {expense.description}
                    </h3>
                    <Badge className={getCategoryColor(expense.category)}>
                      {getCategoryLabel(expense.category)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      {expense.vendor || t("noData")}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(expense.date)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    {expense.receiptUrl && (
                      <a
                        href={expense.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {t("viewReceipt")}
                      </a>
                    )}
                    <span>•</span>
                    <span>{expense.creator.username}</span>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold text-destructive">
                    -{formatCurrency(expense.amount)} {t("sdg")}
                  </p>
                </div>
              </div>
            ))}

            {expenses.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {t("noData")}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
