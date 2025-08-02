import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma";
import asyncWrapper from "../middlewares/asyncWrapper";
import AppError from "../utils/AppError";
import { httpStatusText } from "../utils/httpStatusText";

// Types for request validation
interface CreatePaymentBody {
  studentId: string;
  studentName: string;
  feeType: "NEW_YEAR" | "SUPPLEMENTARY" | "LAB" | "STUDENT_SERVICES" | "OTHER";
  amount: string;
  receiptNumber: string;
  paymentMethod: "CASH" | "TRANSFER" | "CHEQUE";
  paymentDate: string;
  notes?: string;
}

interface UpdatePaymentBody {
  studentId?: string;
  studentName?: string;
  feeType?: "NEW_YEAR" | "SUPPLEMENTARY" | "LAB" | "STUDENT_SERVICES" | "OTHER";
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

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { studentId: { contains: search, mode: "insensitive" } },
        { studentName: { contains: search, mode: "insensitive" } },
        { receiptNumber: { contains: search, mode: "insensitive" } },
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

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        studentId: studentId.trim(),
        studentName: studentName.trim(),
        feeType,
        amount: parseFloat(amount),
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
      updateData.amount = parseFloat(amount);
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
};
