import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma";
import asyncWrapper from "../middlewares/asyncWrapper";

// Helper to get current year
const getYear = (req: Request) => {
  const y = req.query.year ? Number(req.query.year) : new Date().getFullYear();
  return Number.isFinite(y) && y > 1900 ? y : new Date().getFullYear();
};

export const getChartsAnalytics = asyncWrapper(
  async (req: Request, res: Response, _next: NextFunction) => {
    const year = getYear(req);

    // Use raw SQL for efficient monthly aggregation in MySQL
    const paymentsMonthly = await prisma.$queryRaw<
      { month: number | bigint | string; total: string | number }[]
    >`SELECT CAST(MONTH(paymentDate) AS UNSIGNED) AS month, COALESCE(SUM(amount),0) AS total
     FROM payments
     WHERE YEAR(paymentDate) = ${year}
     GROUP BY 1
     ORDER BY 1`;

    const expensesMonthly = await prisma.$queryRaw<
      { month: number | bigint | string; total: string | number }[]
    >`SELECT CAST(MONTH(\`date\`) AS UNSIGNED) AS month, COALESCE(SUM(amount),0) AS total
     FROM expenses
     WHERE YEAR(\`date\`) = ${year}
     GROUP BY 1
     ORDER BY 1`;



    // Normalize to numbers and build fast lookup maps to avoid BigInt/number mismatches
    const incomeByMonth = new Map<number, number>(
      paymentsMonthly.map((r) => [Number(r.month), Number(r.total)])
    );
    const expenseByMonth = new Map<number, number>(
      expensesMonthly.map((r) => [Number(r.month), Number(r.total)])
    );

    // Build 12-month array
    const monthly = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const income = incomeByMonth.get(m) ?? 0;
      const expenses = expenseByMonth.get(m) ?? 0;
      return {
        month: m,
        income,
        expenses,
        profit: income - expenses,
      };
    });

    // Income by fee type (yearly)
    const incomeByFeeTypeRaw = await prisma.$queryRaw<
      { feeType: string; total: string }[]
    >`SELECT feeType, COALESCE(SUM(amount),0) AS total
       FROM payments
       WHERE YEAR(paymentDate) = ${year}
       GROUP BY feeType
       ORDER BY total DESC`;
    const totalIncomeYear = incomeByFeeTypeRaw.reduce(
      (acc, r) => acc + Number(r.total),
      0
    );
    const incomeByCategory = incomeByFeeTypeRaw.map((r) => ({
      category: mapFeeTypeToKey(r.feeType),
      amount: Number(r.total),
      percentage:
        totalIncomeYear > 0
          ? Math.round((Number(r.total) / totalIncomeYear) * 100)
          : 0,
    }));

    // Expense by category (yearly)
    const expenseByCategoryRaw = await prisma.$queryRaw<
      { category: string; total: string }[]
    >`SELECT category, COALESCE(SUM(amount),0) AS total
     FROM expenses
     WHERE YEAR(\`date\`) = ${year}
     GROUP BY category
     ORDER BY total DESC
     LIMIT 12`;
    const totalExpenseYear = expenseByCategoryRaw.reduce(
      (acc, r) => acc + Number(r.total),
      0
    );
    const expenseByCategory = expenseByCategoryRaw.map((r) => ({
      category: mapExpenseCategoryToKey(r.category),
      amount: Number(r.total),
      percentage:
        totalExpenseYear > 0
          ? Math.round((Number(r.total) / totalExpenseYear) * 100)
          : 0,
    }));

    return res.status(200).json({
      status: "success",
      data: {
        year,
        monthly,
        incomeByCategory,
        expenseByCategory,
      },
    });
  }
);

function mapFeeTypeToKey(feeType: string): string {
  // Backend values are enums in English. Map to frontend i18n keys.
  switch (feeType) {
    case "NEW_YEAR":
      return "feeTypeNewYear";
    case "SUPPLEMENTARY":
      return "feeTypeSupplementary";
    case "TRAINING":
      return "training";
    case "STUDENT_SERVICES":
      return "feeTypeStudentServices";
    case "EXAM":
      return "exam";
    default:
      return "other";
  }
}

function mapExpenseCategoryToKey(category: string): string {
  // Frontend expects i18n keys; fallback to raw category.
  const normalized = category.trim().toLowerCase().replace(/\s+/g, "_");
  if (normalized.includes("operational")) return "operationalExpenses";
  if (normalized.includes("admin")) return "administrativeExpenses";
  if (normalized.includes("utilit")) return "utilities";
  if (normalized.includes("service")) return "externalServices";
  return category; // use actual category if no mapping
}
