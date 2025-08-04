import { Router } from "express";
import {
  getDailyReport,
  getMonthlyReport,
  getYearlyReport,
  getFinancialSummary,
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
router.use(verifyToken);

/**
 * GET /api/v1/reports/daily/:date
 * Get daily financial report
 * Access: admin, auditor
 */
router.get(
  "/daily/:date",
  allowedTo("admin", "auditor"),
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
  allowedTo("admin", "auditor"),
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
  allowedTo("admin", "auditor"),
  yearlyReportValidator,
  validate,
  getYearlyReport
);

/**
 * GET /api/v1/reports/summary
 * Get financial summary (current month, quarter, year)
 * Access: admin, auditor
 */
router.get(
  "/summary",
  allowedTo("admin", "auditor"),
  getFinancialSummary
);

export default router;
