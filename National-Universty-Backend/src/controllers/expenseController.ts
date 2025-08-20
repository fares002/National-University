import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma";
import asyncWrapper from "../middlewares/asyncWrapper";
import redis, {
  invalidateDashboardCache,
  invalidateExpenseCache,
} from "../utils/redis";
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

      // 📊 Calculate additional statistics
      console.log(`📊 Calculating expense statistics...`);

      // Get today's date range
      const today = new Date();
      const startOfToday = new Date(today);
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date(today);
      endOfToday.setHours(23, 59, 59, 999);

      // Get current month's date range
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

      // Calculate daily expenses (today)
      const dailyExpensesQuery = await prisma.expense.aggregate({
        where: {
          date: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
      });

      // Calculate monthly expenses for average calculation
      const monthlyExpensesQuery = await prisma.expense.aggregate({
        where: {
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
      });

      // Calculate number of days in current month
      const daysInMonth = endOfMonth.getDate();

      // Calculate average daily expenditure for current month
      const totalMonthlyAmount = monthlyExpensesQuery._sum.amount || 0;
      const averageDailyExpenditure = Number(totalMonthlyAmount) / daysInMonth;

      // Create statistics object
      const statistics = {
        daily: {
          totalAmount: Number(dailyExpensesQuery._sum.amount || 0),
          operationsCount: dailyExpensesQuery._count.id || 0,
          date: today.toISOString().split("T")[0], // Today's date in YYYY-MM-DD format
        },
        monthly: {
          totalAmount: Number(totalMonthlyAmount),
          operationsCount: monthlyExpensesQuery._count.id || 0,
          averageDailyExpenditure: Number(averageDailyExpenditure.toFixed(2)),
          month: `${today.getFullYear()}-${String(
            today.getMonth() + 1
          ).padStart(2, "0")}`,
          daysInMonth,
        },
      };

      console.log(
        `📊 Statistics calculated: Daily: ${statistics.daily.operationsCount} ops, Monthly avg: ${statistics.monthly.averageDailyExpenditure}`
      );

      const result = {
        status: httpStatusText.SUCCESS,
        data: {
          message: "Expenses retrieved successfully",
          expenses,
          statistics, // Add statistics to the response
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
 * Quick search expenses
 * GET /api/expenses/search?q=term&page=&limit=
 * Access: admin, auditor
 */
const searchExpenses = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const q = (req.query.q as string) || "";
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "10", 10);
    const skip = (page - 1) * limit;

    if (!q.trim()) {
      return res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: {
          expenses: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalExpenses: 0,
            hasNextPage: false,
            hasPrevPage: false,
            limit,
          },
        },
      });
    }

    const where: any = {
      OR: [
        { description: { contains: q } },
        { category: { contains: q } },
        { vendor: { contains: q } },
      ],
    };

    const [expenses, totalExpenses] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: "desc" },
        include: {
          creator: { select: { id: true, username: true, email: true } },
        },
      }),
      prisma.expense.count({ where }),
    ]);

    const totalPages = Math.ceil(totalExpenses / limit);

    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      data: {
        expenses,
        pagination: {
          currentPage: page,
          totalPages,
          totalExpenses,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit,
        },
      },
    });
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

    // Invalidate dashboard cache to ensure real-time updates
    try {
      await invalidateDashboardCache();
      await invalidateExpenseCache();
      console.log("🧹 Dashboard and expense caches invalidated successfully");
    } catch (cacheError) {
      console.warn(
        "⚠️ Dashboard cache invalidation error:",
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
  searchExpenses,
};
