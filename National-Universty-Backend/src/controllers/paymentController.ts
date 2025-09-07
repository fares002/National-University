import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma";
import asyncWrapper from "../middlewares/asyncWrapper";
import redis, {
  invalidateDashboardCache,
  invalidatePaymentCache,
} from "../utils/redis";
import AppError from "../utils/AppError";
import { httpStatusText } from "../utils/httpStatusText";
import { generatePaymentReceiptPDF } from "../utils/paymentReceiptPdf";
import { convertToUSD, getLatestRate } from "../utils/currencyUtils";

// Types for request validation
interface CreatePaymentBody {
  studentId: string;
  studentName: string;
  feeType:
    | "NEW_YEAR"
    | "SUPPLEMENTARY"
    | "TRAINING"
    | "STUDENT_SERVICES"
    | "OTHER"
    | "EXAM";
  amount: string;
  receiptNumber: string;
  paymentMethod: "CASH" | "TRANSFER" | "CHEQUE";
  paymentDate: string;
  notes?: string;
}

interface UpdatePaymentBody {
  studentId?: string;
  studentName?: string;
  feeType?:
    | "NEW_YEAR"
    | "SUPPLEMENTARY"
    | "TRAINING"
    | "STUDENT_SERVICES"
    | "OTHER"
    | "EXAM";
  amount?: string;
  receiptNumber?: string;
  paymentMethod?: "CASH" | "TRANSFER" | "CHEQUE";
  paymentDate?: string;
  notes?: string;
}

/**
 * Get all payments with pagination and filtering
 * Authorization: admin and auditor roles
 */
