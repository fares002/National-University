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

function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  color,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  trend: "up" | "down";
  trendValue: string;
  color: string;
}) {
  const { t } = useTranslation();
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ar-SD", {
      style: "currency",
      currency: "SDG",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {title}
            </p>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(value)}
            </p>
            <div className="flex items-center mt-2">
              {trend === "up" ? (
                <ArrowUpRight className="h-4 w-4 text-success mr-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-destructive mr-1" />
              )}
              <span
                className={`text-sm font-medium ${
                  trend === "up" ? "text-success" : "text-destructive"
                }`}
              >
                {trendValue}
              </span>
              <span className="text-sm text-muted-foreground mr-1">
                {t("fromLastMonth")}
              </span>
            </div>
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
    // Support legacy '&' and new 'and' values
    "Study Materials & Administration Leaves": "مواد دراسية وإجازات إدارية",
    "Study Materials and Administration Leaves": "مواد دراسية وإجازات إدارية",
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

  // Helper functions to get Arabic translations
  const getFeeTypeInArabic = (feeType: string) => {
    return feeTypeMap[feeType] || feeType;
  };

  const getCategoryInArabic = (category: string) => {
    return categoryMapping[category] || category;
  };

  const getPaymentMethodInArabic = (paymentMethod: string) => {
    return paymentMethodMap[paymentMethod] || paymentMethod;
  };

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
          title={t("totalRevenue")}
          value={dashboardData.overview.currentMonth.payments.total}
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
          title={t("totalExpenses")}
          value={dashboardData.overview.currentMonth.expenses.total}
          icon={TrendingDown}
          trend={
            dashboardData.overview.comparison.expenseTrend === "increase"
              ? "up"
              : "down"
          }
          trendValue={`${
            dashboardData.overview.comparison.expenseChange > 0 ? "+" : ""
          }${dashboardData.overview.comparison.expenseChange.toFixed(1)}%`}
          color="bg-gradient-secondary"
        />
        <StatsCard
          title={t("netProfit")}
          value={dashboardData.overview.currentMonth.netProfit}
          icon={DollarSign}
          trend={
            dashboardData.overview.currentMonth.netProfit >
            dashboardData.overview.previousMonth.netProfit
              ? "up"
              : "down"
          }
          trendValue={`${(
            ((dashboardData.overview.currentMonth.netProfit -
              dashboardData.overview.previousMonth.netProfit) /
              dashboardData.overview.previousMonth.netProfit) *
            100
          ).toFixed(1)}%`}
          color="bg-gradient-primary"
        />
        <StatsCard
          title={t("dailyTransactions")}
          value={dashboardData.todayMetrics.totalTransactions}
          icon={Users}
          trend="up"
          trendValue={`Today: ${dashboardData.todayMetrics.totalTransactions}`}
          color="bg-accent"
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
            <Button variant="outline" size="sm">
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
                      {new Intl.NumberFormat("ar-SD").format(
                        dashboardData.recentActivity.lastPayment.amount
                      )}{" "}
                      ج.س
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
            <Button variant="outline" size="sm">
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
                      {new Intl.NumberFormat("ar-SD").format(
                        dashboardData.recentActivity.lastExpense.amount
                      )}{" "}
                      ج.س
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
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            <Button className="h-20 flex-col gap-2 bg-gradient-primary hover:opacity-90">
              <CreditCard className="h-6 w-6" />
              {t("registerPayment")}
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Receipt className="h-6 w-6" />
              {t("registerExpense")}
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Users className="h-6 w-6" />
              {t("registerStudent")}
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <DollarSign className="h-6 w-6" />
              {t("generateDailyReport")}
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <TrendingUp className="h-6 w-6" />
              {t("viewCashFlow")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
