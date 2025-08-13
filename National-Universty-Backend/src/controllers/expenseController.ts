import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma";
import asyncWrapper from "../middlewares/asyncWrapper";
import redis from "../utils/redis";
import AppError from "../utils/AppError";
import { httpStatusText } from "../utils/httpStatusText";

// Define allowed categories as a TypeScript Union Type
type ExpenseCategory =
  | "Fixed Assets"
  | "Part-time Professors"
  | "Study Materials & Administration Leaves"
  | "Salaries"
  | "Student Fees Refund"
  | "Advances"
  | "Bonuses"
  | "General & Administrative Expenses"
  | "Library Supplies"
  | "Lab Consumables"
  | "Student Training"
  | "Saudi-Egyptian Company";

// Create interface
interface CreateExpenseBody {
  amount: string;
  description: string;
  category: ExpenseCategory;
  vendor?: string;
  receiptUrl?: string;
  date: string;
}

// Update interface
interface UpdateExpenseBody {
  amount?: string;
  description?: string;
  category?: ExpenseCategory;
  vendor?: string;
  receiptUrl?: string;
  date?: string;
}

/**
 * Get all expenses with pagination and filtering
 * Authorization: admin and auditor roles
 */
const getAllExpenses = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    // Pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    // Filter parameters
    const search = req.query.search as string;
    const category = req.query.category as string;
    const vendor = req.query.vendor as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const minAmount = req.query.minAmount as string;
    const maxAmount = req.query.maxAmount as string;

    // 🔑 Create unique cache key based on all parameters
    const cacheKey = `expenses:all:page:${page}:limit:${limit}:search:${
      search || ""
    }:category:${category || ""}:vendor:${vendor || ""}:startDate:${
      startDate || ""
    }:endDate:${endDate || ""}:minAmount:${minAmount || ""}:maxAmount:${
      maxAmount || ""
    }`;

    // 🔍 Try to get data from cache first
    try {
      console.log("🔍 Checking cache for expenses...");
      const cachedData = await redis.get(cacheKey);

      if (cachedData) {
        console.log("🚀 CACHE HIT! Returning cached expenses data");
        const parsedData = JSON.parse(cachedData);

        // Add cached flag to the existing data structure
        return res.status(200).json({
          ...parsedData,
          data: {
            ...parsedData.data,
            cached: true, // Flag to indicate data came from cache
          },
        });
      }

      console.log("📂 CACHE MISS! Fetching data from database");
    } catch (cacheError) {
      console.warn("⚠️ Cache read error:", (cacheError as Error).message);
      // Continue without cache if error occurs
    }

    // Build where clause
    const where: any = {};
    // Text search across description, category, and vendor
    if (search) {
      where.OR = [
        {
          description: {
            contains: search,
          },
        },
        {
          category: {
            contains: search,
          },
        },
        {
          vendor: {
            contains: search,
          },
        },
      ];
    }
    // Category filter
    if (category) {
      console.log("🔍 Filtering by category:", category);
      where.category = {
        contains: category,
      };
    }
    // Vendor filter
    if (vendor) {
      where.vendor = {
        contains: vendor,
      };
    }
    // Date range filter
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }
    // Amount range filter
    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) {
        where.amount.gte = parseFloat(minAmount);
      }
      if (maxAmount) {
        where.amount.lte = parseFloat(maxAmount);
      }
    }
    try {
      // Record start time for performance monitoring
      const queryStartTime = Date.now();

      // Get total count for pagination
      const totalExpenses = await prisma.expense.count({ where });

      // Get expenses with filters and pagination
      const expenses = await prisma.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          date: "desc",
        },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      // Calculate query execution time
      const queryTime = Date.now() - queryStartTime;
      console.log(`📊 Database query completed in ${queryTime}ms`);

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalExpenses / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      const result = {
        status: httpStatusText.SUCCESS,
        data: {
          message: "Expenses retrieved successfully",
          expenses,
          pagination: {
            currentPage: page,
            totalPages,
            totalExpenses,
            hasNextPage,
            hasPrevPage,
            limit,
          },
        },
      };

      // Cache the result for 5 minutes (300 seconds)
      try {
        await redis.setex(cacheKey, 300, JSON.stringify(result));
        console.log("✅ Data cached successfully with key:", cacheKey);
      } catch (cacheError) {
        console.warn("⚠️ Cache write error:", (cacheError as Error).message);
        // Continue without cache if error occurs
      }

      res.status(200).json(result);
    } catch (error) {
      console.error("❌ Error in getAllExpenses:", error);
      return next(new AppError("Failed to retrieve expenses", 500));
    }
  }
);
/**
 * Get expense by ID
 * Authorization: admin and auditor roles
 */