const getAllPayments = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    // Pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Filter parameters
    const search = req.query.search as string;
    const feeType = req.query.feeType as string;
    const paymentMethod = req.query.paymentMethod as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    // Create unique cache key based on all parameters
    const cacheKey = `payments:all:page:${page}:limit:${limit}:search:${
      search || ""
    }:feeType:${feeType || ""}:paymentMethod:${paymentMethod || ""}:startDate:${
      startDate || ""
    }:endDate:${endDate || ""}`;

    // Try to get data from cache first
    try {
      console.log("🔍 Checking cache for payments...");
      const cachedData = await redis.get(cacheKey);

      if (cachedData) {
        console.log("🚀 CACHE HIT! Returning cached payments data");
        const parsedData = JSON.parse(cachedData);

        return res.status(200).json({
          ...parsedData,
          data: {
            ...parsedData.data,
            cached: true, // Flag to indicate data came from cache
          },
        });
      }

      console.log("📂 CACHE MISS! Fetching payments data from database");
    } catch (cacheError) {
      console.warn("⚠️ Cache read error:", (cacheError as Error).message);
      // Continue without cache if error occurs
    }

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { studentId: { contains: search } },
        { studentName: { contains: search } },
        { receiptNumber: { contains: search } },
      ];
    }

    if (feeType) {
      where.feeType = feeType;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) {
        where.paymentDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.paymentDate.lte = new Date(endDate);
      }
    }

    // Record start time for performance monitoring
    const queryStartTime = Date.now();

    // Get payments with pagination
    const [payments, totalCount] = await Promise.all([
      prisma.payment.findMany({
        where,
        select: {
          id: true,
          studentId: true,
          studentName: true,
          feeType: true,
          amount: true,
          currency: true,
          amountUSD: true,
          usdAppliedRate: true,
          receiptNumber: true,
          paymentMethod: true,
          paymentDate: true,
          notes: true,
          createdBy: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          paymentDate: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    // Calculate query execution time
    const queryTime = Date.now() - queryStartTime;
    console.log(`📊 Database query completed in ${queryTime}ms`);

    const totalPages = Math.ceil(totalCount / limit);

    // Compute payment statistics (daily and monthly)
    const today = new Date();
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    const [dailyAgg, monthlyAgg] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          paymentDate: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
        _sum: { amount: true, amountUSD: true },
        _count: { id: true },
      }),
      prisma.payment.aggregate({
        where: {
          paymentDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        _sum: { amount: true, amountUSD: true  },
        _count: { id: true },
      }),
    ]);

    const daysInMonth = endOfMonth.getDate();
    const monthlyTotal = Number(monthlyAgg._sum.amount || 0);
    const averageDailyIncome = monthlyTotal / daysInMonth;

    const statistics = {
      daily: {
        totalAmount: Number(dailyAgg._sum.amount || 0),
        totalAmountUSD: Number(dailyAgg._sum.amountUSD || 0),
        operationsCount: dailyAgg._count.id || 0,
        date: startOfToday.toISOString().slice(0, 10),
      },
      monthly: {
        totalAmount: monthlyTotal,
        operationsCount: monthlyAgg._count.id || 0,
        averageDailyIncome,
        averageTransactionAmountUSD:
          (monthlyAgg._count.id || 0) > 0
            ? Number(
                (
                  Number(monthlyAgg._sum.amountUSD || 0) /
                  daysInMonth
                ).toFixed(2)
              )
            : 0,
        month: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
          2,
          "0"
        )}`,
        daysInMonth,
      },
    };

    const result = {
      status: httpStatusText.SUCCESS,
      data: {
        payments,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        statistics,
      },
    };

    // Cache the result for 5 minutes (300 seconds)
    try {
      await redis.setex(cacheKey, 300, JSON.stringify(result));
      console.log("✅ Payments data cached successfully with key:", cacheKey);
    } catch (cacheError) {
      console.warn("⚠️ Cache write error:", (cacheError as Error).message);
      // Continue without cache if error occurs
    }

    return res.status(200).json(result);
  }
);

/**
 * Quick search payments
 * GET /api/payments/search?q=term&page=&limit=
 * Access: admin, auditor
 */
const searchPayments = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const q = (req.query.q as string) || "";
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "10", 10);
    const skip = (page - 1) * limit;

    if (!q.trim()) {
      return res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: {
          payments: [],
          pagination: {
            page,
            limit,
            totalCount: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
        },
      });
    }

    const where: any = {
      OR: [
        { studentId: { contains: q } },
        { studentName: { contains: q } },
        { receiptNumber: { contains: q } },
        { notes: { contains: q } },
      ],
    };

    const [payments, totalCount] = await Promise.all([
      prisma.payment.findMany({
        where,
        select: {
          id: true,
          studentId: true,
          studentName: true,
          feeType: true,
          amount: true,
          currency: true,
          amountUSD: true,
          usdAppliedRate: true,
          receiptNumber: true,
          paymentMethod: true,
          paymentDate: true,
          notes: true,
          createdBy: {
            select: { id: true, username: true, email: true },
          },
        },
        orderBy: { paymentDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      data: {
        payments,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  }
);

/**
 * Get payment by ID
 * Authorization: admin and auditor roles
 */
const getPaymentById = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      select: {
        id: true,
        studentId: true,
        studentName: true,
        feeType: true,
        amount: true,
        currency: true,
        amountUSD: true,
        usdAppliedRate: true,
        receiptNumber: true,
        paymentMethod: true,
        paymentDate: true,
        notes: true,
        createdBy: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!payment) {
      return next(new AppError("Payment not found", 404, httpStatusText.FAIL));
    }

    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      data: {
        payment,
      },
    });
  }
);

/**
 * Create new payment
 * Authorization: admin role only
 */
const createPayment = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      studentId,
      studentName,
      feeType,
      amount,
      receiptNumber,
      paymentMethod,
      paymentDate,
      notes,
    }: CreatePaymentBody = req.body;

    const currentUser = (req as any).currentUser;

    // Check if receipt number already exists
    const existingPayment = await prisma.payment.findUnique({
      where: { receiptNumber },
    });

    if (existingPayment) {
      return next(
        new AppError(
          "Payment with this receipt number already exists",
          400,
          httpStatusText.FAIL
        )
      );
    }

    // Convert amount to USD
    const numericAmount = parseFloat(amount);
    const { amountUSD, usdAppliedRate } = await convertToUSD(numericAmount);

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        studentId: studentId.trim(),
        studentName: studentName.trim(),
        feeType,
        amount: numericAmount,
        currency: "EGP",
        amountUSD,
        usdAppliedRate,
        receiptNumber: receiptNumber.trim(),
        paymentMethod,
        paymentDate: new Date(paymentDate),
        notes: notes?.trim(),
        createdById: currentUser.id,
      },
      select: {
        id: true,
        studentId: true,
        studentName: true,
        feeType: true,
        amount: true,
        currency: true,
        amountUSD: true,
        usdAppliedRate: true,
        receiptNumber: true,
        paymentMethod: true,
        paymentDate: true,
        notes: true,
        createdBy: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    // Invalidate all payment caches since data has changed
    try {
      const pattern = "payments:*";
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(
          `🧹 Cache invalidated: ${keys.length} payment cache keys deleted`
        );
      }
    } catch (cacheError) {
      console.warn(
        "⚠️ Cache invalidation error:",
        (cacheError as Error).message
      );
      // Continue even if cache invalidation fails
    }

    // Invalidate dashboard cache to ensure real-time updates
    try {
      await invalidateDashboardCache();
      await invalidatePaymentCache();
      console.log("🧹 Dashboard and payment caches invalidated successfully");
    } catch (cacheError) {
      console.warn(
        "⚠️ Dashboard cache invalidation error:",
        (cacheError as Error).message
      );
      // Continue even if cache invalidation fails
    }

    return res.status(201).json({
      status: httpStatusText.SUCCESS,
      data: {
        message: "Payment created successfully",
        payment,
      },
    });
  }
);

/**
 * Update payment by ID
 * Authorization: admin role only
 */
const updatePayment = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const {
      studentId,
      studentName,
      feeType,
      amount,
      receiptNumber,
      paymentMethod,
      paymentDate,
      notes,
    }: UpdatePaymentBody = req.body;

    // Check if payment exists
    const existingPayment = await prisma.payment.findUnique({
      where: { id },
    });

    if (!existingPayment) {
      return next(new AppError("Payment not found", 404, httpStatusText.FAIL));
    }

    // Build update data
    const updateData: any = {};

    if (studentId !== undefined) {
      updateData.studentId = studentId.trim();
    }

    if (studentName !== undefined) {
      updateData.studentName = studentName.trim();
    }

    if (feeType !== undefined) {
      updateData.feeType = feeType;
    }

    if (amount !== undefined) {
      const numericAmount = parseFloat(amount);
      updateData.amount = numericAmount;
      // Keep original applied rate if it exists to protect historical valuation
      let appliedRate = existingPayment.usdAppliedRate
        ? Number(existingPayment.usdAppliedRate)
        : null;
      if (!appliedRate) {
        const latestRateRecord = await getLatestRate();
        appliedRate = latestRateRecord ? Number(latestRateRecord.rate) : null;
      }
      if (appliedRate) {
        updateData.usdAppliedRate = appliedRate;
        updateData.amountUSD = Number((numericAmount / appliedRate).toFixed(2));
      } else {
        updateData.usdAppliedRate = null;
        updateData.amountUSD = null;
      }
    }

    if (receiptNumber !== undefined) {
      // Check if receipt number already exists (excluding current payment)
      const duplicateReceipt = await prisma.payment.findFirst({
        where: {
          receiptNumber: receiptNumber.trim(),
          NOT: { id },
        },
      });

      if (duplicateReceipt) {
        return next(
          new AppError(
            "Payment with this receipt number already exists",
            400,
            httpStatusText.FAIL
          )
        );
      }

      updateData.receiptNumber = receiptNumber.trim();
    }

    if (paymentMethod !== undefined) {
      updateData.paymentMethod = paymentMethod;
    }

    if (paymentDate !== undefined) {
      updateData.paymentDate = new Date(paymentDate);
    }

    if (notes !== undefined) {
      updateData.notes = notes.trim();
    }

    // Execute the update
    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        studentId: true,
        studentName: true,
        feeType: true,
        amount: true,
        currency: true,
        amountUSD: true,
        usdAppliedRate: true,
        receiptNumber: true,
        paymentMethod: true,
        paymentDate: true,
        notes: true,
        createdBy: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    // Invalidate all payment caches since data has changed
    try {
      const pattern = "payments:*";
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(
          `🧹 Cache invalidated: ${keys.length} payment cache keys deleted`
        );
      }
    } catch (cacheError) {
      console.warn(
        "⚠️ Cache invalidation error:",
        (cacheError as Error).message
      );
      // Continue even if cache invalidation fails
    }

    // Also invalidate dashboard cache so aggregated views refresh
    try {
      await invalidateDashboardCache();
      await invalidatePaymentCache();
      console.log("🧹 Dashboard and payment caches invalidated successfully");
    } catch (cacheError) {
      console.warn(
        "⚠️ Dashboard cache invalidation error:",
        (cacheError as Error).message
      );
      // Continue even if dashboard invalidation fails
    }

    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      data: {
        message: "Payment updated successfully",
        payment: updatedPayment,
      },
    });
  }
);

/**
 * Delete payment by ID
 * Authorization: admin role only
 */
const deletePayment = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    // Check if payment exists
    const existingPayment = await prisma.payment.findUnique({
      where: { id },
    });

    if (!existingPayment) {
      return next(new AppError("Payment not found", 404, httpStatusText.FAIL));
    }

    // Delete payment
    await prisma.payment.delete({
      where: { id },
    });

    // Invalidate all payment caches since data has changed
    try {
      const pattern = "payments:*";
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(
          `🧹 Cache invalidated: ${keys.length} payment cache keys deleted`
        );
      }
    } catch (cacheError) {
      console.warn(
        "⚠️ Cache invalidation error:",
        (cacheError as Error).message
      );
      // Continue even if cache invalidation fails
    }

    // Also invalidate dashboard cache so aggregated views refresh
    try {
      await invalidateDashboardCache();
      await invalidatePaymentCache();
      console.log("🧹 Dashboard and payment caches invalidated successfully");
    } catch (cacheError) {
      console.warn(
        "⚠️ Dashboard cache invalidation error:",
        (cacheError as Error).message
      );
      // Continue even if dashboard invalidation fails
    }

    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      data: {
        message: "Payment deleted successfully",
      },
    });
  }
);

/**
 * Get payments by student ID
 * Authorization: admin and auditor roles
 */
const getPaymentsByStudentId = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const { studentId } = req.params;

    // Pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [payments, totalCount] = await Promise.all([
      prisma.payment.findMany({
        where: { studentId },
        select: {
          id: true,
          studentId: true,
          studentName: true,
          feeType: true,
          amount: true,
          receiptNumber: true,
          paymentMethod: true,
          paymentDate: true,
          notes: true,
          createdBy: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          paymentDate: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where: { studentId } }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      data: {
        payments,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  }
);

/**
 * Get payment by receipt number
 * Authorization: admin and auditor roles
 */
const getPaymentByReceiptNumber = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const { receiptNumber } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { receiptNumber },
      select: {
        id: true,
        studentId: true,
        studentName: true,
        feeType: true,
        amount: true,
        currency: true,
        amountUSD: true,
        usdAppliedRate: true,
        receiptNumber: true,
        paymentMethod: true,
        paymentDate: true,
        notes: true,
        createdBy: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!payment) {
      return next(
        new AppError(
          "Payment with this receipt number not found",
          404,
          httpStatusText.FAIL
        )
      );
    }

    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      data: {
        payment,
      },
    });
  }
);

export {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  getPaymentsByStudentId,
  getPaymentByReceiptNumber,
  searchPayments,
};

/**
 * Generate and stream a PDF receipt with QR code for a payment
 * GET /api/payments/:id/receipt
 * Access: admin, auditor
 */
export const getPaymentReceiptPdf = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const payment = await prisma.payment.findUnique({
      where: { id },
      select: {
        id: true,
        studentId: true,
        studentName: true,
        feeType: true,
        amount: true,
        receiptNumber: true,
        paymentMethod: true,
        paymentDate: true,
        createdBy: { select: { username: true } },
      },
    });
    if (!payment) {
      return next(new AppError("Payment not found", 404, httpStatusText.FAIL));
    }
    await generatePaymentReceiptPDF(
      {
        id: payment.id,
        studentId: payment.studentId,
        studentName: payment.studentName,
        feeType: String(payment.feeType),
        amount: Number(payment.amount),
        receiptNumber: payment.receiptNumber,
        paymentMethod: String(payment.paymentMethod),
        paymentDate: payment.paymentDate,
        createdBy: payment.createdBy,
      },
      res
    );
  }
);
