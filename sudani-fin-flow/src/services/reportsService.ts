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

  // Financial summary: thisMonth, thisQuarter, thisYear
  async getSummary(): Promise<{
    status: string;
    data: {
      message: string;
      summary: {
        thisMonth: {
          payments: number;
          expenses: number;
          netIncome: number;
          paymentsCount: number;
          expensesCount: number;
        };
        thisQuarter: {
          payments: number;
          expenses: number;
          netIncome: number;
          paymentsCount: number;
          expensesCount: number;
          quarter: number;
        };
        thisYear: {
          payments: number;
          expenses: number;
          netIncome: number;
          paymentsCount: number;
          expensesCount: number;
          year: number;
        };
      };
    };
  }> {
    try {
      const response = await api.get("/reports/summary");
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Daily report (by date YYYY-MM-DD)
  async getDailyReport(date: string): Promise<{
    status: string;
    data: {
      message: string;
      report: {
        date: string;
        payments: { total: number; count: number };
        expenses: { total: number; count: number };
        netIncome: number;
      };
    };
  }> {
    try {
      const response = await api.get(`/reports/daily/${date}`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Monthly report (by year, month 1-12)
  async getMonthlyReport(
    year: number,
    month: number
  ): Promise<{
    status: string;
    data: {
      message: string;
      report: {
        year: number;
        month: number;
        monthName: string;
        payments: { total: number; count: number };
        expenses: { total: number; count: number };
        netIncome: number;
      };
    };
  }> {
    try {
      const response = await api.get(`/reports/monthly/${year}/${month}`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Yearly report (by year)
  async getYearlyReport(year: number): Promise<{
    status: string;
    data: {
      message: string;
      report: {
        year: number;
        summary: {
          payments: { total: number; count: number };
          expenses: { total: number; count: number };
          netIncome: number;
        };
      };
    };
  }> {
    try {
      const response = await api.get(`/reports/yearly/${year}`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Helpers to trigger PDF downloads
  async downloadDailyPdf(date: string): Promise<void> {
    await this.downloadPdf(
      `/reports/daily/${date}/pdf`,
      `daily-report-${date}.pdf`
    );
  }

  async downloadMonthlyPdf(year: number, month: number): Promise<void> {
    const mm = String(month).padStart(2, "0");
    await this.downloadPdf(
      `/reports/monthly/${year}/${month}/pdf`,
      `monthly-report-${year}-${mm}.pdf`
    );
  }

  async downloadYearlyPdf(year: number): Promise<void> {
    await this.downloadPdf(
      `/reports/yearly/${year}/pdf`,
      `yearly-report-${year}.pdf`
    );
  }

  async downloadCustomRangePdf(from: string, to: string): Promise<void> {
    await this.downloadPdf(
      `/reports/custom/pdf?from=${encodeURIComponent(
        from
      )}&to=${encodeURIComponent(to)}`,
      `custom-report-${from}-to-${to}.pdf`
    );
  }

  // Open PDFs directly in a new browser tab (View)
  viewDailyPdf(date: string): void {
    this.openPdfInNewTab(`/reports/daily/${date}/pdf`);
  }

  viewMonthlyPdf(year: number, month: number): void {
    this.openPdfInNewTab(`/reports/monthly/${year}/${month}/pdf`);
  }

  viewYearlyPdf(year: number): void {
    this.openPdfInNewTab(`/reports/yearly/${year}/pdf`);
  }

  viewCustomRangePdf(from: string, to: string): void {
    this.openPdfInNewTab(
      `/reports/custom/pdf?from=${encodeURIComponent(
        from
      )}&to=${encodeURIComponent(to)}`
    );
  }

  private async downloadPdf(url: string, filename: string): Promise<void> {
    try {
      const response = await api.get(url, {
        responseType: "blob",
        headers: {
          Accept: "application/pdf",
          // Override default content-type header for binary GET
          "Content-Type": "",
        },
      });

      const contentType = response.headers?.["content-type"] || "";

      // If backend returned JSON (likely an error), try to read it and throw
      if (!contentType.includes("application/pdf")) {
        try {
          const text = await (response.data as Blob).text();
          const maybeJson = JSON.parse(text);
          const message =
            maybeJson?.message || maybeJson?.error || "Failed to download PDF";
          throw new Error(message);
        } catch (_) {
          throw new Error("Failed to download PDF");
        }
      }

      const blob = new Blob([response.data], { type: "application/pdf" });
      const link = document.createElement("a");
      const href = URL.createObjectURL(blob);
      link.href = href;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(href);
    } catch (error: any) {
      // Fallback: open the URL in a new tab to let the browser handle it
      try {
        this.openPdfInNewTab(url);
        return;
      } catch (_) {
        // Re-throw a clean error for UI handlers
        const apiErr = this.handleError(error);
        throw new Error(apiErr.message || "Failed to download PDF");
      }
    }
  }

  private openPdfInNewTab(url: string): void {
    const base = api.defaults.baseURL?.replace(/\/$/, "") || "";
    const absolute = url.startsWith("http") ? url : `${base}${url}`;
    window.open(absolute, "_blank", "noopener,noreferrer");
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
