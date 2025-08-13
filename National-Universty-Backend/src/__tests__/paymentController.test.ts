import request from "supertest";
import express from "express";
import {
  getAllPayments,
  createPayment,
} from "../controllers/paymentController";
import { prisma } from "../utils/prisma";
import redis from "../utils/redis";
import AppError from "../utils/AppError";

// Mock Prisma
jest.mock("../utils/prisma", () => ({
  prisma: {
    payment: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

// Mock Redis (تم إعداده في setup.ts)

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
app.get("/api/payments", getAllPayments);
app.post("/api/payments", createPayment);

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

describe("Payment Controller Tests", () => {
  // تنظيف بعد كل اختبار
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/payments - getAllPayments", () => {
    it("should return payments successfully from database", async () => {
      // إعداد Mock data
      const mockPayments = [
        {
          id: "1",
          studentId: "ST001",
          studentName: "أحمد محمد",
          feeType: "NEW_YEAR",
          amount: 1000,
          receiptNumber: "REC001",
          paymentMethod: "CASH",
          paymentDate: new Date("2024-01-01"),
          notes: "دفع رسوم السنة الأولى",
          createdBy: {
            id: "user1",
            username: "admin",
            email: "admin@test.com",
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockTotalCount = 1;

      // Mock Prisma responses
      (prisma.payment.findMany as jest.Mock).mockResolvedValue(mockPayments);
      (prisma.payment.count as jest.Mock).mockResolvedValue(mockTotalCount);

      // Mock Redis cache miss
      (redis.get as jest.Mock).mockResolvedValue(null);
      (redis.setex as jest.Mock).mockResolvedValue("OK");

      // تنفيذ الطلب
      const response = await request(app).get("/api/payments").expect(200);

      // التحقق من النتيجة
      expect(response.body).toHaveProperty("status", "success");
      expect(response.body.data).toHaveProperty("payments");
      expect(response.body.data.payments).toHaveLength(1);
      expect(response.body.data.payments[0]).toMatchObject({
        id: "1",
        studentId: "ST001",
        studentName: "أحمد محمد",
        feeType: "NEW_YEAR",
        amount: 1000,
      });

      // التحقق من استدعاء Prisma
      expect(prisma.payment.findMany).toHaveBeenCalledWith({
        where: {},
        select: expect.any(Object),
        orderBy: { paymentDate: "desc" },
        skip: 0,
        take: 10,
      });

      expect(prisma.payment.count).toHaveBeenCalledWith({ where: {} });

      // التحقق من Redis operations
      expect(redis.get).toHaveBeenCalled();
      expect(redis.setex).toHaveBeenCalled();
    });

    it("should return cached payments when available in Redis", async () => {
      // إعداد cached data
      const cachedData = {
        status: "success",
        data: {
          payments: [
            {
              id: "1",
              studentId: "ST001",
              studentName: "أحمد محمد (من الكاش)",
              feeType: "NEW_YEAR",
              amount: 1000,
            },
          ],
          pagination: {
            page: 1,
            limit: 10,
            totalCount: 1,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
        },
      };

      // Mock Redis cache hit
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(cachedData));

      // تنفيذ الطلب
      const response = await request(app).get("/api/payments").expect(200);

      // التحقق من النتيجة
      expect(response.body.data.cached).toBe(true);
      expect(response.body.data.payments[0].studentName).toBe(
        "أحمد محمد (من الكاش)"
      );

      // التأكد أن قاعدة البيانات لم يتم استدعاؤها
      expect(prisma.payment.findMany).not.toHaveBeenCalled();
      expect(prisma.payment.count).not.toHaveBeenCalled();
    });

    it("should handle pagination correctly", async () => {
      // Mock empty result
      (prisma.payment.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.payment.count as jest.Mock).mockResolvedValue(0);
      (redis.get as jest.Mock).mockResolvedValue(null);
      (redis.setex as jest.Mock).mockResolvedValue("OK");

      // تنفيذ الطلب مع pagination
      const response = await request(app)
        .get("/api/payments?page=2&limit=5")
        .expect(200);

      // التحقق من pagination
      expect(response.body.data.pagination).toMatchObject({
        page: 2,
        limit: 5,
        totalCount: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: true,
      });

      // التحقق من parameters في Prisma call
      expect(prisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5, // (page - 1) * limit = (2 - 1) * 5
          take: 5,
        })
      );
    });
  });

  describe("POST /api/payments - createPayment", () => {
    it("should create a new payment successfully", async () => {
      // إعداد payment data
      const newPayment = {
        studentId: "ST002",
        studentName: "فاطمة أحمد",
        feeType: "NEW_YEAR",
        amount: "1500",
        receiptNumber: "REC002",
        paymentMethod: "TRANSFER",
        paymentDate: "2024-01-15",
        notes: "دفع رسوم الفصل الأول",
      };

      const mockCreatedPayment = {
        id: "2",
        ...newPayment,
        amount: 1500,
        paymentDate: new Date("2024-01-15"),
        createdBy: {
          id: "test-user-id",
          username: "testuser",
          email: "test@test.com",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock Prisma responses
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(null); // لا يوجد receipt number مكرر
      (prisma.payment.create as jest.Mock).mockResolvedValue(
        mockCreatedPayment
      );

      // Mock Redis cache invalidation
      (redis.keys as jest.Mock).mockResolvedValue(["payments:all:*"]);
      (redis.del as jest.Mock).mockResolvedValue(1);

      // تنفيذ الطلب
      const response = await request(app)
        .post("/api/payments")
        .send(newPayment)
        .expect(201);

      // التحقق من النتيجة
      expect(response.body).toHaveProperty("status", "success");
      expect(response.body.data).toHaveProperty(
        "message",
        "Payment created successfully"
      );
      expect(response.body.data.payment).toMatchObject({
        id: "2",
        studentId: "ST002",
        studentName: "فاطمة أحمد",
        amount: 1500,
      });

      // التحقق من Prisma calls
      expect(prisma.payment.findUnique).toHaveBeenCalledWith({
        where: { receiptNumber: "REC002" },
      });

      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          studentId: "ST002",
          studentName: "فاطمة أحمد",
          amount: 1500,
          createdById: "test-user-id",
        }),
        select: expect.any(Object),
      });

      // التحقق من cache invalidation
      expect(redis.keys).toHaveBeenCalledWith("payments:*");
      expect(redis.del).toHaveBeenCalled();
    });

    it("should return error for duplicate receipt number", async () => {
      const newPayment = {
        studentId: "ST003",
        studentName: "محمد علي",
        feeType: "NEW_YEAR",
        amount: "1200",
        receiptNumber: "REC001", // receipt number موجود
        paymentMethod: "CASH",
        paymentDate: "2024-01-20",
      };

      // Mock existing payment
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue({
        id: "1",
        receiptNumber: "REC001",
      });

      // تنفيذ الطلب
      const response = await request(app)
        .post("/api/payments")
        .send(newPayment)
        .expect(400);

      // التحقق من رسالة الخطأ
      expect(response.body).toHaveProperty("status", "fail");
      expect(response.body).toHaveProperty(
        "message",
        "Payment with this receipt number already exists"
      );

      // التأكد أن create لم يتم استدعاؤه
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });
  });
});
