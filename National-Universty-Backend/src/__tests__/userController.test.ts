import request from "supertest";
import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/userController";
import { prisma } from "../utils/prisma";
import bcrypt from "bcrypt";
import AppError from "../utils/AppError";

// Mock Prisma
jest.mock("../utils/prisma", () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Mock bcrypt
jest.mock("bcrypt", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// إنشاء تطبيق Express للاختبار
const app = express();
app.use(express.json());

// Mock middleware للمصادقة
app.use((req: any, res: any, next: any) => {
  req.currentUser = {
    id: "test-admin-id",
    username: "admin",
    email: "admin@test.com",
    role: "admin",
  };
  next();
});

// إضافة routes
app.get("/api/users", getAllUsers);
app.get("/api/users/:id", getUserById);
app.put("/api/users/:id", updateUser);
app.delete("/api/users/:id", deleteUser);

// Error handling middleware
app.use(
  (
    error: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        status: error.status,
        message: error.message,
      });
    }

    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
);

describe("User Controller Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/users - getAllUsers", () => {
    it("should return all users with pagination", async () => {
      const mockUsers = [
        {
          id: "user-1",
          username: "user1",
          email: "user1@test.com",
          role: "admin",
          lastLoginAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "user-2",
          username: "user2",
          email: "user2@test.com",
          role: "auditor",
          lastLoginAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const response = await request(app).get("/api/users").expect(200);

      expect(response.body.status).toBe("success");
      expect(response.body.data).toHaveProperty("users");
      expect(response.body.data.users).toHaveLength(2);
      expect(response.body.data).toHaveProperty("page", 1);
      expect(response.body.data).toHaveProperty("limit", 10);
      expect(response.body.data).toHaveProperty("count", 2);

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        select: expect.objectContaining({
          id: true,
          username: true,
          email: true,
          role: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        }),
        orderBy: { createdAt: "desc" },
        skip: 0,
        take: 10,
      });
    });

    it("should handle pagination parameters", async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get("/api/users?page=2&limit=5")
        .expect(200);

      expect(response.body.data.page).toBe(2);
      expect(response.body.data.limit).toBe(5);

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        select: expect.any(Object),
        orderBy: { createdAt: "desc" },
        skip: 5, // (page - 1) * limit
        take: 5,
      });
    });
  });

  describe("GET /api/users/:id - getUserById", () => {
    it("should return user by id successfully", async () => {
      const mockUser = {
        id: "user-123",
        username: "testuser",
        email: "test@example.com",
        role: "admin",
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .get("/api/users/user-123")
        .expect(200);

      expect(response.body.status).toBe("success");
      expect(response.body.data.user).toMatchObject({
        id: "user-123",
        username: "testuser",
        email: "test@example.com",
        role: "admin",
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-123" },
        select: expect.any(Object),
      });
    });

    it("should return 404 for non-existent user", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get("/api/users/non-existent-id")
        .expect(404);

      expect(response.body.status).toBe("fail");
      expect(response.body.message).toBe("User not found");
    });
  });

  describe("PUT /api/users/:id - updateUser", () => {
    it("should update user email successfully", async () => {
      const updateData = {
        email: "updated@example.com",
      };

      const existingUser = {
        id: "user-123",
        username: "testuser",
        email: "old@example.com",
        role: "auditor",
        password: "hashed_password",
      };

      const updatedUser = {
        id: "user-123",
        username: "testuser",
        email: "updated@example.com",
        role: "auditor",
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(existingUser) // user exists check
        .mockResolvedValueOnce(null); // email not taken

      (prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const response = await request(app)
        .put("/api/users/user-123")
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe("success");
      expect(response.body.data.message).toBe(
        "User account updated successfully"
      );
      expect(response.body.data.user.email).toBe("updated@example.com");

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: { email: "updated@example.com" },
        select: expect.any(Object),
      });
    });

    it("should update password successfully", async () => {
      const updateData = {
        password: "currentPassword123",
        newPassword: "newPassword123",
      };

      const existingUser = {
        id: "user-123",
        password: "hashed_current_password",
      };

      const newHashedPassword = "new_hashed_password";

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue(newHashedPassword);
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...existingUser,
        password: newHashedPassword,
      });

      const response = await request(app)
        .put("/api/users/user-123")
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe("success");
      expect(response.body.data.message).toBe(
        "User account updated successfully"
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(
        "currentPassword123",
        "hashed_current_password"
      );
      expect(bcrypt.hash).toHaveBeenCalledWith("newPassword123", 12);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: { password: newHashedPassword },
        select: expect.any(Object),
      });
    });

    it("should return 404 for non-existent user", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .put("/api/users/non-existent-id")
        .send({ email: "test@example.com" })
        .expect(404);

      expect(response.body.status).toBe("fail");
      expect(response.body.message).toBe("User not found");
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("should return error for duplicate email", async () => {
      const updateData = {
        email: "existing@example.com",
      };

      const existingUser = {
        id: "user-123",
        email: "current@example.com",
      };

      const duplicateUser = {
        id: "another-user",
        email: "existing@example.com",
      };

      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(duplicateUser);

      const response = await request(app)
        .put("/api/users/user-123")
        .send(updateData)
        .expect(400);

      expect(response.body.status).toBe("fail");
      expect(response.body.message).toBe(
        "Email already in use by another user"
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("should return error for wrong current password", async () => {
      const updateData = {
        password: "wrongPassword",
        newPassword: "newPassword123",
      };

      const existingUser = {
        id: "user-123",
        password: "hashed_password",
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const response = await request(app)
        .put("/api/users/user-123")
        .send(updateData)
        .expect(400);

      expect(response.body.status).toBe("fail");
      expect(response.body.message).toBe("Current password is incorrect");
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe("DELETE /api/users/:id - deleteUser", () => {
    it("should delete user successfully", async () => {
      const existingUser = {
        id: "user-123",
        username: "userToDelete",
        email: "delete@example.com",
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);
      (prisma.user.delete as jest.Mock).mockResolvedValue(existingUser);

      const response = await request(app)
        .delete("/api/users/user-123")
        .expect(200);

      expect(response.body.status).toBe("success");
      expect(response.body.data.message).toBe(
        "User account deleted successfully"
      );

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-123" },
      });

      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: "user-123" },
      });
    });

    it("should return 404 for non-existent user", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .delete("/api/users/non-existent-id")
        .expect(404);

      expect(response.body.status).toBe("fail");
      expect(response.body.message).toBe("User not found");
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });
  });
});
