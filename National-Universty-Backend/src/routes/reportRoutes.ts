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
} from "../controllers/reportController";
import {
  dateValidator,
  monthlyReportValidator,
  yearlyReportValidator,
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

export default router;
