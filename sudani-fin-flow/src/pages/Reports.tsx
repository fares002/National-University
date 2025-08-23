import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FileText,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as LucidePieChart,
  Eye,
  Filter,
  Search,
  PrinterIcon,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import Loading from "@/components/common/Loading";
import { reportsService } from "@/services/reportsService";
import { analyticsService } from "@/services/analyticsService";
import { toast } from "@/components/ui/use-toast";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";

// Map raw API category labels to i18n translation keys
const categoryKeyMap: Record<string, string> = {
  // Income & Expense shared categories (adjust to your backend list)
  "Fixed Assets": "categories.fixedAssets",
  "Part-time Professors": "categories.partTimeProfessors",
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
  other: "categories.other",
  Other: "categories.other",
};

const detailedReports = [
  {
    id: "1",
    type: "comprehensiveFinancialReport",
    date: "2024-01-15",
    status: "completed",
    size: "2.5 MB",
  },
  {
    id: "2",
    type: "incomeByCategoryReport",
    date: "2024-01-14",
    status: "completed",
    size: "1.8 MB",
  },
  {
    id: "3",
    type: "detailedExpenseReport",
    date: "2024-01-13",
    status: "inProgress",
    size: "2.1 MB",
  },
  {
    id: "4",
    type: "cashFlowReport",
    date: "2024-01-12",
    status: "completed",
    size: "1.2 MB",
  },
  {
    id: "5",
    type: "annualComparisonReport",
    date: "2024-01-11",
    status: "completed",
    size: "3.4 MB",
  },
];

const chartConfig = {
  income: {
    label: "income",
    color: "#10b981",
  },
  expenses: {
    label: "reportsExpensesCat",
    color: "#ef4444",
  },
  profit: {
    label: "profit",
    color: "#3b82f6",
  },
};

