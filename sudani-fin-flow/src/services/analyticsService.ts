import api from "@/lib/api";

export interface MonthlyPoint {
  month: number; // 1-12
  income: number;
  expenses: number;
  profit: number;
}

export interface CategoryPoint {
  category: string; // i18n key or raw
  amount: number;
  percentage: number; // 0-100
}

export interface ChartsAnalyticsResponse {
  status: string;
  data: {
    year: number;
    monthly: MonthlyPoint[];
    incomeByCategory: CategoryPoint[];
    expenseByCategory: CategoryPoint[];
  };
}

class AnalyticsService {
  async getCharts(year?: number): Promise<ChartsAnalyticsResponse> {
    const qs = typeof year === "number" ? `?year=${year}` : "";
    const res = await api.get(`/analytics/charts${qs}`);
    return res.data as ChartsAnalyticsResponse;
  }
}

export const analyticsService = new AnalyticsService();
