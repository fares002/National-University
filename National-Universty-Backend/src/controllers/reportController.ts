import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma";
import asyncWrapper from "../middlewares/asyncWrapper";
import redis from "../utils/redis";
import AppError from "../utils/AppError";
import { httpStatusText } from "../utils/httpStatusText";
import { generatePDF, ReportData } from "../utils/pdfGenerator";
import {
  generateHorizontalMonthlyPDF,
  HorizontalMonthlyData,
} from "../utils/pdfHorizontalMonthly";

// Types for report data
interface DailyReportData {
  date: string;
  payments: {
    total: number;
    totalUSD: number;
    count: number;
    byFeeType: Record<string, { count: number; total: number }>;
    byPaymentMethod: Record<string, { count: number; total: number }>;
  };
  expenses: {
    total: number;
    totalUSD: number;
    count: number;
    byCategory: Record<string, { count: number; total: number }>;
    topVendors: Array<{ vendor: string; total: number; count: number }>;
  };
  netIncome: number;
  netIncomeUSD: number;
}

interface MonthlyReportData {
  year: number;
  month: number;
  monthName: string;
  payments: {
    total: number;
    totalUSD: number;
    count: number;
    byFeeType: Record<string, { count: number; total: number }>;
    byPaymentMethod: Record<string, { count: number; total: number }>;
    dailyBreakdown: Array<{
      date: string;
      total: number;
      count: number;
    }>;
  };
  expenses: {
    total: number;
    totalUSD: number;
    count: number;
    byCategory: Record<string, { count: number; total: number }>;
    topVendors: Array<{ vendor: string; total: number; count: number }>;
    dailyBreakdown: Array<{
      date: string;
      total: number;
      count: number;
    }>;
  };
  netIncome: number;
  netIncomeUSD: number;
  comparison: {
    previousMonth: {
      paymentsChange: number;
      expensesChange: number;
      netIncomeChange: number;
    };
  };
}


/**
 * Get daily financial report
 * Authorization: admin and auditor roles
 */
const getDailyReport = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const { date } = req.params;

    // Set date range for the day
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    try {
      // Get payments for the day
      const payments = await prisma.payment.findMany({
        where: {
          paymentDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        select: {
          amount: true,
          amountUSD: true,
          usdAppliedRate: true,
          feeType: true,
          paymentMethod: true,
          studentName: true,
          receiptNumber: true,
        },
      });

      // Get expenses for the day
      const expenses = await prisma.expense.findMany({
        where: {
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        select: {
          amount: true,
          amountUSD: true,
          usdAppliedRate: true,
          category: true,
          vendor: true,
          description: true,
        },
      });

      // Calculate payment statistics
      const paymentTotal = payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );
      const paymentTotalUSD = payments.reduce(
        (sum, p) => sum + (p.amountUSD ? Number(p.amountUSD) : 0),
        0
      );
      const paymentsByFeeType: Record<
        string,
        { count: number; total: number }
      > = {};
      const paymentsByMethod: Record<string, { count: number; total: number }> =
        {};

      payments.forEach((payment) => {
        // Group by fee type
        if (!paymentsByFeeType[payment.feeType]) {
          paymentsByFeeType[payment.feeType] = { count: 0, total: 0 };
        }
        paymentsByFeeType[payment.feeType].count++;
        paymentsByFeeType[payment.feeType].total += Number(payment.amount);

        // Group by payment method
        if (!paymentsByMethod[payment.paymentMethod]) {
          paymentsByMethod[payment.paymentMethod] = { count: 0, total: 0 };
        }
        paymentsByMethod[payment.paymentMethod].count++;
        paymentsByMethod[payment.paymentMethod].total += Number(payment.amount);
      });

      // Calculate expense statistics
      const expenseTotal = expenses.reduce(
        (sum, e) => sum + Number(e.amount),
        0
      );
      const expenseTotalUSD = expenses.reduce(
        (sum, e) => sum + (e.amountUSD ? Number(e.amountUSD) : 0),
        0
      );
      const expensesByCategory: Record<
        string,
        { count: number; total: number }
      > = {};
      const vendorTotals: Record<string, { count: number; total: number }> = {};

      expenses.forEach((expense) => {
        // Group by category
        if (!expensesByCategory[expense.category]) {
          expensesByCategory[expense.category] = { count: 0, total: 0 };
        }
        expensesByCategory[expense.category].count++;
        expensesByCategory[expense.category].total += Number(expense.amount);

        // Group by vendor (if exists)
        if (expense.vendor) {
          if (!vendorTotals[expense.vendor]) {
            vendorTotals[expense.vendor] = { count: 0, total: 0 };
          }
          vendorTotals[expense.vendor].count++;
          vendorTotals[expense.vendor].total += Number(expense.amount);
        }
      });

      // Get top 5 vendors
      const topVendors = Object.entries(vendorTotals)
        .map(([vendor, data]) => ({ vendor, ...data }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      // Calculate net income
      const netIncome = paymentTotal - expenseTotal;
      const netIncomeUSD = paymentTotalUSD - expenseTotalUSD;

      const reportData: DailyReportData = {
        date: targetDate.toISOString().split("T")[0],
        payments: {
          total: paymentTotal,
          totalUSD: Number(paymentTotalUSD.toFixed(2)),
          count: payments.length,
          byFeeType: paymentsByFeeType,
          byPaymentMethod: paymentsByMethod,
        },
        expenses: {
          total: expenseTotal,
          totalUSD: Number(expenseTotalUSD.toFixed(2)),
          count: expenses.length,
          byCategory: expensesByCategory,
          topVendors,
        },
        netIncome,
        netIncomeUSD: Number(netIncomeUSD.toFixed(2)),
      };

      return res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: {
          message: "Daily report retrieved successfully",
          report: reportData,
        },
      });
    } catch (error) {
      return next(new AppError("Failed to generate daily report", 500));
    }
  }
);


/**
 * Get monthly financial report
 * Authorization: admin and auditor roles
 */
