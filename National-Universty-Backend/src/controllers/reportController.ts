import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma";
import asyncWrapper from "../middlewares/asyncWrapper";
import AppError from "../utils/AppError";
import { httpStatusText } from "../utils/httpStatusText";

// Types for report data
interface DailyReportData {
  date: string;
  payments: {
    total: number;
    count: number;
    byFeeType: Record<string, { count: number; total: number }>;
    byPaymentMethod: Record<string, { count: number; total: number }>;
  };
  expenses: {
    total: number;
    count: number;
    byCategory: Record<string, { count: number; total: number }>;
    topVendors: Array<{ vendor: string; total: number; count: number }>;
  };
  netIncome: number;
}

interface MonthlyReportData {
  year: number;
  month: number;
  monthName: string;
  payments: {
    total: number;
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
    
    // Validate date format
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return next(new AppError("Invalid date format. Use YYYY-MM-DD", 400));
    }

    // Set date range for the day
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
          category: true,
          vendor: true,
          description: true,
        },
      });

      // Calculate payment statistics
      const paymentTotal = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const paymentsByFeeType: Record<string, { count: number; total: number }> = {};
      const paymentsByMethod: Record<string, { count: number; total: number }> = {};

      payments.forEach(payment => {
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
      const expenseTotal = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const expensesByCategory: Record<string, { count: number; total: number }> = {};
      const vendorTotals: Record<string, { count: number; total: number }> = {};

      expenses.forEach(expense => {
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

      const reportData: DailyReportData = {
        date: targetDate.toISOString().split('T')[0],
        payments: {
          total: paymentTotal,
          count: payments.length,
          byFeeType: paymentsByFeeType,
          byPaymentMethod: paymentsByMethod,
        },
        expenses: {
          total: expenseTotal,
          count: expenses.length,
          byCategory: expensesByCategory,
          topVendors,
        },
        netIncome,
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
    
    // Validate year and month
    if (isNaN(targetYear) || isNaN(targetMonth) || targetMonth < 1 || targetMonth > 12) {
      return next(new AppError("Invalid year or month", 400));
    }

    // Set date range for the month
    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);
    
    // Previous month for comparison
    const previousMonth = targetMonth === 1 ? 12 : targetMonth - 1;
    const previousYear = targetMonth === 1 ? targetYear - 1 : targetYear;
    const startOfPreviousMonth = new Date(previousYear, previousMonth - 1, 1);
    const endOfPreviousMonth = new Date(previousYear, previousMonth, 0, 23, 59, 59, 999);

    try {
      // Get current month data
      const [payments, expenses, previousPayments, previousExpenses] = await Promise.all([
        prisma.payment.findMany({
          where: {
            paymentDate: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          select: {
            amount: true,
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
      const paymentTotal = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const expenseTotal = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const netIncome = paymentTotal - expenseTotal;

      // Calculate previous month totals for comparison
      const previousPaymentTotal = previousPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const previousExpenseTotal = previousExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const previousNetIncome = previousPaymentTotal - previousExpenseTotal;

      // Calculate percentage changes
      const paymentsChange = previousPaymentTotal === 0 ? 100 : 
        ((paymentTotal - previousPaymentTotal) / previousPaymentTotal) * 100;
      const expensesChange = previousExpenseTotal === 0 ? 100 : 
        ((expenseTotal - previousExpenseTotal) / previousExpenseTotal) * 100;
      const netIncomeChange = previousNetIncome === 0 ? 100 : 
        ((netIncome - previousNetIncome) / Math.abs(previousNetIncome)) * 100;

      // Group payments by fee type and method
      const paymentsByFeeType: Record<string, { count: number; total: number }> = {};
      const paymentsByMethod: Record<string, { count: number; total: number }> = {};
      
      payments.forEach(payment => {
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
      const expensesByCategory: Record<string, { count: number; total: number }> = {};
      const vendorTotals: Record<string, { count: number; total: number }> = {};

      expenses.forEach(expense => {
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
          const date = payment.paymentDate.toISOString().split('T')[0];
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
          const date = expense.date.toISOString().split('T')[0];
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
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];

      const reportData: MonthlyReportData = {
        year: targetYear,
        month: targetMonth,
        monthName: monthNames[targetMonth - 1],
        payments: {
          total: paymentTotal,
          count: payments.length,
          byFeeType: paymentsByFeeType,
          byPaymentMethod: paymentsByMethod,
          dailyBreakdown: paymentsDailyBreakdown,
        },
        expenses: {
          total: expenseTotal,
          count: expenses.length,
          byCategory: expensesByCategory,
          topVendors,
          dailyBreakdown: expensesDailyBreakdown,
        },
        netIncome,
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
    
    if (isNaN(targetYear)) {
      return next(new AppError("Invalid year", 400));
    }

    // Set date range for the year
    const startOfYear = new Date(targetYear, 0, 1);
    const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59, 999);
    
    // Previous year for comparison
    const startOfPreviousYear = new Date(targetYear - 1, 0, 1);
    const endOfPreviousYear = new Date(targetYear - 1, 11, 31, 23, 59, 59, 999);

    try {
      // Get year data
      const [payments, expenses, previousPayments, previousExpenses] = await Promise.all([
        prisma.payment.findMany({
          where: {
            paymentDate: {
              gte: startOfYear,
              lte: endOfYear,
            },
          },
          select: {
            amount: true,
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
      const paymentTotal = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const expenseTotal = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const netIncome = paymentTotal - expenseTotal;

      const previousPaymentTotal = previousPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const previousExpenseTotal = previousExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const previousNetIncome = previousPaymentTotal - previousExpenseTotal;

      // Calculate year-over-year changes
      const paymentsChange = previousPaymentTotal === 0 ? 100 : 
        ((paymentTotal - previousPaymentTotal) / previousPaymentTotal) * 100;
      const expensesChange = previousExpenseTotal === 0 ? 100 : 
        ((expenseTotal - previousExpenseTotal) / previousExpenseTotal) * 100;
      const netIncomeChange = previousNetIncome === 0 ? 100 : 
        ((netIncome - previousNetIncome) / Math.abs(previousNetIncome)) * 100;

      // Monthly breakdown for the year
      const monthlyBreakdown = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const monthStart = new Date(targetYear, i, 1);
        const monthEnd = new Date(targetYear, i + 1, 0, 23, 59, 59, 999);
        
        const monthPayments = payments.filter(p => 
          p.paymentDate >= monthStart && p.paymentDate <= monthEnd
        );
        const monthExpenses = expenses.filter(e => 
          e.date >= monthStart && e.date <= monthEnd
        );
        
        const monthPaymentTotal = monthPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        const monthExpenseTotal = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
        
        return {
          month,
          monthName: new Date(targetYear, i, 1).toLocaleDateString('en-US', { month: 'long' }),
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
      const paymentsByFeeType: Record<string, { count: number; total: number }> = {};
      const paymentsByMethod: Record<string, { count: number; total: number }> = {};
      const expensesByCategory: Record<string, { count: number; total: number }> = {};
      const vendorTotals: Record<string, { count: number; total: number }> = {};

      payments.forEach(payment => {
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

      expenses.forEach(expense => {
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
            count: payments.length,
            byFeeType: paymentsByFeeType,
            byPaymentMethod: paymentsByMethod,
          },
          expenses: {
            total: expenseTotal,
            count: expenses.length,
            byCategory: expensesByCategory,
            topVendors,
          },
          netIncome,
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
    const endOfThisMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

    // This quarter
    const startOfQuarter = new Date(currentYear, (currentQuarter - 1) * 3, 1);
    const endOfQuarter = new Date(currentYear, currentQuarter * 3, 0, 23, 59, 59, 999);

    // This year
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

    try {
      // Get all data in parallel
      const [
        monthPayments, monthExpenses,
        quarterPayments, quarterExpenses,
        yearPayments, yearExpenses
      ] = await Promise.all([
        // This month
        prisma.payment.findMany({
          where: { paymentDate: { gte: startOfThisMonth, lte: endOfThisMonth } },
          select: { amount: true }
        }),
        prisma.expense.findMany({
          where: { date: { gte: startOfThisMonth, lte: endOfThisMonth } },
          select: { amount: true }
        }),
        // This quarter
        prisma.payment.findMany({
          where: { paymentDate: { gte: startOfQuarter, lte: endOfQuarter } },
          select: { amount: true }
        }),
        prisma.expense.findMany({
          where: { date: { gte: startOfQuarter, lte: endOfQuarter } },
          select: { amount: true }
        }),
        // This year
        prisma.payment.findMany({
          where: { paymentDate: { gte: startOfYear, lte: endOfYear } },
          select: { amount: true }
        }),
        prisma.expense.findMany({
          where: { date: { gte: startOfYear, lte: endOfYear } },
          select: { amount: true }
        }),
      ]);

      const summary = {
        thisMonth: {
          payments: monthPayments.reduce((sum, p) => sum + Number(p.amount), 0),
          expenses: monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
          netIncome: monthPayments.reduce((sum, p) => sum + Number(p.amount), 0) - 
                    monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
          paymentsCount: monthPayments.length,
          expensesCount: monthExpenses.length,
        },
        thisQuarter: {
          payments: quarterPayments.reduce((sum, p) => sum + Number(p.amount), 0),
          expenses: quarterExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
          netIncome: quarterPayments.reduce((sum, p) => sum + Number(p.amount), 0) - 
                    quarterExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
          paymentsCount: quarterPayments.length,
          expensesCount: quarterExpenses.length,
          quarter: currentQuarter,
        },
        thisYear: {
          payments: yearPayments.reduce((sum, p) => sum + Number(p.amount), 0),
          expenses: yearExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
          netIncome: yearPayments.reduce((sum, p) => sum + Number(p.amount), 0) - 
                    yearExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
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

export {
  getDailyReport,
  getMonthlyReport,
  getYearlyReport,
  getFinancialSummary,
};
