import { Request, Response, NextFunction } from "express";
import asyncWrapper from "../middlewares/asyncWrapper";
import AppError from "../utils/AppError";
import { httpStatusText } from "../utils/httpStatusText";
import {
  getLatestRate,
  updateCurrencyRate,
  getCurrencyRateHistory,
  validateCurrencyRate,
  initializeDefaultRate,
} from "../utils/currencyUtils";


/**
 * Get current currency rate
 * GET /api/v1/currency/current
 * Access: admin, auditor
 */
export const getCurrentRate = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const rate = await getLatestRate();
    if (!rate) {
      return next(
        new AppError("No active USD rate found", 404, httpStatusText.FAIL)
      );
    }
    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      data: {
        rate: {
          id: rate.id,
          currency: rate.currency,
          rate: Number(rate.rate),
          validFrom: rate.validFrom,
          isActive: rate.isActive,
          createdAt: rate.createdAt,
          updatedAt: rate.updatedAt,
        },
      },
    });
  }
);


/**
 * Update currency rate
 * POST /api/v1/currency/rate
 * Access: admin only
 */
export const setCurrencyRate = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const { rate } = req.body; // EGP per 1 USD
    const validation = validateCurrencyRate(rate);
    if (!validation.isValid) {
      return next(new AppError(validation.error!, 400, httpStatusText.FAIL));
    }
    try {
      const newRate = await updateCurrencyRate(validation.rate!);
      return res.status(201).json({
        status: httpStatusText.SUCCESS,
        data: {
          message: "Currency rate updated successfully",
          rate: {
            id: newRate.id,
            currency: newRate.currency,
            rate: Number(newRate.rate),
            validFrom: newRate.validFrom,
            isActive: newRate.isActive,
            createdAt: newRate.createdAt,
            updatedAt: newRate.updatedAt,
          },
        },
      });
    } catch (error) {
      console.error("Error setting currency rate:", error);
      return next(
        new AppError(
          "Failed to update currency rate",
          500,
          httpStatusText.ERROR
        )
      );
    }
  }
);


/**
 * Get currency rate history
 * GET /api/v1/currency/history
 * Access: admin, auditor
 */
export const getRateHistory = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const limit = parseInt((req.query.limit as string) || "10", 10);
    if (limit < 1 || limit > 100) {
      return next(
        new AppError(
          "Limit must be between 1 and 100",
          400,
          httpStatusText.FAIL
        )
      );
    }
    const history = await getCurrencyRateHistory("USD", limit);
    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      data: {
        currency: "USD",
        history: history.map((r) => ({
          id: r.id,
          currency: r.currency,
          rate: Number(r.rate),
          validFrom: r.validFrom,
          isActive: r.isActive,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })),
        total: history.length,
      },
    });
  }
);

/**
 * Initialize default currency rate
 * POST /api/v1/currency/initialize
 * Access: admin only (for initial setup)
 */
export const initializeRate = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const { rate = 50 } = req.body; // Default seed 50 EGP per USD
    const validation = validateCurrencyRate(rate);
    if (!validation.isValid) {
      return next(new AppError(validation.error!, 400, httpStatusText.FAIL));
    }
    try {
      const initializedRate = await initializeDefaultRate(
        "USD",
        validation.rate!
      );
      return res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: {
          message: "Currency rate initialized successfully",
          rate: {
            id: initializedRate.id,
            currency: initializedRate.currency,
            rate: Number(initializedRate.rate),
            validFrom: initializedRate.validFrom,
            isActive: initializedRate.isActive,
            createdAt: initializedRate.createdAt,
            updatedAt: initializedRate.updatedAt,
          },
        },
      });
    } catch (error) {
      console.error("Error initializing currency rate:", error);
      return next(
        new AppError(
          "Failed to initialize currency rate",
          500,
          httpStatusText.ERROR
        )
      );
    }
  }
);