const getMonthlyReport = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const { year, month } = req.params;

    const targetYear = parseInt(year);
    const targetMonth = parseInt(month);

    // Set date range for the month
    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    // Previous month for comparison
    const previousMonth = targetMonth === 1 ? 12 : targetMonth - 1;
    const previousYear = targetMonth === 1 ? targetYear - 1 : targetYear;
    const startOfPreviousMonth = new Date(previousYear, previousMonth - 1, 1);
    const endOfPreviousMonth = new Date(
      previousYear,
      previousMonth,
      0,
      23,
      59,
      59,
      999
    );

    try {
      // Get current month data
      const [payments, expenses, previousPayments, previousExpenses] =
        await Promise.all([
          prisma.payment.findMany({
            where: {
              paymentDate: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
            },
            select: {
              amount: true,
              amountUSD: true,
              usdAppliedRate: true,
              feeType: true,
              paymentMethod: true,
              paymentDate: true,
            },
          }),
          prisma.expense.findMany({
            where: {
              date: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
            },
            select: {
              amount: true,
              amountUSD: true,
              usdAppliedRate: true,
              category: true,
              vendor: true,
              date: true,
            },
          }),
          prisma.payment.findMany({
            where: {
              paymentDate: {
                gte: startOfPreviousMonth,
                lte: endOfPreviousMonth,
              },
            },
            select: { amount: true },
          }),
          prisma.expense.findMany({
            where: {
              date: {
                gte: startOfPreviousMonth,
                lte: endOfPreviousMonth,
              },
            },
            select: { amount: true },
          }),
        ]);

      // Calculate current month statistics
      const paymentTotal = payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );
      const paymentTotalUSD = payments.reduce(
        (sum, p) => sum + (p.amountUSD ? Number(p.amountUSD) : 0),
        0
      );
      const expenseTotal = expenses.reduce(
        (sum, e) => sum + Number(e.amount),
        0
      );
      const expenseTotalUSD = expenses.reduce(
        (sum, e) => sum + (e.amountUSD ? Number(e.amountUSD) : 0),
        0
      );
      const netIncome = paymentTotal - expenseTotal;
      const netIncomeUSD = paymentTotalUSD - expenseTotalUSD;

      // Calculate previous month totals for comparison
      const previousPaymentTotal = previousPayments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );
      const previousExpenseTotal = previousExpenses.reduce(
        (sum, e) => sum + Number(e.amount),
        0
      );
      const previousNetIncome = previousPaymentTotal - previousExpenseTotal;

      // Calculate percentage changes
      const paymentsChange =
        previousPaymentTotal === 0
          ? 100
          : ((paymentTotal - previousPaymentTotal) / previousPaymentTotal) *
            100;
      const expensesChange =
        previousExpenseTotal === 0
          ? 100
          : ((expenseTotal - previousExpenseTotal) / previousExpenseTotal) *
            100;
      const netIncomeChange =
        previousNetIncome === 0
          ? 100
          : ((netIncome - previousNetIncome) / Math.abs(previousNetIncome)) *
            100;

      // Group payments by fee type and method
      const paymentsByFeeType: Record<
        string,
        { count: number; total: number }
      > = {};
      const paymentsByMethod: Record<string, { count: number; total: number }> =
        {};

      payments.forEach((payment) => {
        if (!paymentsByFeeType[payment.feeType]) {
          paymentsByFeeType[payment.feeType] = { count: 0, total: 0 };
        }
        paymentsByFeeType[payment.feeType].count++;
        paymentsByFeeType[payment.feeType].total += Number(payment.amount);

        if (!paymentsByMethod[payment.paymentMethod]) {
          paymentsByMethod[payment.paymentMethod] = { count: 0, total: 0 };
        }
        paymentsByMethod[payment.paymentMethod].count++;
        paymentsByMethod[payment.paymentMethod].total += Number(payment.amount);
      });

      // Group expenses by category and vendor
      const expensesByCategory: Record<
        string,
        { count: number; total: number }
      > = {};
      const vendorTotals: Record<string, { count: number; total: number }> = {};

      expenses.forEach((expense) => {
        if (!expensesByCategory[expense.category]) {
          expensesByCategory[expense.category] = { count: 0, total: 0 };
        }
        expensesByCategory[expense.category].count++;
        expensesByCategory[expense.category].total += Number(expense.amount);

        if (expense.vendor) {
          if (!vendorTotals[expense.vendor]) {
            vendorTotals[expense.vendor] = { count: 0, total: 0 };
          }
          vendorTotals[expense.vendor].count++;
          vendorTotals[expense.vendor].total += Number(expense.amount);
        }
      });

      const topVendors = Object.entries(vendorTotals)
        .map(([vendor, data]) => ({ vendor, ...data }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      // Daily breakdown for the month
      const paymentsDailyBreakdown = Array.from(
        payments.reduce((acc, payment) => {
          const date = payment.paymentDate.toISOString().split("T")[0];
          if (!acc.has(date)) {
            acc.set(date, { date, total: 0, count: 0 });
          }
          const dayData = acc.get(date)!;
          dayData.total += Number(payment.amount);
          dayData.count++;
          return acc;
        }, new Map<string, { date: string; total: number; count: number }>())
      ).map(([_, data]) => data);

      const expensesDailyBreakdown = Array.from(
        expenses.reduce((acc, expense) => {
          const date = expense.date.toISOString().split("T")[0];
          if (!acc.has(date)) {
            acc.set(date, { date, total: 0, count: 0 });
          }
          const dayData = acc.get(date)!;
          dayData.total += Number(expense.amount);
          dayData.count++;
          return acc;
        }, new Map<string, { date: string; total: number; count: number }>())
      ).map(([_, data]) => data);

      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      const reportData: MonthlyReportData = {
        year: targetYear,
        month: targetMonth,
        monthName: monthNames[targetMonth - 1],
        payments: {
          total: paymentTotal,
          totalUSD: Number(paymentTotalUSD.toFixed(2)),
          count: payments.length,
          byFeeType: paymentsByFeeType,
          byPaymentMethod: paymentsByMethod,
          dailyBreakdown: paymentsDailyBreakdown,
        },
        expenses: {
          total: expenseTotal,
          totalUSD: Number(expenseTotalUSD.toFixed(2)),
          count: expenses.length,
          byCategory: expensesByCategory,
          topVendors,
          dailyBreakdown: expensesDailyBreakdown,
        },
        netIncome,
        netIncomeUSD: Number(netIncomeUSD.toFixed(2)),
        comparison: {
          previousMonth: {
            paymentsChange: Math.round(paymentsChange * 100) / 100,
            expensesChange: Math.round(expensesChange * 100) / 100,
            netIncomeChange: Math.round(netIncomeChange * 100) / 100,
          },
        },
      };

      return res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: {
          message: "Monthly report retrieved successfully",
          report: reportData,
        },
      });
    } catch (error) {
      return next(new AppError("Failed to generate monthly report", 500));
    }
  }
);

/**
 * Get yearly financial report
 * Authorization: admin and auditor roles
 */