export function Reports() {
  const { t, i18n } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");
  const [selectedReport, setSelectedReport] = useState("financial");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [downloadingCustom, setDownloadingCustom] = useState(false);
  const [yearSummary, setYearSummary] = useState<{
    payments: number;
    expenses: number;
    netIncome: number;
    paymentsCount: number;
    expensesCount: number;
    year: number;
  } | null>(null);

  // New: quick live summaries for today, this month, this year
  const [quickDaily, setQuickDaily] = useState<{
    date: string;
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
  } | null>(null);
  const [quickMonthly, setQuickMonthly] = useState<{
    date: string; // YYYY-MM
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    year: number;
    month: number;
  } | null>(null);
  const [quickYearly, setQuickYearly] = useState<{
    date: string; // YYYY
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    year: number;
  } | null>(null);

  // Button loading states for PDF downloads
  const [downloading, setDownloading] = useState({
    daily: false,
    monthly: false,
    yearly: false,
  });

  // Analytics state
  const [monthlyData, setMonthlyData] = useState<
    { month: string; income: number; expenses: number; profit: number }[]
  >([]);
  const [incomeByCategory, setIncomeByCategory] = useState<
    { category: string; amount: number; percentage: number }[]
  >([]);
  const [expenseByCategory, setExpenseByCategory] = useState<
    { category: string; amount: number; percentage: number }[]
  >([]);
  const [chartsLoading, setChartsLoading] = useState(true);

  // Use centralized helpers from utils
  const isRTL = i18n.language === "ar" || i18n.dir() === "rtl";

  const getReportIcon = (type: string) => {
    switch (type) {
      case "daily":
        return <Calendar className="h-4 w-4" />;
      case "weekly":
        return <BarChart3 className="h-4 w-4" />;
      case "monthly":
        return <LucidePieChart className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getReportColor = (type: string) => {
    switch (type) {
      case "daily":
        return "bg-blue-100 text-blue-800";
      case "weekly":
        return "bg-green-100 text-green-800";
      case "monthly":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        setError(null);
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = now.getMonth() + 1; // 1-12
        const dd = String(now.getDate()).padStart(2, "0");
        const monthStr = String(mm).padStart(2, "0");
        const dateStr = `${yyyy}-${String(mm).padStart(2, "0")}-${dd}`;

        // Fetch in parallel: summary, daily, monthly, yearly
        const [summaryRes, dailyRes, monthlyRes, yearlyRes] = await Promise.all(
          [
            reportsService.getSummary(),
            reportsService.getDailyReport(dateStr),
            reportsService.getMonthlyReport(yyyy, mm),
            reportsService.getYearlyReport(yyyy),
          ]
        );

        setYearSummary(summaryRes.data.summary.thisYear);

        // Daily
        const d = dailyRes.data.report;
        setQuickDaily({
          date: d.date,
          totalIncome: d.payments.total,
          totalExpenses: d.expenses.total,
          netProfit: d.netIncome,
        });

        // Monthly
        const m = monthlyRes.data.report;
        setQuickMonthly({
          date: `${m.year}-${monthStr}`,
          totalIncome: m.payments.total,
          totalExpenses: m.expenses.total,
          netProfit: m.netIncome,
          year: m.year,
          month: m.month,
        });

        // Yearly
        const y = yearlyRes.data.report;
        setQuickYearly({
          date: String(y.year),
          totalIncome: y.summary.payments.total,
          totalExpenses: y.summary.expenses.total,
          netProfit: y.summary.netIncome,
          year: y.year,
        });
      } catch (e: any) {
        setError(e?.message || "Failed to load summary");
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  // Load analytics for charts
  useEffect(() => {
    const load = async () => {
      try {
        setChartsLoading(true);
        const year = new Date().getFullYear();
        const res = await analyticsService.getCharts(year);
        const data = res.data;
        console.log(data);
        // Map months 1-12 to i18n keys
        const monthKey = [
          "january",
          "february",
          "march",
          "april",
          "may",
          "june",
          "july",
          "august",
          "september",
          "october",
          "november",
          "december",
        ];
        setMonthlyData(
          data.monthly.map((m) => ({
            month: monthKey[(m.month - 1) % 12],
            income: m.income,
            expenses: m.expenses,
            profit: m.profit,
          }))
        );
        console.log(monthlyData);
        setIncomeByCategory(data.incomeByCategory);
        setExpenseByCategory(data.expenseByCategory);
      } catch (e: any) {
        toast({
          variant: "destructive",
          title: t("loadFailed") || "Failed to load charts",
          description: e?.message || "",
        });
      } finally {
        setChartsLoading(false);
      }
    };
    load();
  }, [t]);

  if (loading) {
    return <Loading labelKey="loading" />;
  }
  if (error) {
    return <div className="text-center text-destructive py-8">{error}</div>;
  }

  return (
    <div className="space-y-6" dir={i18n.dir()}>
      {/* Header Controls */}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">{t("overview")}</TabsTrigger>
          <TabsTrigger value="analytics">{t("analytics")}</TabsTrigger>
          <TabsTrigger value="income">{t("income")}</TabsTrigger>
          <TabsTrigger value="expenses">{t("reportsExpensesCat")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("totalTransactions")}
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {(yearSummary?.paymentsCount ?? 0) +
                        (yearSummary?.expensesCount ?? 0)}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-secondary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("profit")}
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(yearSummary?.netIncome ?? 0)} {t("sdg")}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("reportsExpenses")}
                    </p>
                    <p className="text-2xl font-bold text-destructive">
                      {formatCurrency(yearSummary?.expenses ?? 0)} {t("sdg")}
                    </p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-destructive" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("totalIncome")}
                    </p>
                    <p className="text-2xl font-bold text-success">
                      {formatCurrency(yearSummary?.payments ?? 0)} {t("sdg")}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-success" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Reports - Live (Daily/Monthly/Yearly) */}
          <Card>
            <CardHeader
              className={`flex items-center justify-between ${
                isRTL ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <CardTitle className={isRTL ? "text-right" : undefined}>
                {t("quickReports")}
              </CardTitle>
              <Button
                variant="outline"
                className="m-5"
                onClick={() => setCustomOpen(true)}
              >
                <FileText className="h-4 w-4 mr-2" />
                {t("createNewReport")}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {/* Daily */}
                <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getReportIcon("daily")}
                      <h3 className="font-medium text-sm">
                        {t("financialDaily")}
                      </h3>
                    </div>
                    <Badge className={getReportColor("daily")}>
                      {t("daily")}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("period")}:
                      </span>
                      <span>{quickDaily?.date ?? "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("income")}:
                      </span>
                      <span className="text-success">
                        +{formatCurrency(quickDaily?.totalIncome ?? 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("reportsExpensesCat")}:
                      </span>
                      <span className="text-destructive">
                        -{formatCurrency(quickDaily?.totalExpenses ?? 0)}
                      </span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>{t("profit")}:</span>
                      <span className="text-primary">
                        {formatCurrency(quickDaily?.netProfit ?? 0)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      disabled={!quickDaily?.date}
                      onClick={() => {
                        if (!quickDaily?.date) return;
                        reportsService.viewDailyPdf(quickDaily.date);
                      }}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      {t("view")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      disabled={downloading.daily || !quickDaily?.date}
                      onClick={async () => {
                        if (!quickDaily?.date) return;
                        try {
                          setDownloading((s) => ({ ...s, daily: true }));
                          await reportsService.downloadDailyPdf(
                            quickDaily.date
                          );
                        } catch (err: any) {
                          toast({
                            variant: "destructive",
                            title: t("downloadFailed") || "Download failed",
                            description: err?.message || "",
                          });
                        } finally {
                          setDownloading((s) => ({ ...s, daily: false }));
                        }
                      }}
                    >
                      {downloading.daily ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Download className="h-3 w-3 mr-1" />
                      )}
                      {t("download")}
                    </Button>
                  </div>
                </div>

                {/* Monthly */}
                <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getReportIcon("monthly")}
                      <h3 className="font-medium text-sm">
                        {t("financialMonthly")}
                      </h3>
                    </div>
                    <Badge className={getReportColor("monthly")}>
                      {t("monthly")}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("period")}:
                      </span>
                      <span>{quickMonthly?.date ?? "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("income")}:
                      </span>
                      <span className="text-success">
                        +{formatCurrency(quickMonthly?.totalIncome ?? 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("reportsExpensesCat")}:
                      </span>
                      <span className="text-destructive">
                        -{formatCurrency(quickMonthly?.totalExpenses ?? 0)}
                      </span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>{t("profit")}:</span>
                      <span className="text-primary">
                        {formatCurrency(quickMonthly?.netProfit ?? 0)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      disabled={!(quickMonthly?.year && quickMonthly?.month)}
                      onClick={() => {
                        if (!(quickMonthly?.year && quickMonthly?.month))
                          return;
                        reportsService.viewMonthlyPdf(
                          quickMonthly.year,
                          quickMonthly.month
                        );
                      }}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      {t("view")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      disabled={
                        downloading.monthly ||
                        !(quickMonthly?.year && quickMonthly?.month)
                      }
                      onClick={async () => {
                        if (!(quickMonthly?.year && quickMonthly?.month))
                          return;
                        try {
                          setDownloading((s) => ({ ...s, monthly: true }));
                          await reportsService.downloadMonthlyPdf(
                            quickMonthly.year,
                            quickMonthly.month
                          );
                        } catch (err: any) {
                          toast({
                            variant: "destructive",
                            title: t("downloadFailed") || "Download failed",
                            description: err?.message || "",
                          });
                        } finally {
                          setDownloading((s) => ({ ...s, monthly: false }));
                        }
                      }}
                    >
                      {downloading.monthly ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Download className="h-3 w-3 mr-1" />
                      )}
                      {t("download")}
                    </Button>
                  </div>
                </div>

                {/* Yearly */}
                <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getReportIcon("yearly")}
                      <h3 className="font-medium text-sm">
                        {t("financialYearly")}
                      </h3>
                    </div>
                    <Badge className={getReportColor("yearly")}>
                      {t("yearly")}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("period")}:
                      </span>
                      <span>{quickYearly?.date ?? "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("income")}:
                      </span>
                      <span className="text-success">
                        +{formatCurrency(quickYearly?.totalIncome ?? 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("reportsExpensesCat")}:
                      </span>
                      <span className="text-destructive">
                        -{formatCurrency(quickYearly?.totalExpenses ?? 0)}
                      </span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>{t("profit")}:</span>
                      <span className="text-primary">
                        {formatCurrency(quickYearly?.netProfit ?? 0)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      disabled={!quickYearly?.year}
                      onClick={() => {
                        if (!quickYearly?.year) return;
                        reportsService.viewYearlyPdf(quickYearly.year);
                      }}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      {t("view")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      disabled={downloading.yearly || !quickYearly?.year}
                      onClick={async () => {
                        if (!quickYearly?.year) return;
                        try {
                          setDownloading((s) => ({ ...s, yearly: true }));
                          await reportsService.downloadYearlyPdf(
                            quickYearly.year
                          );
                        } catch (err: any) {
                          toast({
                            variant: "destructive",
                            title: t("downloadFailed") || "Download failed",
                            description: err?.message || "",
                          });
                        } finally {
                          setDownloading((s) => ({ ...s, yearly: false }));
                        }
                      }}
                    >
                      {downloading.yearly ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Download className="h-3 w-3 mr-1" />
                      )}
                      {t("download")}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>

            <Dialog open={customOpen} onOpenChange={setCustomOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("createNewReport")}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        {t("fromDate") || "From date"}
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between"
                          >
                            {fromDate
                              ? fromDate.toISOString().slice(0, 10)
                              : t("pickADate") || "Pick a date"}
                            <Calendar className="h-4 w-4 opacity-60" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-[280px] h-[340px] p-0"
                          align="start"
                          side="top"
                          avoidCollisions={false}
                        >
                          <CalendarPicker
                            mode="single"
                            selected={fromDate}
                            onSelect={setFromDate}
                            initialFocus
                            className="h-full w-full"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        {t("toDate") || "To date"}
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between"
                          >
                            {toDate
                              ? toDate.toISOString().slice(0, 10)
                              : t("pickADate") || "Pick a date"}
                            <Calendar className="h-4 w-4 opacity-60" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-[280px] h-[340px]  p-0"
                          align="start"
                          side="top"
                          avoidCollisions={false}
                        >
                          <CalendarPicker
                            mode="single"
                            selected={toDate}
                            onSelect={setToDate}
                            initialFocus
                            className="h-full w-full"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFromDate(undefined);
                        setToDate(undefined);
                        setCustomOpen(false);
                      }}
                    >
                      {t("cancel")}
                    </Button>
                    <Button
                      disabled={!fromDate || !toDate || downloadingCustom}
                      onClick={async () => {
                        if (!fromDate || !toDate) return;
                        const from = fromDate.toISOString().slice(0, 10);
                        const to = toDate.toISOString().slice(0, 10);
                        if (from > to) {
                          toast({
                            variant: "destructive",
                            title: t("invalidRange") || "Invalid range",
                          });
                          return;
                        }
                        try {
                          setDownloadingCustom(true);
                          await reportsService.downloadCustomRangePdf(from, to);
                          setCustomOpen(false);
                        } catch (err: any) {
                          toast({
                            variant: "destructive",
                            title: t("downloadFailed") || "Download failed",
                            description: err?.message || "",
                          });
                        } finally {
                          setDownloadingCustom(false);
                        }
                      }}
                    >
                      {downloadingCustom ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      {t("download")}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Charts Section */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("trendIncomeExpenses")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="month"
                        tickFormatter={(m) => t(`months.${m}`)}
                      />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="income"
                        stackId="1"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.8}
                      />
                      <Area
                        type="monotone"
                        dataKey="expenses"
                        stackId="2"
                        stroke="#ef4444"
                        fill="#ef4444"
                        fillOpacity={0.8}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("incomeDistributionBySource")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Pie
                        data={incomeByCategory.map((c) => ({
                          name: c.category,
                          value: c.percentage,
                          amount: c.amount,
                          fill: "#10b981",
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {incomeByCategory.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              [
                                "#10b981",
                                "#3b82f6",
                                "#f59e0b",
                                "#ef4444",
                                "#8b5cf6",
                                "#06b6d4",
                              ][index % 6]
                            }
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>{t("performanceIndicators")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t("monthlyGrowthRate")}</span>
                    <span className="font-medium text-success">+12.5%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t("profitMargin")}</span>
                    <span className="font-medium text-primary">66.4%</span>
                  </div>
                  <Progress value={66} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t("liquidityRate")}</span>
                    <span className="font-medium text-warning">85.2%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("incomeAnalysisByCategory")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {incomeByCategory.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-success rounded-full" />
                        <span className="font-medium text-sm">
                          {t(categoryKeyMap[item.category] || item.category)}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-success">
                          {formatCurrency(item.amount)} {t("sdg")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.percentage}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("monthlyIncomeTrend")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="month"
                        tickFormatter={(m) => t(`months.${m}`)}
                      />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="income"
                        stroke="#10b981"
                        strokeWidth={3}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("expenseAnalysisByCategory")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {expenseByCategory.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-destructive rounded-full" />
                        <span className="font-medium text-sm">
                          {t(categoryKeyMap[item.category] || item.category)}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-destructive">
                          {formatCurrency(item.amount)} {t("sdg")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.percentage}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("monthlyExpenseComparison")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="month"
                        tickFormatter={(m) => t(`months.${m}`)}
                      />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="expenses" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
