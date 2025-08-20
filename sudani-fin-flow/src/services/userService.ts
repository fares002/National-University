import api from "@/lib/api";

export type UserRole = "admin" | "auditor";

export interface UserLite {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface PaginatedUsers {
  users: UserLite[];
  page: number;
  limit: number;
  count: number;
}

export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  role?: UserRole;
}

class UserService {
  async getAll(page = 1, limit = 10) {
    const { data } = await api.get<{ status: string; data: PaginatedUsers }>(
      `/users?page=${page}&limit=${limit}`
    );
    return data.data;
  }

  async create(body: CreateUserDto) {
    const { data } = await api.post(`/users`, body);
    return data;
  }

  async updateRole(id: string, role: UserRole) {
    const { data } = await api.patch(`/users/${id}`, { role });
    return data;
  }

  async remove(id: string) {
    const { data } = await api.delete(`/users/${id}`);
    return data;
  }
}

export const userService = new UserService();