const getExpenseById = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (!expense) {
      return next(new AppError("Expense not found", 404));
    }

    res.status(200).json({
      status: httpStatusText.SUCCESS,
      data: {
        message: "Expense retrieved successfully",
        expense,
      },
    });
  }
);

/**
 * Create new expense
 * Authorization: admin role only
 */
const createExpense = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      amount,
      description,
      category,
      vendor,
      receiptUrl,
      date,
    }: CreateExpenseBody = req.body;
    const userId = (req as any).currentUser.id;

    const expense = await prisma.expense.create({
      data: {
        amount: parseFloat(amount),
        description,
        category,
        vendor: vendor || null,
        receiptUrl: receiptUrl || null,
        date: new Date(date),
        createdBy: userId,
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    // Invalidate all expense caches since data has changed
    try {
      const pattern = "expenses:*";
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(
          `🧹 Cache invalidated: ${keys.length} expense cache keys deleted`
        );
      }
    } catch (cacheError) {
      console.warn(
        "⚠️ Cache invalidation error:",
        (cacheError as Error).message
      );
      // Continue even if cache invalidation fails
    }

    res.status(201).json({
      status: httpStatusText.SUCCESS,
      data: {
        message: "Expense created successfully",
        expense,
      },
    });
  }
);

/**
 * Update expense
 * Authorization: admin role only
 */
const updateExpense = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const {
      amount,
      description,
      category,
      vendor,
      receiptUrl,
      date,
    }: UpdateExpenseBody = req.body;

    // Check if expense exists
    const existingExpense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!existingExpense) {
      return next(new AppError("Expense not found", 404));
    }

    // Build update data object
    const updateData: any = {};
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (vendor !== undefined) updateData.vendor = vendor || null;
    if (receiptUrl !== undefined) updateData.receiptUrl = receiptUrl || null;
    if (date !== undefined) updateData.date = new Date(date);

    const expense = await prisma.expense.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    // Invalidate all expense caches since data has changed
    try {
      const pattern = "expenses:*";
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(
          `🧹 Cache invalidated: ${keys.length} expense cache keys deleted`
        );
      }
    } catch (cacheError) {
      console.warn(
        "⚠️ Cache invalidation error:",
        (cacheError as Error).message
      );
      // Continue even if cache invalidation fails
    }

    res.status(200).json({
      status: httpStatusText.SUCCESS,
      data: {
        message: "Expense updated successfully",
        expense,
      },
    });
  }
);

/**
 * Delete expense
 * Authorization: admin role only
 */
const deleteExpense = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    // Check if expense exists
    const existingExpense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!existingExpense) {
      return next(new AppError("Expense not found", 404));
    }

    await prisma.expense.delete({
      where: { id },
    });

    // Invalidate all expense caches since data has changed
    try {
      const pattern = "expenses:*";
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(
          `🧹 Cache invalidated: ${keys.length} expense cache keys deleted`
        );
      }
    } catch (cacheError) {
      console.warn(
        "⚠️ Cache invalidation error:",
        (cacheError as Error).message
      );
      // Continue even if cache invalidation fails
    }

    res.status(200).json({
      status: httpStatusText.SUCCESS,
      data: {
        message: "Expense deleted successfully",
      },
    });
  }
);

/**
 * Get expenses by category
 * Authorization: admin and auditor roles
 */
const getExpensesByCategory = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const { category } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const where = {
      category: {
        contains: category,
      },
    };

    const totalExpenses = await prisma.expense.count({ where });

    const expenses = await prisma.expense.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        date: "desc",
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    const totalPages = Math.ceil(totalExpenses / limit);

    res.status(200).json({
      status: httpStatusText.SUCCESS,
      data: {
        message: `Expenses in category '${category}' retrieved successfully`,
        expenses,
        pagination: {
          currentPage: page,
          totalPages,
          totalExpenses,
          limit,
        },
      },
    });
  }
);

/**
 * Get expenses by vendor
 * Authorization: admin and auditor roles
 */
const getExpensesByVendor = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const { vendor } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const where = {
      vendor: {
        contains: vendor,
      },
    };

    const totalExpenses = await prisma.expense.count({ where });

    const expenses = await prisma.expense.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        date: "desc",
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    const totalPages = Math.ceil(totalExpenses / limit);

    res.status(200).json({
      status: httpStatusText.SUCCESS,
      data: {
        message: `Expenses from vendor '${vendor}' retrieved successfully`,
        expenses,
        pagination: {
          currentPage: page,
          totalPages,
          totalExpenses,
          limit,
        },
      },
    });
  }
);

export {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpensesByCategory,
  getExpensesByVendor,
};
