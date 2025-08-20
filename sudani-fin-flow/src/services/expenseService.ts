import api from "@/lib/api";

// Define allowed expense categories as TypeScript union type
export type ExpenseCategory =
  | "Fixed Assets"
  | "Part-time Professors"
  | "Study Materials and Administration Leaves"
  | "Salaries"
  | "Student Fees Refund"
  | "Advances"
  | "Bonuses"
  | "General and Administrative Expenses"
  | "Library Supplies"
  | "Lab Consumables"
  | "Student Training"
  | "Saudi-Egyptian Company";

// Types for the expense API response
export interface Expense {
  id: string;
  amount: string;
  description: string;
  category: string; // Changed from ExpenseCategory to string to handle API responses
  vendor?: string;
  receiptUrl?: string;
  date: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    username: string;
    email: string;
  };
}

export interface ExpenseStatistics {
  daily: {
    totalAmount: number;
    operationsCount: number;
    date: string;
  };
  monthly: {
    totalAmount: number;
    operationsCount: number;
    averageDailyExpenditure: number;
    month: string;
    daysInMonth: number;
  };
}

export interface ExpensePagination {
  currentPage: number;
  totalPages: number;
  totalExpenses: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
}

export interface ExpenseResponse {
  status: string;
  data: {
    message: string;
    expenses: Expense[];
    statistics: ExpenseStatistics;
    pagination: ExpensePagination;
    cached?: boolean;
  };
}

export interface ExpenseFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  vendor?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: string;
  maxAmount?: string;
}

export interface CreateExpenseData {
  amount: string;
  description: string;
  category: string;
  vendor?: string;
  receiptUrl?: string;
  date: string;
}

export interface UpdateExpenseData {
  amount?: string;
  description?: string;
  category?: string;
  vendor?: string;
  receiptUrl?: string;
  date?: string;
}

class ExpenseService {
  /**
   * Get all expenses with filtering, pagination, and statistics
   */
  async getAllExpenses(filters: ExpenseFilters = {}): Promise<ExpenseResponse> {
    try {
      const params = new URLSearchParams();

      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());
      if (filters.search) params.append("search", filters.search);
      if (filters.category) params.append("category", filters.category);
      if (filters.vendor) params.append("vendor", filters.vendor);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.minAmount) params.append("minAmount", filters.minAmount);
      if (filters.maxAmount) params.append("maxAmount", filters.maxAmount);

      const queryString = params.toString();
      const url = `expenses${queryString ? `?${queryString}` : ""}`;

      console.log("🔍 Fetching expenses from:", url);

      const response = await api.get<ExpenseResponse>(url);
      console.log("✅ Expenses fetched successfully:", response.data);

      return response.data;
    } catch (error) {
      console.error("❌ Error fetching expenses:", error);
      throw error;
    }
  }

  /**
   * Search expenses quickly by term
   */
  async searchExpenses(
    q: string,
    page = 1,
    limit = 10
  ): Promise<{
    status: string;
    data: { expenses: Expense[]; pagination: ExpensePagination };
  }> {
    try {
      const params = new URLSearchParams();
      if (q) params.append("q", q);
      if (page) params.append("page", String(page));
      if (limit) params.append("limit", String(limit));

      const url = `expenses/search?${params.toString()}`;
      const response = await api.get<{
        status: string;
        data: { expenses: Expense[]; pagination: ExpensePagination };
      }>(url);
      return response.data;
    } catch (error) {
      console.error("❌ Error searching expenses:", error);
      throw error;
    }
  }

  /**
   * Get single expense by ID
   */
  async getExpenseById(
    id: string
  ): Promise<{ status: string; data: { expense: Expense } }> {
    try {
      console.log("🔍 Fetching expense with ID:", id);

      const response = await api.get<{
        status: string;
        data: { expense: Expense };
      }>(`expenses/${id}`);
      console.log("✅ Expense fetched successfully:", response.data);

      return response.data;
    } catch (error) {
      console.error("❌ Error fetching expense:", error);
      throw error;
    }
  }

  /**
   * Create new expense
   */
  async createExpense(
    expenseData: CreateExpenseData
  ): Promise<{ status: string; data: { expense: Expense } }> {
    try {
      console.log("🔄 Creating expense:", expenseData);

      const response = await api.post<{
        status: string;
        data: { expense: Expense };
      }>("expenses", expenseData);
      console.log("✅ Expense created successfully:", response.data);

      return response.data;
    } catch (error) {
      console.error("❌ Error creating expense:", error);
      throw error;
    }
  }

  /**
   * Update expense
   */
  async updateExpense(
    id: string,
    expenseData: UpdateExpenseData
  ): Promise<{ status: string; data: { expense: Expense } }> {
    try {
      console.log("🔄 Updating expense:", id, expenseData);

      const response = await api.patch<{
        status: string;
        data: { expense: Expense };
      }>(`expenses/${id}`, expenseData);
      console.log("✅ Expense updated successfully:", response.data);

      return response.data;
    } catch (error) {
      console.error("❌ Error updating expense:", error);
      throw error;
    }
  }

  /**
   * Delete expense
   */
  async deleteExpense(
    id: string
  ): Promise<{ status: string; data: { message: string } }> {
    try {
      console.log("🗑️ Deleting expense:", id);

      const response = await api.delete<{
        status: string;
        data: { message: string };
      }>(`expenses/${id}`);
      console.log("✅ Expense deleted successfully:", response.data);

      return response.data;
    } catch (error) {
      console.error("❌ Error deleting expense:", error);
      throw error;
    }
  }

  /**
   * Get expenses by category
   */
  async getExpensesByCategory(
    category: string,
    page = 1,
    limit = 10
  ): Promise<{
    status: string;
    data: { expenses: Expense[]; pagination: ExpensePagination };
  }> {
    try {
      console.log("🔍 Fetching expenses by category:", category);

      const response = await api.get<{
        status: string;
        data: { expenses: Expense[]; pagination: ExpensePagination };
      }>(
        `expenses/category/${encodeURIComponent(
          category
        )}?page=${page}&limit=${limit}`
      );
      console.log("✅ Category expenses fetched successfully:", response.data);

      return response.data;
    } catch (error) {
      console.error("❌ Error fetching category expenses:", error);
      throw error;
    }
  }

  /**
   * Get expenses by vendor
   */
  async getExpensesByVendor(
    vendor: string,
    page = 1,
    limit = 10
  ): Promise<{
    status: string;
    data: { expenses: Expense[]; pagination: ExpensePagination };
  }> {
    try {
      console.log("🔍 Fetching expenses by vendor:", vendor);

      const response = await api.get<{
        status: string;
        data: { expenses: Expense[]; pagination: ExpensePagination };
      }>(
        `expenses/vendor/${encodeURIComponent(
          vendor
        )}?page=${page}&limit=${limit}`
      );
      console.log("✅ Vendor expenses fetched successfully:", response.data);

      return response.data;
    } catch (error) {
      console.error("❌ Error fetching vendor expenses:", error);
      throw error;
    }
  }
}

// Export singleton instance
const expenseService = new ExpenseService();
export default expenseService;
