import { Router } from "express";
import verifyToken from "../middlewares/verifyToken";
import { getChartsAnalytics } from "../controllers/analyticsController";

const router = Router();

// GET /api/v1/analytics/charts?year=2025
router.get("/charts", verifyToken, getChartsAnalytics);

export default router;