const getYearlyReport = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const { year } = req.params;
    const targetYear = parseInt(year);

    // Set date range for the year
    const startOfYear = new Date(targetYear, 0, 1);
    const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59, 999);

    // Previous year for comparison
    const startOfPreviousYear = new Date(targetYear - 1, 0, 1);
    const endOfPreviousYear = new Date(targetYear - 1, 11, 31, 23, 59, 59, 999);

    try {
      // Get year data
      const [payments, expenses, previousPayments, previousExpenses] =
        await Promise.all([
          prisma.payment.findMany({
            where: {
              paymentDate: {
                gte: startOfYear,
                lte: endOfYear,
              },
            },
            select: {
              amount: true,
              amountUSD: true,
              usdAppliedRate: true,
              feeType: true,
              paymentMethod: true,
              paymentDate: true,
            },
          }),
          prisma.expense.findMany({
            where: {
              date: {
                gte: startOfYear,
                lte: endOfYear,
              },
            },
            select: {
              amount: true,
              amountUSD: true,
              usdAppliedRate: true,
              category: true,
              vendor: true,
              date: true,
            },
          }),
          prisma.payment.findMany({
            where: {
              paymentDate: {
                gte: startOfPreviousYear,
                lte: endOfPreviousYear,
              },
            },
            select: { amount: true },
          }),
          prisma.expense.findMany({
            where: {
              date: {
                gte: startOfPreviousYear,
                lte: endOfPreviousYear,
              },
            },
            select: { amount: true },
          }),
        ]);

      // Calculate totals
      const paymentTotal = payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );
      const paymentTotalUSD = payments.reduce(
        (sum, p) => sum + (p.amountUSD ? Number(p.amountUSD) : 0),
        0
      );
      const expenseTotal = expenses.reduce(
        (sum, e) => sum + Number(e.amount),
        0
      );
      const expenseTotalUSD = expenses.reduce(
        (sum, e) => sum + (e.amountUSD ? Number(e.amountUSD) : 0),
        0
      );
      const netIncome = paymentTotal - expenseTotal;
      const netIncomeUSD = paymentTotalUSD - expenseTotalUSD;

      const previousPaymentTotal = previousPayments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );
      const previousExpenseTotal = previousExpenses.reduce(
        (sum, e) => sum + Number(e.amount),
        0
      );
      const previousNetIncome = previousPaymentTotal - previousExpenseTotal;

      // Calculate year-over-year changes
      const paymentsChange =
        previousPaymentTotal === 0
          ? 100
          : ((paymentTotal - previousPaymentTotal) / previousPaymentTotal) *
            100;
      const expensesChange =
        previousExpenseTotal === 0
          ? 100
          : ((expenseTotal - previousExpenseTotal) / previousExpenseTotal) *
            100;
      const netIncomeChange =
        previousNetIncome === 0
          ? 100
          : ((netIncome - previousNetIncome) / Math.abs(previousNetIncome)) *
            100;

      // Monthly breakdown for the year
      const monthlyBreakdown = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const monthStart = new Date(targetYear, i, 1);
        const monthEnd = new Date(targetYear, i + 1, 0, 23, 59, 59, 999);

        const monthPayments = payments.filter(
          (p) => p.paymentDate >= monthStart && p.paymentDate <= monthEnd
        );
        const monthExpenses = expenses.filter(
          (e) => e.date >= monthStart && e.date <= monthEnd
        );

        const monthPaymentTotal = monthPayments.reduce(
          (sum, p) => sum + Number(p.amount),
          0
        );
        const monthExpenseTotal = monthExpenses.reduce(
          (sum, e) => sum + Number(e.amount),
          0
        );

        return {
          month,
          monthName: new Date(targetYear, i, 1).toLocaleDateString("en-US", {
            month: "long",
          }),
          payments: {
            total: monthPaymentTotal,
            count: monthPayments.length,
          },
          expenses: {
            total: monthExpenseTotal,
            count: monthExpenses.length,
          },
          netIncome: monthPaymentTotal - monthExpenseTotal,
        };
      });

      // Group by categories and fee types
      const paymentsByFeeType: Record<
        string,
        { count: number; total: number }
      > = {};
      const paymentsByMethod: Record<string, { count: number; total: number }> =
        {};
      const expensesByCategory: Record<
        string,
        { count: number; total: number }
      > = {};
      const vendorTotals: Record<string, { count: number; total: number }> = {};

      payments.forEach((payment) => {
        if (!paymentsByFeeType[payment.feeType]) {
          paymentsByFeeType[payment.feeType] = { count: 0, total: 0 };
        }
        paymentsByFeeType[payment.feeType].count++;
        paymentsByFeeType[payment.feeType].total += Number(payment.amount);

        if (!paymentsByMethod[payment.paymentMethod]) {
          paymentsByMethod[payment.paymentMethod] = { count: 0, total: 0 };
        }
        paymentsByMethod[payment.paymentMethod].count++;
        paymentsByMethod[payment.paymentMethod].total += Number(payment.amount);
      });

      expenses.forEach((expense) => {
        if (!expensesByCategory[expense.category]) {
          expensesByCategory[expense.category] = { count: 0, total: 0 };
        }
        expensesByCategory[expense.category].count++;
        expensesByCategory[expense.category].total += Number(expense.amount);

        if (expense.vendor) {
          if (!vendorTotals[expense.vendor]) {
            vendorTotals[expense.vendor] = { count: 0, total: 0 };
          }
          vendorTotals[expense.vendor].count++;
          vendorTotals[expense.vendor].total += Number(expense.amount);
        }
      });

      const topVendors = Object.entries(vendorTotals)
        .map(([vendor, data]) => ({ vendor, ...data }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 15);

      const reportData = {
        year: targetYear,
        summary: {
          payments: {
            total: paymentTotal,
            totalUSD: Number(paymentTotalUSD.toFixed(2)),
            count: payments.length,
            byFeeType: paymentsByFeeType,
            byPaymentMethod: paymentsByMethod,
          },
          expenses: {
            total: expenseTotal,
            totalUSD: Number(expenseTotalUSD.toFixed(2)),
            count: expenses.length,
            byCategory: expensesByCategory,
            topVendors,
          },
          netIncome,
          netIncomeUSD: Number(netIncomeUSD.toFixed(2)),
        },
        monthlyBreakdown,
        comparison: {
          previousYear: {
            paymentsChange: Math.round(paymentsChange * 100) / 100,
            expensesChange: Math.round(expensesChange * 100) / 100,
            netIncomeChange: Math.round(netIncomeChange * 100) / 100,
          },
        },
      };

      return res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: {
          message: "Yearly report retrieved successfully",
          report: reportData,
        },
      });
    } catch (error) {
      return next(new AppError("Failed to generate yearly report", 500));
    }
  }
);


/**
 * Get dashboard report with comprehensive financial overview
 * Authorization: admin and auditor roles
 */
