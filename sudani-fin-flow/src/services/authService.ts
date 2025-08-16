import api from "@/lib/api";
import { User } from "@/contexts/AuthContext";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  status: string;
  data: {
    message: string;
    user: User & {
      lastLoginAt?: string;
      createdAt: string;
      updatedAt: string;
    };
    token: string;
  };
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  role?: "admin" | "auditor";
}

export interface ApiError {
  status: string;
  message: string;
  errors?: Record<string, string[]>;
}

class AuthService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await api.post<LoginResponse>(
        "/auth/login",
        credentials
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async register(data: RegisterRequest): Promise<LoginResponse> {
    try {
      const response = await api.post<LoginResponse>("/auth/register", data);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      await api.post("/auth/logout");
    } catch (error: any) {
      // Even if logout fails on server, we should clear local state
      console.error("Logout error:", error);
    }
  }

  async getCurrentUser(): Promise<{ data: { user: User } }> {
    try {
      const response = await api.get("/auth/me");
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

export const authService = new AuthService();
