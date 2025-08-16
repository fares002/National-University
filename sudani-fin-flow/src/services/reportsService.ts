import api from "@/lib/api";

// Types for the dashboard report API response
export interface DashboardData {
  overview: {
    currentMonth: {
      payments: {
        total: number;
        count: number;
      };
      expenses: {
        total: number;
        count: number;
      };
      netProfit: number;
      totalTransactions: number;
    };
    previousMonth: {
      payments: {
        total: number;
        count: number;
      };
      expenses: {
        total: number;
        count: number;
      };
      netProfit: number;
    };
    comparison: {
      paymentChange: number;
      expenseChange: number;
      paymentTrend: "increase" | "decrease";
      expenseTrend: "increase" | "decrease";
    };
  };
  recentActivity: {
    lastPayment: {
      id: string;
      amount: number;
      studentName: string;
      feeType: string;
      paymentMethod: string;
      paymentDate: string;
      receiptNumber: string;
      timeSince: number;
    } | null;
    lastExpense: {
      id: string;
      amount: number;
      category: string;
      vendor: string;
      description: string;
      date: string;
      timeSince: number;
    } | null;
  };
  todayMetrics: {
    totalTransactions: number;
    paymentsCount: number;
    expensesCount: number;
  };
  dailyBreakdown: Array<{
    date: string;
    payments: {
      total: number;
      count: number;
    };
    expenses: {
      total: number;
      count: number;
    };
    netIncome: number;
    totalTransactions: number;
  }>;
  metadata: {
    currentMonth: string;
    previousMonth: string;
    generatedAt: string;
    daysInCurrentMonth: number;
  };
}

export interface DashboardResponse {
  status: string;
  data: {
    message: string;
    dashboard: DashboardData;
    cached?: boolean;
  };
}

export interface ApiError {
  status: string;
  message: string;
  errors?: Record<string, string[]>;
}

class ReportsService {
  async getDashboardReport(): Promise<DashboardResponse> {
    try {
      const response = await api.get<DashboardResponse>("/reports/dashboard");
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): ApiError {
    if (error.response?.data) {
      return error.response.data;
    }

    return {
      status: "error",
      message: error.message || "An unexpected error occurred",
    };
  }
}

export const reportsService = new ReportsService();
