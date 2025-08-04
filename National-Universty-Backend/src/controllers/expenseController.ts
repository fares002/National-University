import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma";
import asyncWrapper from "../middlewares/asyncWrapper";
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


//create interface
interface CreateExpenseBody {
amount: string;
description: string;
category: ExpenseCategory;
vendor?: string;
receiptUrl?: string;
date: string;
}

//update interface
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
    // Build where clause
    const where: any = {};
    // Text search across description, category, and vendor
    if (search) {
    where.OR = [
        {
        description: {
            contains: search,
            mode: "insensitive",
        },
        },
        {
        category: {
            contains: search,
            mode: "insensitive",
        },
        },
        {
        vendor: {
            contains: search,
            mode: "insensitive",
        },
        },
    ];
    }
    // Category filter
    if (category) {
    where.category = {
        contains: category,
        mode: "insensitive",
    };
    }
    // Vendor filter
    if (vendor) {
    where.vendor = {
        contains: vendor,
        mode: "insensitive",
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
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalExpenses / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    res.status(200).json({
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
    });
    } catch (error) {
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
    try {
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
    } catch (error) {
    return next(new AppError("Failed to retrieve expense", 500));
    }
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
    try {
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
    res.status(201).json({
        status: httpStatusText.SUCCESS,
        data: {
        message: "Expense created successfully",
        expense,
        },
    });
    } catch (error) {
    return next(new AppError("Failed to create expense", 500));
    }
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
    try {
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
    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: {
        message: "Expense updated successfully",
        expense,
        },
    });
    } catch (error) {
    return next(new AppError("Failed to update expense", 500));
    }
}
);
/**
 * Delete expense
 * Authorization: admin role only
 */
const deleteExpense = asyncWrapper(
async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    try {
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
    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: {
        message: "Expense deleted successfully",
        },
    });
    } catch (error) {
    return next(new AppError("Failed to delete expense", 500));
    }
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
    try {
    const where = {
        category: {
        contains: category,
        mode: "insensitive" as const,
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
    } catch (error) {
    return next(new AppError("Failed to retrieve expenses by category", 500));
    }
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
    try {
    const where = {
        vendor: {
        contains: vendor,
        mode: "insensitive" as const,
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
    } catch (error) {
    return next(new AppError("Failed to retrieve expenses by vendor", 500));
    }
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