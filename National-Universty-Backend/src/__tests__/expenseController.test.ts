import request from "supertest";
import express from "express";
import {
  getAllExpenses,
  createExpense,
} from "../controllers/expenseController";
import { prisma } from "../utils/prisma";
import redis from "../utils/redis";
import AppError from "../utils/AppError";

// Mock Prisma
jest.mock("../utils/prisma", () => ({
  prisma: {
    expense: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

// إنشاء تطبيق Express للاختبار
const app = express();
app.use(express.json());

// Mock middleware للمصادقة
app.use((req: any, res: any, next: any) => {
  req.currentUser = {
    id: "test-user-id",
    username: "testuser",
    email: "test@test.com",
    role: "admin",
  };
  next();
});

// إضافة routes
app.get("/api/expenses", getAllExpenses);
app.post("/api/expenses", createExpense);

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

describe("Expense Controller Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/expenses - getAllExpenses", () => {
    it("should return expenses successfully from cache", async () => {
      const cachedData = {
        status: "success",
        data: {
          expenses: [
            {
              id: "1",
              description: "مصاريف الكهرباء",
              amount: 500,
              category: "UTILITIES",
              date: new Date("2024-01-01"),
            },
          ],
          pagination: {
            page: 1,
            limit: 10,
            totalCount: 1,
            totalPages: 1,
          },
        },
      };

      // Mock Redis cache hit
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(cachedData));

      const response = await request(app).get("/api/expenses").expect(200);

      expect(response.body.data.cached).toBe(true);
      expect(response.body.data.expenses[0].description).toBe(
        "مصاريف الكهرباء"
      );

      // تأكد أن قاعدة البيانات لم يتم استدعاؤها
      expect(prisma.expense.findMany).not.toHaveBeenCalled();
    });

    it("should return expenses from database when cache misses", async () => {
      const mockExpenses = [
        {
          id: "2",
          description: "مصاريف الصيانة",
          amount: 750,
          category: "MAINTENANCE",
          date: new Date("2024-01-02"),
          createdBy: {
            id: "user1",
            username: "admin",
            email: "admin@test.com",
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock Redis cache miss
      (redis.get as jest.Mock).mockResolvedValue(null);
      (redis.setex as jest.Mock).mockResolvedValue("OK");

      // Mock Prisma responses
      (prisma.expense.findMany as jest.Mock).mockResolvedValue(mockExpenses);
      (prisma.expense.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app).get("/api/expenses").expect(200);

      expect(response.body.status).toBe("success");
      expect(response.body.data.expenses).toHaveLength(1);
      expect(response.body.data.expenses[0].description).toBe("مصاريف الصيانة");

      // تأكد من استدعاء قاعدة البيانات
      expect(prisma.expense.findMany).toHaveBeenCalled();
      expect(prisma.expense.count).toHaveBeenCalled();

      // تأكد من cache operations
      expect(redis.get).toHaveBeenCalled();
      expect(redis.setex).toHaveBeenCalled();
    });

    it("should handle filtering by category", async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);
      (redis.setex as jest.Mock).mockResolvedValue("OK");
      (prisma.expense.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.expense.count as jest.Mock).mockResolvedValue(0);

      await request(app)
        .get("/api/expenses?category=Fixed%20Assets")
        .expect(200);

      // تحقق من filter parameters
      expect(prisma.expense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: {
              contains: "Fixed Assets",
            },
          }),
        })
      );
    });
  });

  describe("POST /api/expenses - createExpense", () => {
    it("should create new expense successfully", async () => {
      const newExpense = {
        description: "مصاريف الوقود",
        amount: "300",
        category: "General & Administrative Expenses",
        date: "2024-01-15",
        vendor: "شركة الوقود",
        receiptUrl: "http://example.com/receipt.pdf",
      };

      const mockCreatedExpense = {
        id: "3",
        description: "مصاريف الوقود",
        amount: 300,
        category: "General & Administrative Expenses",
        date: new Date("2024-01-15"),
        vendor: "شركة الوقود",
        receiptUrl: "http://example.com/receipt.pdf",
        creator: {
          id: "test-user-id",
          username: "testuser",
          email: "test@test.com",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock Prisma create
      (prisma.expense.create as jest.Mock).mockResolvedValue(
        mockCreatedExpense
      );

      // Mock Redis cache invalidation
      (redis.keys as jest.Mock).mockResolvedValue(["expenses:all:*"]);
      (redis.del as jest.Mock).mockResolvedValue(1);

      const response = await request(app)
        .post("/api/expenses")
        .send(newExpense)
        .expect(201);

      expect(response.body.status).toBe("success");
      expect(response.body.data.message).toBe("Expense created successfully");
      expect(response.body.data.expense.description).toBe("مصاريف الوقود");
      expect(response.body.data.expense.amount).toBe(300);

      // تحقق من Prisma create call
      expect(prisma.expense.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: "مصاريف الوقود",
          amount: 300,
          category: "General & Administrative Expenses",
          vendor: "شركة الوقود",
          receiptUrl: "http://example.com/receipt.pdf",
          date: new Date("2024-01-15"),
          createdBy: "test-user-id",
        }),
        include: expect.objectContaining({
          creator: expect.any(Object),
        }),
      });

      // تحقق من cache invalidation
      expect(redis.keys).toHaveBeenCalledWith("expenses:*");
      expect(redis.del).toHaveBeenCalled();
    });
  });
});
