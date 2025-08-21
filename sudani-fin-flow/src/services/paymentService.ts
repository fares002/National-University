import api from "@/lib/api";

// Types for the payment API response
export interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  feeType:
    | "NEW_YEAR"
    | "SUPPLEMENTARY"
    | "LAB"
    | "STUDENT_SERVICES"
    | "OTHER"
    | "EXAM"
    | "TRINING";
  amount: number;
  receiptNumber: string;
  paymentMethod: "CASH" | "TRANSFER" | "CHEQUE";
  paymentDate: string;
  notes?: string;
  createdBy: {
    id: string;
    username: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PaymentPagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaymentResponse {
  status: string;
  data: {
    payments: Payment[];
    pagination: PaymentPagination;
    cached?: boolean;
    statistics?: PaymentStatistics;
  };
}

export interface PaymentStatistics {
  daily: {
    totalAmount: number;
    operationsCount: number;
    date: string;
  };
  monthly: {
    totalAmount: number;
    operationsCount: number;
    averageDailyIncome: number;
    month: string;
    daysInMonth: number;
  };
}

export interface PaymentFilters {
  page?: number;
  limit?: number;
  search?: string;
  feeType?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreatePaymentData {
  studentId: string;
  studentName: string;
  feeType:
    | "NEW_YEAR"
    | "SUPPLEMENTARY"
    | "LAB"
    | "STUDENT_SERVICES"
    | "OTHER"
    | "EXAM"
    | "TRAINING";
  amount: string;
  receiptNumber: string;
  paymentMethod: "CASH" | "TRANSFER" | "CHEQUE";
  paymentDate: string;
  notes?: string;
}

export interface SinglePaymentResponse {
  status: string;
  data: {
    payment: Payment;
  };
}

export interface ApiError {
  status: string;
  message: string;
  errors?: Record<string, string[]>;
}

class PaymentService {
  async getAllPayments(filters: PaymentFilters = {}): Promise<PaymentResponse> {
    try {
      // Build query string
      const queryParams = new URLSearchParams();

      if (filters.page) queryParams.set("page", filters.page.toString());
      if (filters.limit) queryParams.set("limit", filters.limit.toString());
      if (filters.search) queryParams.set("search", filters.search);
      if (filters.feeType) queryParams.set("feeType", filters.feeType);
      if (filters.paymentMethod)
        queryParams.set("paymentMethod", filters.paymentMethod);
      if (filters.startDate) queryParams.set("startDate", filters.startDate);
      if (filters.endDate) queryParams.set("endDate", filters.endDate);

      const queryString = queryParams.toString();
      const url = queryString ? `/payments?${queryString}` : "/payments";

      const response = await api.get<PaymentResponse>(url);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async searchPayments(
    q: string,
    page?: number,
    limit?: number
  ): Promise<PaymentResponse> {
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (page) params.set("page", String(page));
      if (limit) params.set("limit", String(limit));

      const url = `/payments/search?${params.toString()}`;
      const response = await api.get<PaymentResponse>(url);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getPaymentById(id: string): Promise<SinglePaymentResponse> {
    try {
      const response = await api.get<SinglePaymentResponse>(`/payments/${id}`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async createPayment(
    paymentData: CreatePaymentData
  ): Promise<SinglePaymentResponse> {
    try {
      const response = await api.post<SinglePaymentResponse>(
        "/payments",
        paymentData
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async updatePayment(
    id: string,
    paymentData: Partial<CreatePaymentData>
  ): Promise<SinglePaymentResponse> {
    try {
      const response = await api.patch<SinglePaymentResponse>(
        `/payments/${id}`,
        paymentData
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async deletePayment(
    id: string
  ): Promise<{ status: string; data: { message: string } }> {
    try {
      const response = await api.delete(`/payments/${id}`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async openReceiptPdf(id: string): Promise<void> {
    // Open the receipt in a new tab using the API base URL
    const base =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";
    const url = `${base}/payments/${id}/receipt`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async getPaymentsByStudent(
    studentId: string,
    filters: { page?: number; limit?: number } = {}
  ): Promise<PaymentResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (filters.page) queryParams.set("page", filters.page.toString());
      if (filters.limit) queryParams.set("limit", filters.limit.toString());

      const queryString = queryParams.toString();
      const url = queryString
        ? `/payments/student/${studentId}?${queryString}`
        : `/payments/student/${studentId}`;

      const response = await api.get<PaymentResponse>(url);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getPaymentByReceipt(
    receiptNumber: string
  ): Promise<SinglePaymentResponse> {
    try {
      const response = await api.get<SinglePaymentResponse>(
        `/payments/receipt/${receiptNumber}`
      );
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

export const paymentService = new PaymentService();