const getDashboardReport = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Create unique cache key based on current date (day precision)
    const cacheKey = `dashboard:report:${currentYear}:${currentMonth}:${now.getDate()}`;

    // Try to get data from cache first
    try {
      console.log("🔍 Checking cache for dashboard report...");
      const cachedData = await redis.get(cacheKey);

      if (cachedData) {
        console.log("🚀 CACHE HIT! Returning cached dashboard data");
        const parsedData = JSON.parse(cachedData);

        return res.status(200).json({
          ...parsedData,
          data: {
            ...parsedData.data,
            cached: true, // Flag to indicate data came from cache
          },
        });
      }

      console.log("📂 CACHE MISS! Fetching dashboard data from database");
    } catch (cacheError) {
      console.warn("⚠️ Cache read error:", (cacheError as Error).message);
      // Continue without cache if error occurs
    }

    // Current month date range
    const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);
    const endOfCurrentMonth = new Date(
      currentYear,
      currentMonth + 1,
      0,
      23,
      59,
      59,
      999
    );

    // Previous month date range
    const startOfPreviousMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfPreviousMonth = new Date(
      currentYear,
      currentMonth,
      0,
      23,
      59,
      59,
      999
    );

    // Today's date range
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    try {
      // Get all required data in parallel
      const [
        currentMonthPayments,
        currentMonthExpenses,
        previousMonthPayments,
        previousMonthExpenses,
        lastPayment,
        lastExpense,
        todayTransactions,
      ] = await Promise.all([
        // Current month payments
        prisma.payment.findMany({
          where: {
            paymentDate: {
              gte: startOfCurrentMonth,
              lte: endOfCurrentMonth,
            },
          },
          select: {
            amount: true,
            amountUSD: true,
            usdAppliedRate: true,
            paymentDate: true,
          },
        }),
        // Current month expenses
        prisma.expense.findMany({
          where: {
            date: {
              gte: startOfCurrentMonth,
              lte: endOfCurrentMonth,
            },
          },
          select: {
            amount: true,
            amountUSD: true,
            usdAppliedRate: true,
            date: true,
          },
        }),
        // Previous month payments
        prisma.payment.findMany({
          where: {
            paymentDate: {
              gte: startOfPreviousMonth,
              lte: endOfPreviousMonth,
            },
          },
          select: { amount: true, amountUSD: true },
        }),
        // Previous month expenses
        prisma.expense.findMany({
          where: {
            date: {
              gte: startOfPreviousMonth,
              lte: endOfPreviousMonth,
            },
          },
          select: { amount: true, amountUSD: true },
        }),
        // Last payment (most recent)
        prisma.payment.findFirst({
          orderBy: { paymentDate: "desc" },
          select: {
            id: true,
            amount: true,
            studentName: true,
            feeType: true,
            paymentMethod: true,
            paymentDate: true,
            receiptNumber: true,
          },
        }),
        // Last expense (most recent)
        prisma.expense.findFirst({
          orderBy: { date: "desc" },
          select: {
            id: true,
            amount: true,
            category: true,
            vendor: true,
            description: true,
            date: true,
          },
        }),
        // Today's transactions count
        Promise.all([
          prisma.payment.count({
            where: {
              paymentDate: {
                gte: startOfToday,
                lte: endOfToday,
              },
            },
          }),
          prisma.expense.count({
            where: {
              date: {
                gte: startOfToday,
                lte: endOfToday,
              },
            },
          }),
        ]),
      ]);

      // Calculate current month totals
      const currentMonthPaymentTotal = currentMonthPayments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );
      const currentMonthPaymentTotalUSD = currentMonthPayments.reduce(
        (sum, p) => sum + (p.amountUSD ? Number(p.amountUSD) : 0),
        0
      );
      const currentMonthExpenseTotal = currentMonthExpenses.reduce(
        (sum, e) => sum + Number(e.amount),
        0
      );
      const currentMonthExpenseTotalUSD = currentMonthExpenses.reduce(
        (sum, e) => sum + (e.amountUSD ? Number(e.amountUSD) : 0),
        0
      );
      const currentMonthNetProfit =
        currentMonthPaymentTotal - currentMonthExpenseTotal;
      const currentMonthNetProfitUSD =
        currentMonthPaymentTotalUSD - currentMonthExpenseTotalUSD;

      // Calculate previous month totals
      const previousMonthPaymentTotal = previousMonthPayments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );
      const previousMonthPaymentTotalUSD = previousMonthPayments.reduce(
        (sum, p) => sum + (p.amountUSD ? Number(p.amountUSD) : 0),
        0
      );
      const previousMonthExpenseTotal = previousMonthExpenses.reduce(
        (sum, e) => sum + Number(e.amount),
        0
      );
      const previousMonthExpenseTotalUSD = previousMonthExpenses.reduce(
        (sum, e) => sum + (e.amountUSD ? Number(e.amountUSD) : 0),
        0
      );

      // Calculate percentage changes
      const paymentChange =
        previousMonthPaymentTotal === 0
          ? currentMonthPaymentTotal > 0
            ? 100
            : 0
          : ((currentMonthPaymentTotal - previousMonthPaymentTotal) /
              previousMonthPaymentTotal) *
            100;

      const expenseChange =
        previousMonthExpenseTotal === 0
          ? currentMonthExpenseTotal > 0
            ? 100
            : 0
          : ((currentMonthExpenseTotal - previousMonthExpenseTotal) /
              previousMonthExpenseTotal) *
            100;

      // Calculate daily breakdown for current month
      const dailyBreakdown: Array<{
        date: string;
        payments: { total: number; count: number };
        expenses: { total: number; count: number };
        netIncome: number;
        totalTransactions: number;
      }> = [];
      const dailyPaymentsMap = new Map<
        string,
        { total: number; count: number }
      >();
      const dailyExpensesMap = new Map<
        string,
        { total: number; count: number }
      >();

      // Group payments by day
      currentMonthPayments.forEach((payment) => {
        const day = payment.paymentDate.toISOString().split("T")[0];
        if (!dailyPaymentsMap.has(day)) {
          dailyPaymentsMap.set(day, { total: 0, count: 0 });
        }
        const dayData = dailyPaymentsMap.get(day)!;
        dayData.total += Number(payment.amount);
        dayData.count++;
      });

      // Group expenses by day
      currentMonthExpenses.forEach((expense) => {
        const day = expense.date.toISOString().split("T")[0];
        if (!dailyExpensesMap.has(day)) {
          dailyExpensesMap.set(day, { total: 0, count: 0 });
        }
        const dayData = dailyExpensesMap.get(day)!;
        dayData.total += Number(expense.amount);
        dayData.count++;
      });

      // Create daily breakdown
      const allDays = new Set([
        ...dailyPaymentsMap.keys(),
        ...dailyExpensesMap.keys(),
      ]);
      allDays.forEach((day) => {
        const payments = dailyPaymentsMap.get(day) || { total: 0, count: 0 };
        const expenses = dailyExpensesMap.get(day) || { total: 0, count: 0 };

        dailyBreakdown.push({
          date: day,
          payments: {
            total: payments.total,
            count: payments.count,
          },
          expenses: {
            total: expenses.total,
            count: expenses.count,
          },
          netIncome: payments.total - expenses.total,
          totalTransactions: payments.count + expenses.count,
        });
      });

      // Sort daily breakdown by date
      dailyBreakdown.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const dashboardData = {
        overview: {
          currentMonth: {
            payments: {
              total: currentMonthPaymentTotal,
              totalUSD: Number(currentMonthPaymentTotalUSD.toFixed(2)),
              count: currentMonthPayments.length,
            },
            expenses: {
              total: currentMonthExpenseTotal,
              totalUSD: Number(currentMonthExpenseTotalUSD.toFixed(2)),
              count: currentMonthExpenses.length,
            },
            netProfit: currentMonthNetProfit,
            netProfitUSD: Number(currentMonthNetProfitUSD.toFixed(2)),
            totalTransactions:
              currentMonthPayments.length + currentMonthExpenses.length,
          },
          previousMonth: {
            payments: {
              total: previousMonthPaymentTotal,
              totalUSD: Number(previousMonthPaymentTotalUSD.toFixed(2)),
              count: previousMonthPayments.length,
            },
            expenses: {
              total: previousMonthExpenseTotal,
              totalUSD: Number(previousMonthExpenseTotalUSD.toFixed(2)),
              count: previousMonthExpenses.length,
            },
            netProfit: previousMonthPaymentTotal - previousMonthExpenseTotal,
            netProfitUSD: Number(
              (
                previousMonthPaymentTotalUSD - previousMonthExpenseTotalUSD
              ).toFixed(2)
            ),
          },
          comparison: {
            paymentChange: Math.round(paymentChange * 100) / 100,
            expenseChange: Math.round(expenseChange * 100) / 100,
            paymentTrend: paymentChange >= 0 ? "increase" : "decrease",
            expenseTrend: expenseChange >= 0 ? "increase" : "decrease",
          },
        },
        recentActivity: {
          lastPayment: lastPayment
            ? {
                ...lastPayment,
                amount: Number(lastPayment.amount),
                timeSince: Math.floor(
                  (now.getTime() - lastPayment.paymentDate.getTime()) /
                    (1000 * 60 * 60 * 24)
                ), // days ago
              }
            : null,
          lastExpense: lastExpense
            ? {
                ...lastExpense,
                amount: Number(lastExpense.amount),
                timeSince: Math.floor(
                  (now.getTime() - lastExpense.date.getTime()) /
                    (1000 * 60 * 60 * 24)
                ), // days ago
              }
            : null,
        },
        todayMetrics: {
          totalTransactions: todayTransactions[0] + todayTransactions[1],
          paymentsCount: todayTransactions[0],
          expensesCount: todayTransactions[1],
        },
        dailyBreakdown,
        metadata: {
          currentMonth: now.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          }),
          previousMonth: new Date(
            currentYear,
            currentMonth - 1,
            1
          ).toLocaleDateString("en-US", { month: "long", year: "numeric" }),
          generatedAt: now.toISOString(),
          daysInCurrentMonth: dailyBreakdown.length,
        },
      };

      const result = {
        status: httpStatusText.SUCCESS,
        data: {
          message: "Dashboard report retrieved successfully",
          dashboard: dashboardData,
        },
      };

      // Cache the result for 10 minutes (600 seconds) since dashboard data changes frequently
      try {
        await redis.setex(cacheKey, 600, JSON.stringify(result));
        console.log(
          "✅ Dashboard data cached successfully with key:",
          cacheKey
        );
      } catch (cacheError) {
        console.warn("⚠️ Cache write error:", (cacheError as Error).message);
        // Continue without cache if error occurs
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error("Dashboard report error:", error);
      return next(new AppError("Failed to generate dashboard report", 500));
    }
  }
);


