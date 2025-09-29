import { Router } from "express";
import {
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
} from "../controllers/reportController";
import {
  dateValidator,
  monthlyReportValidator,
  yearlyReportValidator,
  rangeReportValidator,
} from "../validators/reportValidators";
import validate from "../middlewares/validate";
import verifyToken from "../middlewares/verifyToken";
import allowedTo from "../middlewares/allowedTo";

const router = Router();

// Apply authentication to all report routes
// router.use(verifyToken);

/**
 * GET /api/v1/reports/daily/:date
 * Get daily financial report
 * Access: admin, auditor
 */
router.get(
  "/daily/:date",
  // allowedTo("admin", "auditor"),
  dateValidator,
  validate,
  getDailyReport
);

/**
 * GET /api/v1/reports/monthly/:year/:month
 * Get monthly financial report
 * Access: admin, auditor
 */
router.get(
  "/monthly/:year/:month",
  // allowedTo("admin", "auditor"),
  monthlyReportValidator,
  validate,
  getMonthlyReport
);

/**
 * GET /api/v1/reports/yearly/:year
 * Get yearly financial report
 * Access: admin, auditor
 */
router.get(
  "/yearly/:year",
  // allowedTo("admin", "auditor"),
  yearlyReportValidator,
  validate,
  getYearlyReport
);

/**
 * GET /api/v1/reports/dashboard
 * Get comprehensive dashboard report
 * Access: admin, auditor
 */
router.get(
  "/dashboard",
  // allowedTo("admin", "auditor"),
  getDashboardReport
);

/**
 * GET /api/v1/reports/summary
 * Get financial summary (current month, quarter, year)
 * Access: admin, auditor
 */
router.get(
  "/summary",
  // allowedTo("admin", "auditor"),
  getFinancialSummary
);

/**
 * GET /api/v1/reports/daily/:date/pdf
 * Download daily financial report as PDF
 * Access: admin, auditor
 */
router.get(
  "/daily/:date/pdf",
  // allowedTo("admin", "auditor"),
  dateValidator,
  validate,
  downloadDailyReportPDF
);

/**
 * GET /api/v1/reports/monthly/:year/:month/pdf
 * Download monthly financial report as PDF
 * Access: admin, auditor
 */
router.get(
  "/monthly/:year/:month/pdf",
  // allowedTo("admin", "auditor"),
  monthlyReportValidator,
  validate,
  downloadMonthlyReportPDF
);

/**
 * GET /api/v1/reports/monthly/:year/:month/horizontal-pdf
 * Download monthly horizontal landscape matrix PDF (days x categories)
 * Access: admin, auditor
 */
router.get(
  "/monthly/:year/:month/horizontal-pdf",
  // allowedTo("admin", "auditor"),
  monthlyReportValidator,
  validate,
  downloadMonthlyHorizontalPDF
);

/**
 * GET /api/v1/reports/monthly/:year/:month/horizontal-payment-pdf
 * Download monthly horizontal landscape matrix PDF (days x fee types) - PAYMENTS ONLY
 */
router.get(
  "/monthly/:year/:month/horizontal-payment-pdf",
  // allowedTo("admin", "auditor"),
  monthlyReportValidator,
  validate,
  downloadMonthlyHorizontalPaymentsPDF
);

/**
 * GET /api/v1/reports/monthly/:year/:month/horizontal-expenses-pdf
 * GET /api/v1/reports/monthly/:year/:month/horizontal-expanses-pdf (alias)
 * Download monthly horizontal landscape matrix PDF (days x categories) - EXPENSES ONLY
 */
router.get(
  "/monthly/:year/:month/horizontal-expenses-pdf",
  // allowedTo("admin", "auditor"),
  monthlyReportValidator,
  validate,
  downloadMonthlyHorizontalExpensesPDF
);
router.get(
  "/monthly/:year/:month/horizontal-expanses-pdf",
  // allowedTo("admin", "auditor"),
  monthlyReportValidator,
  validate,
  downloadMonthlyHorizontalExpensesPDF
);

/**
 * GET /api/v1/reports/yearly/:year/pdf
 * Download yearly financial report as PDF
 * Access: admin, auditor
 */
router.get(
  "/yearly/:year/pdf",
  // allowedTo("admin", "auditor"),
  yearlyReportValidator,
  validate,
  downloadYearlyReportPDF
);

/**
 * GET /api/v1/reports/custom/pdf?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Download custom date range report as PDF
 * Access: admin, auditor
 */
router.get(
  "/custom/pdf",
  // allowedTo("admin", "auditor"),
  rangeReportValidator,
  validate,
  downloadRangeReportPDF
);

export default router;
