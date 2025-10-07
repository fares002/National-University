import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  CreditCard,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import Loading from "@/components/common/Loading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { reportsService, DashboardData } from "@/services/reportsService";
import { useNavigate } from "react-router-dom";
import i18n from "@/lib/i18n";
import { formatCurrency, formatNumber } from "@/lib/utils";

function StatsCard({
  title,
  value,
  valueUSD,
  icon: Icon,
  trend,
  trendValue,
  color,
  formatType = "currency",
  showTrend = true,
}: {
  title: string;
  value: number;
  valueUSD?: number;
  icon: React.ElementType;
  trend: "up" | "down";
  trendValue?: string;
  color: string;
  formatType?: "currency" | "number";
  showTrend?: boolean;
}) {
  const { t } = useTranslation();
  const display =
    formatType === "currency"
      ? `${formatCurrency(value)} ${t("sdg")}`
      : formatNumber(value);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {title}
            </p>
            <p className="text-2xl font-bold text-foreground">{display}</p>
            {valueUSD !== undefined && formatType === "currency" && (
              <p className="text-xs font-medium text-muted-foreground mt-0.5">
                {formatCurrency(valueUSD)} {t("usd")}
              </p>
            )}
            {showTrend && (
              <div className="flex items-center mt-2">
                {trend === "up" ? (
                  <ArrowUpRight className="h-4 w-4 text-success mr-1" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-destructive mr-1" />
                )}
                {trendValue && (
                  <span
                    className={`text-sm font-medium ${
                      trend === "up" ? "text-success" : "text-destructive"
                    }`}
                  >
                    {trendValue}
                  </span>
                )}
                <span className="text-sm text-muted-foreground mr-1">
                  {t("fromLastMonth")}
                </span>
              </div>
            )}
          </div>
          <div
            className={`h-12 w-12 rounded-lg ${color} flex items-center justify-center`}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Arabic translation mappings
  const feeTypeMap: Record<string, string> = {
    NEW_YEAR: "رسوم سنة جديدة",
    SUPPLEMENTARY: "رسوم ملحق",
    TRAINING: "رسوم تدريب",
    STUDENT_SERVICES: "رسوم خدمات طلابية",
    OTHER: "أخرى",
    EXAM: "رسوم امتحان",
  };

  const categoryMapping: Record<string, string> = {
    "Fixed Assets": "الأصول الثابتة",
    "Part-time Professors": "الأساتذة المتعاونون",
    "Rent of study and administrative premises": "ايجار مقرات الدراسه والادارة",
    Salaries: "الرواتب",
    "Student Fees Refund": "رد رسوم الطلاب",
    Advances: "السلف",
    Bonuses: "المكافآت",
    "General & Administrative Expenses": "المصروفات العامة والإدارية",
    "General and Administrative Expenses": "المصروفات العامة والإدارية",
    "Library Supplies": "مستلزمات المكتبة",
    "Lab Consumables": "مستهلكات المعامل",
    "Student Training": "تدريب طلاب",
    "Saudi-Egyptian Company": "الشركة السعودية المصرية",
  };

  const paymentMethodMap: Record<string, string> = {
    CASH: "نقداً",
    TRANSFER: "تحويل",
    CHEQUE: "شيك",
  };
  const getFeeTypeInArabic = (feeType: string) =>
    feeTypeMap[feeType] || feeType;
  const getCategoryInArabic = (category: string) =>
    categoryMapping[category] || category;
  const getPaymentMethodInArabic = (paymentMethod: string) =>
    paymentMethodMap[paymentMethod] || paymentMethod;
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await reportsService.getDashboardReport();
        setDashboardData(response.data.dashboard);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard data");
        console.error("Dashboard API error:", err);
      } finally {
        setLoading(false);
      }
    };
    const getPaymentMethodInArabic = (paymentMethod: string) => {
      return paymentMethodMap[paymentMethod] || paymentMethod;
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <Loading labelKey="loadingDashboard" />;
  }

  if (error || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive mb-4">
            {error || "No data available"}
          </p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="bg-gradient-primary rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">{t("welcomeMessage")}</h1>
        <p className="opacity-90">{t("welcomeSubtitle")}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title={`${t("totalRevenue")} (${t("monthly")})`}
          value={dashboardData.overview.currentMonth.payments.total}
          valueUSD={dashboardData.overview.currentMonth.payments.totalUSD}
          icon={TrendingUp}
          trend={
            dashboardData.overview.comparison.paymentTrend === "increase"
              ? "up"
              : "down"
          }
          trendValue={`${
            dashboardData.overview.comparison.paymentChange > 0 ? "+" : ""
          }${dashboardData.overview.comparison.paymentChange.toFixed(1)}%`}
          color="bg-gradient-success"
        />
        <StatsCard
          title={`${t("totalExpenses")} (${t("monthly")})`}
          value={dashboardData.overview.currentMonth.expenses.total}
          valueUSD={dashboardData.overview.currentMonth.expenses.totalUSD}
          icon={TrendingDown}
          trend={
            dashboardData.overview.comparison.expenseTrend === "increase"
              ? "down"
              : "up"
          }
          trendValue={`${
            dashboardData.overview.comparison.expenseChange > 0 ? "+" : ""
          }${dashboardData.overview.comparison.expenseChange.toFixed(1)}%`}
          color="bg-gradient-secondary"
        />
        <StatsCard
          title={`${t("netProfit")} (${t("monthly")})`}
          value={dashboardData.overview.currentMonth.netProfit}
          valueUSD={dashboardData.overview.currentMonth.netProfitUSD}
          icon={DollarSign}
          trend={
            dashboardData.overview.currentMonth.netProfit >
            dashboardData.overview.previousMonth.netProfit
              ? "up"
              : "down"
          }
          trendValue={
            dashboardData.overview.previousMonth.netProfit === 0
              ? "100%"
              : `${(
                  ((dashboardData.overview.currentMonth.netProfit -
                    dashboardData.overview.previousMonth.netProfit) /
                    dashboardData.overview.previousMonth.netProfit) *
                  100
                ).toFixed(1)}%`
          }
          color="bg-gradient-primary"
        />

        <StatsCard
          title={t("monthlyTransactionsCount")}
          value={dashboardData.overview.currentMonth.totalTransactions}
          icon={Users}
          trend="up"
          color="bg-accent"
          formatType="number"
          showTrend={false}
        />
      </div>

      {/* Recent Activities */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Last Payment */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              {t("lastPayment")}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/payments")}
            >
              {t("viewAllPayments")}
            </Button>
          </CardHeader>
          <CardContent>
            {dashboardData.recentActivity.lastPayment ? (
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-lg">
                      {dashboardData.recentActivity.lastPayment.studentName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getFeeTypeInArabic(
                        dashboardData.recentActivity.lastPayment.feeType
                      )}{" "}
                      •{" "}
                      {getPaymentMethodInArabic(
                        dashboardData.recentActivity.lastPayment.paymentMethod
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(
                        dashboardData.recentActivity.lastPayment.paymentDate
                      ).toLocaleDateString("ar-SD")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-2xl text-success">
                      +
                      {formatCurrency(
                        dashboardData.recentActivity.lastPayment.amount
                      )}{" "}
                      {t("sdg")}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-muted-foreground">No recent payments</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Last Expense */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              {t("lastExpense")}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/expenses")}
            >
              {t("viewAllExpenses")}
            </Button>
          </CardHeader>
          <CardContent>
            {dashboardData.recentActivity.lastExpense ? (
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-lg">
                      {dashboardData.recentActivity.lastExpense.description}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getCategoryInArabic(
                        dashboardData.recentActivity.lastExpense.category
                      )}{" "}
                      • {dashboardData.recentActivity.lastExpense.vendor}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(
                        dashboardData.recentActivity.lastExpense.date
                      ).toLocaleDateString("ar-SD")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-2xl text-destructive">
                      -
                      {formatCurrency(
                        dashboardData.recentActivity.lastExpense.amount
                      )}{" "}
                      {t("sdg")}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-muted-foreground">No recent expenses</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t("quickActions")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
            <Button
              className="h-20 flex-col gap-2 "
              variant="outline"
              onClick={() => navigate("/payments")}
            >
              <CreditCard className="h-6 w-6" />
              {t("registerPayment")}
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2 "
              onClick={() => navigate("/expenses")}
            >
              <Receipt className="h-6 w-6" />
              {t("registerExpense")}
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => navigate("/reports?period=daily")}
            >
              <DollarSign className="h-6 w-6" />
              {t("generateDailyReport")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