/**
 * Get financial summary (current month, quarter, year overview)
 * Authorization: admin and auditor roles
 */
const getFinancialSummary = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentQuarter = Math.floor(currentMonth / 3) + 1;

    // This month
    const startOfThisMonth = new Date(currentYear, currentMonth, 1);
    const endOfThisMonth = new Date(
      currentYear,
      currentMonth + 1,
      0,
      23,
      59,
      59,
      999
    );

    // This quarter
    const startOfQuarter = new Date(currentYear, (currentQuarter - 1) * 3, 1);
    const endOfQuarter = new Date(
      currentYear,
      currentQuarter * 3,
      0,
      23,
      59,
      59,
      999
    );

    // This year
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

    try {
      // Get all data in parallel
      const [
        monthPayments,
        monthExpenses,
        quarterPayments,
        quarterExpenses,
        yearPayments,
        yearExpenses,
      ] = await Promise.all([
        // This month
        prisma.payment.findMany({
          where: {
            paymentDate: { gte: startOfThisMonth, lte: endOfThisMonth },
          },
          select: { amount: true, amountUSD: true },
        }),
        prisma.expense.findMany({
          where: { date: { gte: startOfThisMonth, lte: endOfThisMonth } },
          select: { amount: true, amountUSD: true },
        }),
        // This quarter
        prisma.payment.findMany({
          where: { paymentDate: { gte: startOfQuarter, lte: endOfQuarter } },
          select: { amount: true, amountUSD: true },
        }),
        prisma.expense.findMany({
          where: { date: { gte: startOfQuarter, lte: endOfQuarter } },
          select: { amount: true, amountUSD: true },
        }),
        // This year
        prisma.payment.findMany({
          where: { paymentDate: { gte: startOfYear, lte: endOfYear } },
          select: { amount: true, amountUSD: true },
        }),
        prisma.expense.findMany({
          where: { date: { gte: startOfYear, lte: endOfYear } },
          select: { amount: true, amountUSD: true },
        }),
      ]);

      const calc = (arr: any[]) =>
        arr.reduce((s, x) => s + Number(x.amount), 0);
      const calcUSD = (arr: any[]) =>
        arr.reduce((s, x) => s + (x.amountUSD ? Number(x.amountUSD) : 0), 0);

      const monthPaymentsTotal = calc(monthPayments);
      const monthPaymentsTotalUSD = calcUSD(monthPayments);
      const monthExpensesTotal = calc(monthExpenses);
      const monthExpensesTotalUSD = calcUSD(monthExpenses);

      const quarterPaymentsTotal = calc(quarterPayments);
      const quarterPaymentsTotalUSD = calcUSD(quarterPayments);
      const quarterExpensesTotal = calc(quarterExpenses);
      const quarterExpensesTotalUSD = calcUSD(quarterExpenses);

      const yearPaymentsTotal = calc(yearPayments);
      const yearPaymentsTotalUSD = calcUSD(yearPayments);
      const yearExpensesTotal = calc(yearExpenses);
      const yearExpensesTotalUSD = calcUSD(yearExpenses);

      const summary = {
        thisMonth: {
          payments: monthPaymentsTotal,
          paymentsUSD: Number(monthPaymentsTotalUSD.toFixed(2)),
          expenses: monthExpensesTotal,
          expensesUSD: Number(monthExpensesTotalUSD.toFixed(2)),
          netIncome: monthPaymentsTotal - monthExpensesTotal,
          netIncomeUSD: Number(
            (monthPaymentsTotalUSD - monthExpensesTotalUSD).toFixed(2)
          ),
          paymentsCount: monthPayments.length,
          expensesCount: monthExpenses.length,
        },
        thisQuarter: {
          payments: quarterPaymentsTotal,
          paymentsUSD: Number(quarterPaymentsTotalUSD.toFixed(2)),
          expenses: quarterExpensesTotal,
          expensesUSD: Number(quarterExpensesTotalUSD.toFixed(2)),
          netIncome: quarterPaymentsTotal - quarterExpensesTotal,
          netIncomeUSD: Number(
            (quarterPaymentsTotalUSD - quarterExpensesTotalUSD).toFixed(2)
          ),
          paymentsCount: quarterPayments.length,
          expensesCount: quarterExpenses.length,
          quarter: currentQuarter,
        },
        thisYear: {
          payments: yearPaymentsTotal,
          paymentsUSD: Number(yearPaymentsTotalUSD.toFixed(2)),
          expenses: yearExpensesTotal,
          expensesUSD: Number(yearExpensesTotalUSD.toFixed(2)),
          netIncome: yearPaymentsTotal - yearExpensesTotal,
          netIncomeUSD: Number(
            (yearPaymentsTotalUSD - yearExpensesTotalUSD).toFixed(2)
          ),
          paymentsCount: yearPayments.length,
          expensesCount: yearExpenses.length,
          year: currentYear,
        },
      };

      return res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: {
          message: "Financial summary retrieved successfully",
          summary,
        },
      });
    } catch (error) {
      return next(new AppError("Failed to generate financial summary", 500));
    }
  }
);


/**
 * Download daily report as PDF
 * Authorization: admin and auditor roles
 */
