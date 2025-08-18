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

// Removed mock reports; we'll fetch live daily/monthly/yearly reports

// Will be loaded from API
// const incomeByCategory ... moved to state
// const expenseByCategory ... moved to state

// Chart data
// Will be loaded from API
// const monthlyData ... moved to state

// Pie chart data derived from incomeByCategory state

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
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");
  const [selectedReport, setSelectedReport] = useState("financial");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ar-SD").format(amount);
  };

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
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-4">
          <Select value={selectedReport} onValueChange={setSelectedReport}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t("reportType")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="financial">{t("financialReports")}</SelectItem>
              <SelectItem value="income">{t("income")}</SelectItem>
              <SelectItem value="expense">{t("reportsExpensesCat")}</SelectItem>
              <SelectItem value="cashflow">{t("cashFlowReport")}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t("timePeriod")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">{t("daily")}</SelectItem>
              <SelectItem value="weekly">{t("weekly")}</SelectItem>
              <SelectItem value="monthly">{t("monthly")}</SelectItem>
              <SelectItem value="yearly">{t("yearly")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            {t("filter")}
          </Button>
          <Button variant="outline">
            <PrinterIcon className="h-4 w-4 mr-2" />
            {t("print")}
          </Button>
          <Button className="bg-gradient-primary hover:opacity-90">
            <Download className="h-4 w-4 mr-2" />
            {t("export")}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">{t("overview")}</TabsTrigger>
          <TabsTrigger value="analytics">{t("analytics")}</TabsTrigger>
          <TabsTrigger value="income">{t("income")}</TabsTrigger>
          <TabsTrigger value="expenses">{t("reportsExpensesCat")}</TabsTrigger>
          <TabsTrigger value="reports">{t("reports")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                    <div className="flex items-center mt-1">
                      <TrendingUp className="h-4 w-4 text-success mr-1" />
                      <span className="text-sm text-success">+12.5%</span>
                    </div>
                  </div>
                  <DollarSign className="h-8 w-8 text-success" />
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
                    <div className="flex items-center mt-1">
                      <TrendingDown className="h-4 w-4 text-success mr-1" />
                      <span className="text-sm text-success">-3.2%</span>
                    </div>
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
                      {t("profit")}
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(yearSummary?.netIncome ?? 0)} {t("sdg")}
                    </p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="h-4 w-4 text-success mr-1" />
                      <span className="text-sm text-success">+18.7%</span>
                    </div>
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
                      {t("totalTransactions")}
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {(yearSummary?.paymentsCount ?? 0) +
                        (yearSummary?.expensesCount ?? 0)}
                    </p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="h-4 w-4 text-success mr-1" />
                      <span className="text-sm text-success">+45</span>
                    </div>
                  </div>
                  <BarChart3 className="h-8 w-8 text-secondary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Reports - Live (Daily/Monthly/Yearly) */}
          <Card>
            <CardHeader>
              <CardTitle>{t("quickReports")}</CardTitle>
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
                          {t(item.category)}
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
                          {t(item.category)}
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

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{t("savedReportsLibrary")}</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t("searchReportsPlaceholder")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Button variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    {t("createNewReport")}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("reportTypeHeader")}</TableHead>
                    <TableHead>{t("createdAt")}</TableHead>
                    <TableHead>{t("statusLabel")}</TableHead>
                    <TableHead>{t("sizeLabel")}</TableHead>
                    <TableHead>{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailedReports
                    .filter(
                      (report) =>
                        searchTerm === "" ||
                        report.type
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase())
                    )
                    .map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">
                          {t(report.type)}
                        </TableCell>
                        <TableCell>{report.date}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              report.status === "completed"
                                ? "default"
                                : "secondary"
                            }
                            className={
                              report.status === "completed" ? "bg-success" : ""
                            }
                          >
                            {t(report.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>{report.size}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <PrinterIcon className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
