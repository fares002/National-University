import { Router } from "express";
import {
  getCurrentRate,
  setCurrencyRate,
  getRateHistory,
  initializeRate,
} from "../controllers/currencyController";
import validate from "../middlewares/validate";
import verifyToken from "../middlewares/verifyToken";
import allowedTo from "../middlewares/allowedTo";

const router = Router();

// Apply authentication to all currency routes
router.use(verifyToken);

/**
 * GET /api/v1/currency/current
 * Get current active currency rate
 * Access: admin, auditor
 */
router.get("/current", allowedTo("admin", "auditor"), getCurrentRate);

/**
 * GET /api/v1/currency/history
 * Get currency rate history
 * Access: admin, auditor
 */
router.get("/history", allowedTo("admin", "auditor"), getRateHistory);

/**
 * POST /api/v1/currency/rate
 * Set/update currency rate
 * Access: admin only
 */
router.post("/rate", allowedTo("admin"), setCurrencyRate);

/**
 * POST /api/v1/currency/initialize
 * Initialize default currency rate (for first time setup)
 * Access: admin only
 */
router.post("/initialize", allowedTo("admin"), initializeRate);

export default router;