const downloadDailyReportPDF = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const { date } = req.params;

    // Set date range for the day
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    try {
      // Get payments and expenses for the day
      const [payments, expenses] = await Promise.all([
        prisma.payment.findMany({
          where: {
            paymentDate: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
          select: {
            id: true,
            amount: true,
            amountUSD: true,
            usdAppliedRate: true,
            feeType: true,
            paymentMethod: true,
            studentName: true,
            receiptNumber: true,
            paymentDate: true,
            notes: true,
          },
          orderBy: {
            paymentDate: "asc",
          },
        }),
        prisma.expense.findMany({
          where: {
            date: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
          select: {
            id: true,
            amount: true,
            amountUSD: true,
            usdAppliedRate: true,
            category: true,
            vendor: true,
            description: true,
            date: true,
          },
          orderBy: {
            date: "asc",
          },
        }),
      ]);

      // Calculate totals
      const totalPayments = payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );
      const totalPaymentsUSD = payments.reduce(
        (sum, p) => sum + (p.amountUSD ? Number(p.amountUSD) : 0),
        0
      );
      const totalExpenses = expenses.reduce(
        (sum, e) => sum + Number(e.amount),
        0
      );
      const totalExpensesUSD = expenses.reduce(
        (sum, e) => sum + (e.amountUSD ? Number(e.amountUSD) : 0),
        0
      );
      const netIncome = totalPayments - totalExpenses;
      const netIncomeUSD = totalPaymentsUSD - totalExpensesUSD;

      // Prepare report data
      const reportData: ReportData = {
        title: "التقرير المالي اليومي",
        subtitle: `Date: ${targetDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}`,
        date: targetDate.toISOString().split("T")[0],
        payments,
        expenses,
        summary: {
          totalPayments,
          totalPaymentsUSD: Number(totalPaymentsUSD.toFixed(2)),
          totalExpenses,
          totalExpensesUSD: Number(totalExpensesUSD.toFixed(2)),
          netIncome,
          netIncomeUSD: Number(netIncomeUSD.toFixed(2)),
          paymentCount: payments.length,
          expenseCount: expenses.length,
        },
      };

      const filename = `daily-report-${date}.pdf`;
      await generatePDF(reportData, filename, res);
    } catch (error) {
      console.error("Daily PDF generation error:", error);
      return next(
        new AppError(
          `Failed to generate daily report PDF: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          500
        )
      );
    }
  }
);


/**
 * Download monthly report as PDF
 * Authorization: admin and auditor roles
 */
const downloadMonthlyReportPDF = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const { year, month } = req.params;

    const targetYear = parseInt(year);
    const targetMonth = parseInt(month);

    // Set date range for the month
    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    try {
      // Get payments and expenses for the month
      const [payments, expenses] = await Promise.all([
        prisma.payment.findMany({
          where: {
            paymentDate: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          select: {
            id: true,
            amount: true,
            amountUSD: true,
            usdAppliedRate: true,
            feeType: true,
            paymentMethod: true,
            studentName: true,
            receiptNumber: true,
            paymentDate: true,
            notes: true,
          },
          orderBy: {
            paymentDate: "asc",
          },
        }),
        prisma.expense.findMany({
          where: {
            date: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          select: {
            id: true,
            amount: true,
            amountUSD: true,
            usdAppliedRate: true,
            category: true,
            vendor: true,
            description: true,
            date: true,
          },
          orderBy: {
            date: "asc",
          },
        }),
      ]);

      // Calculate totals
      const totalPayments = payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );
      const totalPaymentsUSD = payments.reduce(
        (sum, p) => sum + (p.amountUSD ? Number(p.amountUSD) : 0),
        0
      );
      const totalExpenses = expenses.reduce(
        (sum, e) => sum + Number(e.amount),
        0
      );
      const totalExpensesUSD = expenses.reduce(
        (sum, e) => sum + (e.amountUSD ? Number(e.amountUSD) : 0),
        0
      );
      const netIncome = totalPayments - totalExpenses;
      const netIncomeUSD = totalPaymentsUSD - totalExpensesUSD;

      // Calculate additional statistics
      const paymentsByFeeType = payments.reduce((acc, payment) => {
        const feeType = payment.feeType;
        if (!acc[feeType]) {
          acc[feeType] = { count: 0, total: 0 };
        }
        acc[feeType].count++;
        acc[feeType].total += Number(payment.amount);
        return acc;
      }, {} as Record<string, { count: number; total: number }>);

      const expensesByCategory = expenses.reduce((acc, expense) => {
        const category = expense.category;
        if (!acc[category]) {
          acc[category] = { count: 0, total: 0 };
        }
        acc[category].count++;
        acc[category].total += Number(expense.amount);
        return acc;
      }, {} as Record<string, { count: number; total: number }>);

      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      // Prepare report data
      const reportData: ReportData = {
        title: "التقرير المالي الشهري",
        subtitle: `${monthNames[targetMonth - 1]} ${targetYear}`,
        date: `${targetYear}-${targetMonth.toString().padStart(2, "0")}`,
        payments,
        expenses,
        summary: {
          totalPayments,
          totalPaymentsUSD: Number(totalPaymentsUSD.toFixed(2)),
          totalExpenses,
          totalExpensesUSD: Number(totalExpensesUSD.toFixed(2)),
          netIncome,
          netIncomeUSD: Number(netIncomeUSD.toFixed(2)),
          paymentCount: payments.length,
          expenseCount: expenses.length,
          paymentsByFeeType,
          expensesByCategory,
        },
      };

      const filename = `monthly-report-${targetYear}-${targetMonth
        .toString()
        .padStart(2, "0")}.pdf`;
      await generatePDF(reportData, filename, res);
    } catch (error) {
      console.error("Monthly PDF generation error:", error);
      return next(
        new AppError(
          `Failed to generate monthly report PDF: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          500
        )
      );
    }
  }
);


/**
 * Download yearly report as PDF
 * Authorization: admin and auditor roles
 */
