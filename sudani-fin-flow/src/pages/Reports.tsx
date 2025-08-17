import React, { useState } from "react";
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

// Mock data for reports
const mockReports = [
  {
    id: "1",
    name: "financialDaily",
    type: "daily",
    date: "2024-01-15",
    totalIncome: 450000,
    totalExpenses: 125000,
    netProfit: 325000,
    transactions: 28,
  },
  {
    id: "2",
    name: "financialWeekly",
    type: "weekly",
    date: "2024-01-08 - 2024-01-14",
    totalIncome: 2850000,
    totalExpenses: 875000,
    netProfit: 1975000,
    transactions: 156,
  },
  {
    id: "3",
    name: "financialMonthly",
    type: "monthly",
    date: "2023-12",
    totalIncome: 12500000,
    totalExpenses: 4200000,
    netProfit: 8300000,
    transactions: 678,
  },
];

const incomeByCategory = [
  { category: "feeTypeNewYear", amount: 8500000, percentage: 68 },
  { category: "feeTypeSupplementary", amount: 2200000, percentage: 18 },
  { category: "laboratory", amount: 1100000, percentage: 9 },
  { category: "feeTypeStudentServices", amount: 700000, percentage: 5 },
];

const expenseByCategory = [
  { category: "operationalExpenses", amount: 1800000, percentage: 43 },
  { category: "administrativeExpenses", amount: 1250000, percentage: 30 },
  { category: "utilities", amount: 750000, percentage: 18 },
  { category: "externalServices", amount: 400000, percentage: 9 },
];

// Chart data
const monthlyData = [
  { month: "january", income: 12500000, expenses: 4200000, profit: 8300000 },
  { month: "february", income: 11800000, expenses: 3950000, profit: 7850000 },
  { month: "march", income: 13200000, expenses: 4600000, profit: 8600000 },
  { month: "april", income: 14100000, expenses: 4800000, profit: 9300000 },
  { month: "may", income: 12900000, expenses: 4300000, profit: 8600000 },
  { month: "june", income: 13800000, expenses: 4700000, profit: 9100000 },
];

const pieChartData = [
  { name: "feeTypeNewYear", value: 68, amount: 8500000, fill: "#10b981" },
  { name: "feeTypeSupplementary", value: 18, amount: 2200000, fill: "#3b82f6" },
  { name: "laboratory", value: 9, amount: 1100000, fill: "#f59e0b" },
  { name: "feeTypeStudentServices", value: 5, amount: 700000, fill: "#ef4444" },
];

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
                      {formatCurrency(12500000)} {t("sdg")}
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
                      {formatCurrency(4200000)} {t("sdg")}
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
                      {formatCurrency(8300000)} {t("sdg")}
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
                    <p className="text-2xl font-bold text-foreground">678</p>
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

          {/* Quick Reports */}
          <Card>
            <CardHeader>
              <CardTitle>{t("quickReports")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {mockReports.map((report) => (
                  <div
                    key={report.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getReportIcon(report.type)}
                        <h3 className="font-medium text-sm">
                          {t(report.name)}
                        </h3>
                      </div>
                      <Badge className={getReportColor(report.type)}>
                        {report.type === "daily" && t("daily")}
                        {report.type === "weekly" && t("weekly")}
                        {report.type === "monthly" && t("monthly")}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {t("period")}:
                        </span>
                        <span>{report.date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {t("income")}:
                        </span>
                        <span className="text-success">
                          +{formatCurrency(report.totalIncome)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {t("reportsExpensesCat")}:
                        </span>
                        <span className="text-destructive">
                          -{formatCurrency(report.totalExpenses)}
                        </span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>{t("profit")}:</span>
                        <span className="text-primary">
                          {formatCurrency(report.netProfit)}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="h-3 w-3 mr-1" />
                        {t("view")}
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Download className="h-3 w-3 mr-1" />
                        {t("download")}
                      </Button>
                    </div>
                  </div>
                ))}
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
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
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