const downloadYearlyReportPDF = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const { year } = req.params;
    const targetYear = parseInt(year);

    // Set date range for the year
    const startOfYear = new Date(targetYear, 0, 1);
    const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59, 999);

    try {
      // Get payments and expenses for the year
      const [payments, expenses] = await Promise.all([
        prisma.payment.findMany({
          where: {
            paymentDate: {
              gte: startOfYear,
              lte: endOfYear,
            },
          },
          select: {
            id: true,
            amount: true,
            amountUSD: true,
            usdAppliedRate: true,
            feeType: true,
            paymentMethod: true,
            studentName: true,
            receiptNumber: true,
            paymentDate: true,
            notes: true,
          },
          orderBy: {
            paymentDate: "asc",
          },
        }),
        prisma.expense.findMany({
          where: {
            date: {
              gte: startOfYear,
              lte: endOfYear,
            },
          },
          select: {
            id: true,
            amount: true,
            amountUSD: true,
            usdAppliedRate: true,
            category: true,
            vendor: true,
            description: true,
            date: true,
          },
          orderBy: {
            date: "asc",
          },
        }),
      ]);

      // Calculate totals
      const totalPayments = payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );
      const totalPaymentsUSD = payments.reduce(
        (sum, p) => sum + (p.amountUSD ? Number(p.amountUSD) : 0),
        0
      );
      const totalExpenses = expenses.reduce(
        (sum, e) => sum + Number(e.amount),
        0
      );
      const totalExpensesUSD = expenses.reduce(
        (sum, e) => sum + (e.amountUSD ? Number(e.amountUSD) : 0),
        0
      );
      const netIncome = totalPayments - totalExpenses;
      const netIncomeUSD = totalPaymentsUSD - totalExpensesUSD;

      // Calculate additional statistics
      const paymentsByFeeType = payments.reduce((acc, payment) => {
        const feeType = payment.feeType;
        if (!acc[feeType]) {
          acc[feeType] = { count: 0, total: 0 };
        }
        acc[feeType].count++;
        acc[feeType].total += Number(payment.amount);
        return acc;
      }, {} as Record<string, { count: number; total: number }>);

      const expensesByCategory = expenses.reduce((acc, expense) => {
        const category = expense.category;
        if (!acc[category]) {
          acc[category] = { count: 0, total: 0 };
        }
        acc[category].count++;
        acc[category].total += Number(expense.amount);
        return acc;
      }, {} as Record<string, { count: number; total: number }>);

      // Calculate monthly breakdown
      const monthlyBreakdown = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const monthStart = new Date(targetYear, i, 1);
        const monthEnd = new Date(targetYear, i + 1, 0, 23, 59, 59, 999);

        const monthPayments = payments.filter(
          (p) => p.paymentDate >= monthStart && p.paymentDate <= monthEnd
        );
        const monthExpenses = expenses.filter(
          (e) => e.date >= monthStart && e.date <= monthEnd
        );

        const monthPaymentTotal = monthPayments.reduce(
          (sum, p) => sum + Number(p.amount),
          0
        );
        const monthExpenseTotal = monthExpenses.reduce(
          (sum, e) => sum + Number(e.amount),
          0
        );

        return {
          month: new Date(targetYear, i, 1).toLocaleDateString("en-US", {
            month: "long",
          }),
          payments: monthPaymentTotal,
          expenses: monthExpenseTotal,
          netIncome: monthPaymentTotal - monthExpenseTotal,
          transactionCount: monthPayments.length + monthExpenses.length,
        };
      });

      // Prepare report data
      const reportData: ReportData = {
        title: "التقرير المالي السنوي",
        subtitle: `Year ${targetYear}`,
        date: targetYear.toString(),
        payments,
        expenses,
        summary: {
          totalPayments,
          totalPaymentsUSD: Number(totalPaymentsUSD.toFixed(2)),
          totalExpenses,
          totalExpensesUSD: Number(totalExpensesUSD.toFixed(2)),
          netIncome,
          netIncomeUSD: Number(netIncomeUSD.toFixed(2)),
          paymentCount: payments.length,
          expenseCount: expenses.length,
          paymentsByFeeType,
          expensesByCategory,
          monthlyBreakdown,
        },
      };

      const filename = `yearly-report-${targetYear}.pdf`;
      await generatePDF(reportData, filename, res);
    } catch (error) {
      console.error("Yearly PDF generation error:", error);
      return next(
        new AppError(
          `Failed to generate yearly report PDF: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          500
        )
      );
    }
  }
);


/**
 * Download custom date range report as PDF
 * Query: from=YYYY-MM-DD, to=YYYY-MM-DD
 * Authorization: admin and auditor roles
 */
const downloadRangeReportPDF = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { from, to } = req.query as { from?: string; to?: string };
      if (!from || !to) {
        return next(new AppError("from and to are required", 400));
      }

      const startDate = new Date(from);
      const endDate = new Date(to);
      // Normalize to full day bounds
      const startOfFrom = new Date(startDate);
      startOfFrom.setHours(0, 0, 0, 0);
      const endOfTo = new Date(endDate);
      endOfTo.setHours(23, 59, 59, 999);

      const [payments, expenses] = await Promise.all([
        prisma.payment.findMany({
          where: {
            paymentDate: {
              gte: startOfFrom,
              lte: endOfTo,
            },
          },
          orderBy: { paymentDate: "asc" },
          select: {
            amount: true,
            amountUSD: true,
            usdAppliedRate: true,
            studentName: true,
            feeType: true,
            paymentMethod: true,
            paymentDate: true,
            receiptNumber: true,
          },
        }),
        prisma.expense.findMany({
          where: {
            date: {
              gte: startOfFrom,
              lte: endOfTo,
            },
          },
          orderBy: { date: "asc" },
          select: {
            amount: true,
            amountUSD: true,
            usdAppliedRate: true,
            category: true,
            vendor: true,
            description: true,
            date: true,
          },
        }),
      ]);

      const totalPayments = payments.reduce((s, p) => s + Number(p.amount), 0);
      const totalPaymentsUSD = payments.reduce(
        (s, p) => s + (p.amountUSD ? Number(p.amountUSD) : 0),
        0
      );
      const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
      const totalExpensesUSD = expenses.reduce(
        (s, e) => s + (e.amountUSD ? Number(e.amountUSD) : 0),
        0
      );
      const netIncome = totalPayments - totalExpenses;
      const netIncomeUSD = totalPaymentsUSD - totalExpensesUSD;

      const data: ReportData = {
        title: "تقرير النطاق الزمني المخصص",
        subtitle: `من ${from} إلى ${to}`,
        date: new Date().toISOString(),
        payments: payments as any[],
        expenses: expenses as any[],
        summary: {
          totalPayments,
          totalPaymentsUSD: Number(totalPaymentsUSD.toFixed(2)),
          totalExpenses,
          totalExpensesUSD: Number(totalExpensesUSD.toFixed(2)),
          netIncome,
          netIncomeUSD: Number(netIncomeUSD.toFixed(2)),
          paymentCount: payments.length,
          expenseCount: expenses.length,
        },
      };

      const filename = `custom-report-${from}-to-${to}.pdf`;
      await generatePDF(data, filename, res);
    } catch (error) {
      return next(new AppError("Failed to generate custom report PDF", 500));
    }
  }
);


/**
 * Download monthly HORIZONTAL (landscape) matrix PDF
 * - Columns: categories (Payments: FeeType, Expenses: Category)
 * - Rows: days of the target month
 * - Cells: total amount per day/category
 */
const downloadMonthlyHorizontalPDF = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { year, month } = req.params;
      const targetYear = parseInt(year);
      const targetMonth = parseInt(month);

      if (
        isNaN(targetYear) ||
        isNaN(targetMonth) ||
        targetMonth < 1 ||
        targetMonth > 12
      ) {
        return next(new AppError("Invalid year or month", 400));
      }

      const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
      const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);
      const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();

      // Fetch minimal set needed
      const [payments, expenses] = await Promise.all([
        prisma.payment.findMany({
          where: { paymentDate: { gte: startOfMonth, lte: endOfMonth } },
          select: { amountUSD: true, feeType: true, paymentDate: true },
        }),
        prisma.expense.findMany({
          where: { date: { gte: startOfMonth, lte: endOfMonth } },
          select: { amountUSD: true, category: true, date: true },
        }),
      ]);

      // Build unique columns
      const paymentKeys = Array.from(
        new Set(payments.map((p) => p.feeType))
      ).sort();
      const expenseKeys = Array.from(
        new Set(expenses.map((e) => e.category))
      ).sort();

      // Initialize matrices (days x columns) with zeros
      const paymentMatrix: number[][] = Array.from(
        { length: daysInMonth },
        () => Array(paymentKeys.length).fill(0)
      );
      const expenseMatrix: number[][] = Array.from(
        { length: daysInMonth },
        () => Array(expenseKeys.length).fill(0)
      );

      // Fill payments matrix
      const paymentIndex = new Map(paymentKeys.map((k, i) => [k, i] as const));
      for (const p of payments) {
        const day = p.paymentDate.getDate();
        const ci = paymentIndex.get(p.feeType);
        if (ci !== undefined) {
          // Use USD amounts; fallback to 0 when not available
          paymentMatrix[day - 1][ci] += Number(p.amountUSD || 0);
        }
      }

      // Fill expenses matrix
      const expenseIndex = new Map(expenseKeys.map((k, i) => [k, i] as const));
      for (const e of expenses) {
        const day = e.date.getDate();
        const ci = expenseIndex.get(e.category);
        if (ci !== undefined) {
          // Use USD amounts; fallback to 0 when not available
          expenseMatrix[day - 1][ci] += Number(e.amountUSD || 0);
        }
      }

      // Arabic label helpers (keep scoped to this endpoint)
      const feeTypeAr = (key: string): string => {
        const map: Record<string, string> = {
          NEW_YEAR: "رسوم سنة جديدة",
          SUPPLEMENTARY: "رسوم ملحق",
          TRAINING: "رسوم تدريب",
          STUDENT_SERVICES: "رسوم خدمات طلابية",
          EXAM: "رسوم امتحان",
          OTHER: "أخرى",
        };
        return map[key] ?? key;
      };
      const expenseCatAr = (category: string): string => {
        const translations: Record<string, string> = {
          "Fixed Assets": "أصول ثابتة",
          "Part-time Professors": "الأساتذه المتعاونون",
          "Rent of study and administrative premises":
            "ايجار مقرات الدراسه والادارة",
          Salaries: "رواتب",
          "Student Fees Refund": "استرداد رسوم الطلاب",
          Advances: "سلف",
          Bonuses: "مكافآت",
          "General & Administrative Expenses": "مصاريف عامة وإدارية",
          "General and Administrative Expenses": "مصاريف عامة وإدارية",
          "Library Supplies": "مستلزمات المكتبة",
          "Lab Consumables": "مستهلكات المعامل",
          "Student Training": "تدريب الطلاب",
          "Saudi-Egyptian Company": "شركة سعودية-مصرية",
          other: "آخرى",
          Other: "آخرى",
        };
        return translations[category] || category;
      };

      // Column labels (Arabic)
      const paymentLabels = Object.fromEntries(
        paymentKeys.map((k) => [k, feeTypeAr(k)])
      );
      const expenseLabels = Object.fromEntries(
        expenseKeys.map((k) => [k, expenseCatAr(k)])
      );

      const monthName = new Date(
        targetYear,
        targetMonth - 1,
        1
      ).toLocaleDateString("en-US", { month: "long" });

      const data: HorizontalMonthlyData = {
        title: "التقرير الشهري الأفقي (مصفوفة)",
        subtitle: `${monthName} ${targetYear}`,
        monthYear: `${targetYear}-${String(targetMonth).padStart(2, "0")}`,
        // Display currency as USD for the horizontal matrix
        currencyLabel: "USD",
        payments: paymentKeys.length
          ? {
              columns: paymentKeys,
              columnLabels: paymentLabels,
              matrix: paymentMatrix,
            }
          : undefined,
        expenses: expenseKeys.length
          ? {
              columns: expenseKeys,
              columnLabels: expenseLabels,
              matrix: expenseMatrix,
            }
          : undefined,
      };

      const filename = `monthly-horizontal-${targetYear}-${String(
        targetMonth
      ).padStart(2, "0")}.pdf`;
      await generateHorizontalMonthlyPDF(data, filename, res);
    } catch (error) {
      return next(
        new AppError("Failed to generate monthly horizontal PDF", 500)
      );
    }
  }
);


/**
 * Download monthly HORIZONTAL (landscape) matrix PDF - PAYMENTS ONLY
 */
const downloadMonthlyHorizontalPaymentsPDF = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { year, month } = req.params;
      const targetYear = parseInt(year);
      const targetMonth = parseInt(month);

      if (
        isNaN(targetYear) ||
        isNaN(targetMonth) ||
        targetMonth < 1 ||
        targetMonth > 12
      ) {
        return next(new AppError("Invalid year or month", 400));
      }

      const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
      const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);
      const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();

      const payments = await prisma.payment.findMany({
        where: { paymentDate: { gte: startOfMonth, lte: endOfMonth } },
        select: { amountUSD: true, feeType: true, paymentDate: true },
      });

      const paymentKeys = Array.from(
        new Set(payments.map((p) => p.feeType))
      ).sort();
      const paymentMatrix: number[][] = Array.from(
        { length: daysInMonth },
        () => Array(paymentKeys.length).fill(0)
      );
      const paymentIndex = new Map(paymentKeys.map((k, i) => [k, i] as const));
      for (const p of payments) {
        const day = p.paymentDate.getDate();
        const ci = paymentIndex.get(p.feeType);
        if (ci !== undefined)
          paymentMatrix[day - 1][ci] += Number(p.amountUSD || 0);
      }

      const feeTypeAr = (key: string): string => {
        const map: Record<string, string> = {
          NEW_YEAR: "رسوم سنة جديدة",
          SUPPLEMENTARY: "رسوم ملحق",
          TRAINING: "رسوم تدريب",
          STUDENT_SERVICES: "رسوم خدمات طلابية",
          EXAM: "رسوم امتحان",
          OTHER: "أخرى",
        };
        return map[key] ?? key;
      };

      const paymentLabels = Object.fromEntries(
        paymentKeys.map((k) => [k, feeTypeAr(k)])
      );

      const monthName = new Date(
        targetYear,
        targetMonth - 1,
        1
      ).toLocaleDateString("en-US", { month: "long" });

      const data: HorizontalMonthlyData = {
        title: "التقرير الشهري الأفقي - المدفوعات",
        subtitle: `${monthName} ${targetYear}`,
        monthYear: `${targetYear}-${String(targetMonth).padStart(2, "0")}`,
        currencyLabel: "USD",
        payments: paymentKeys.length
          ? {
              columns: paymentKeys,
              columnLabels: paymentLabels,
              matrix: paymentMatrix,
            }
          : undefined,
        expenses: undefined,
      };

      const filename = `monthly-horizontal-payments-${targetYear}-${String(
        targetMonth
      ).padStart(2, "0")}.pdf`;
      await generateHorizontalMonthlyPDF(data, filename, res);
    } catch (error) {
      return next(
        new AppError("Failed to generate monthly horizontal PAYMENTS PDF", 500)
      );
    }
  }
);


/**
 * Download monthly HORIZONTAL (landscape) matrix PDF - EXPENSES ONLY
 */
const downloadMonthlyHorizontalExpensesPDF = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { year, month } = req.params;
      const targetYear = parseInt(year);
      const targetMonth = parseInt(month);

      if (
        isNaN(targetYear) ||
        isNaN(targetMonth) ||
        targetMonth < 1 ||
        targetMonth > 12
      ) {
        return next(new AppError("Invalid year or month", 400));
      }

      const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
      const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);
      const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();

      const expenses = await prisma.expense.findMany({
        where: { date: { gte: startOfMonth, lte: endOfMonth } },
        select: { amountUSD: true, category: true, date: true },
      });

      const expenseKeys = Array.from(
        new Set(expenses.map((e) => e.category))
      ).sort();
      const expenseMatrix: number[][] = Array.from(
        { length: daysInMonth },
        () => Array(expenseKeys.length).fill(0)
      );
      const expenseIndex = new Map(expenseKeys.map((k, i) => [k, i] as const));
      for (const e of expenses) {
        const day = e.date.getDate();
        const ci = expenseIndex.get(e.category);
        if (ci !== undefined)
          expenseMatrix[day - 1][ci] += Number(e.amountUSD || 0);
      }

      const expenseCatAr = (category: string): string => {
        const translations: Record<string, string> = {
          "Fixed Assets": "أصول ثابتة",
          "Part-time Professors": "الأساتذه المتعاونون",
          "Rent of study and administrative premises":
            "ايجار مقرات الدراسه والادارة",
          Salaries: "رواتب",
          "Student Fees Refund": "استرداد رسوم الطلاب",
          Advances: "سلف",
          Bonuses: "مكافآت",
          "General & Administrative Expenses": "مصاريف عامة وإدارية",
          "General and Administrative Expenses": "مصاريف عامة وإدارية",
          "Library Supplies": "مستلزمات المكتبة",
          "Lab Consumables": "مستهلكات المعامل",
          "Student Training": "تدريب الطلاب",
          "Saudi-Egyptian Company": "شركة سعودية-مصرية",
          other: "آخرى",
          Other: "آخرى",
        };
        return translations[category] || category;
      };

      const expenseLabels = Object.fromEntries(
        expenseKeys.map((k) => [k, expenseCatAr(k)])
      );

      const monthName = new Date(
        targetYear,
        targetMonth - 1,
        1
      ).toLocaleDateString("en-US", { month: "long" });

      const data: HorizontalMonthlyData = {
        title: "التقرير الشهري الأفقي - المصروفات",
        subtitle: `${monthName} ${targetYear}`,
        monthYear: `${targetYear}-${String(targetMonth).padStart(2, "0")}`,
        currencyLabel: "USD",
        payments: undefined,
        expenses: expenseKeys.length
          ? {
              columns: expenseKeys,
              columnLabels: expenseLabels,
              matrix: expenseMatrix,
            }
          : undefined,
      };

      const filename = `monthly-horizontal-expenses-${targetYear}-${String(
        targetMonth
      ).padStart(2, "0")}.pdf`;
      await generateHorizontalMonthlyPDF(data, filename, res);
    } catch (error) {
      return next(
        new AppError("Failed to generate monthly horizontal EXPENSES PDF", 500)
      );
    }
  }
);


export {
  getDailyReport,
  getMonthlyReport,
  getYearlyReport,
  getDashboardReport,
  getFinancialSummary,
  downloadDailyReportPDF,
  downloadMonthlyReportPDF,
  downloadYearlyReportPDF,
  downloadRangeReportPDF,
  downloadMonthlyHorizontalPDF,
  downloadMonthlyHorizontalPaymentsPDF,
  downloadMonthlyHorizontalExpensesPDF,
};
