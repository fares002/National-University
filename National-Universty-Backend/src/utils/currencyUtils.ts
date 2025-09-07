import { prisma } from "./prisma";

/**
 * Currency conversion utilities for handling EGP (local) to USD conversion.
 * Stored rate meaning: number of EGP for 1 USD (e.g. 50 means 1 USD = 50 EGP).
 * Conversion formula: amountUSD = amountEGP / rate.
 */

const BASE_RATE_CURRENCY = "USD"; // CurrencyRate.currency represents the base (USD)

/** Get the latest active base (USD) currency rate */
export const getLatestRate = async (currency = BASE_RATE_CURRENCY) => {
  try {
    return await prisma.currencyRate.findFirst({
      where: { currency, isActive: true },
      orderBy: { validFrom: "desc" },
    });
  } catch (error) {
    console.error("Error fetching latest currency rate:", error);
    return null;
  }
};

/** Convert amount in EGP to USD using the latest EGP-per-USD rate */
export const convertToUSD = async (amountEGP: number) => {
  try {
    const rateRecord = await getLatestRate();
    if (!rateRecord) {
      console.warn("No active USD rate found");
      return { amountUSD: null, usdAppliedRate: null };
    }
    const rate = Number(rateRecord.rate); // EGP per 1 USD
    const amountUSD = Number((amountEGP / rate).toFixed(2));
    return { amountUSD, usdAppliedRate: rate };
  } catch (error) {
    console.error("Error converting currency:", error);
    return { amountUSD: null, usdAppliedRate: null };
  }
};

/**
 * Update currency rate (Admin only)
 * @param newRate EGP per 1 USD
 */
export const updateCurrencyRate = async (
  newRate: number,
  currency = BASE_RATE_CURRENCY
) => {
  try {
    return await prisma.$transaction(async (tx) => {
      await tx.currencyRate.updateMany({
        where: { currency, isActive: true },
        data: { isActive: false },
      });
      return await tx.currencyRate.create({
        data: {
          currency,
          rate: newRate,
          isActive: true,
          validFrom: new Date(),
        },
      });
    });
  } catch (error) {
    console.error("Error updating currency rate:", error);
    throw error;
  }
};

/** Get recent rate history (most recent first) */
export const getCurrencyRateHistory = async (
  currency = BASE_RATE_CURRENCY,
  limit = 10
) => {
  try {
    return await prisma.currencyRate.findMany({
      where: { currency },
      orderBy: { validFrom: "desc" },
      take: limit,
    });
  } catch (error) {
    console.error("Error fetching rate history:", error);
    return [];
  }
};

/** Initialize a default rate if none exists */
export const initializeDefaultRate = async (
  currency = BASE_RATE_CURRENCY,
  defaultRate = 50
) => {
  try {
    const existingRate = await getLatestRate(currency);
    if (!existingRate) {
      console.log(
        `No rate found for ${currency}, seeding default rate ${defaultRate}`
      );
      return await updateCurrencyRate(defaultRate, currency);
    }
    return existingRate;
  } catch (error) {
    console.error("Error initializing default rate:", error);
    throw error;
  }
};

/** Basic rate input validation (EGP per USD) */
export const validateCurrencyRate = (
  rate: any
): { isValid: boolean; rate?: number; error?: string } => {
  if (rate === undefined || rate === null || rate === "")
    return { isValid: false, error: "Rate is required" };
  const numericRate = Number(rate);
  if (isNaN(numericRate))
    return { isValid: false, error: "Rate must be a number" };
  if (numericRate <= 0)
    return { isValid: false, error: "Rate must be greater than 0" };
  if (numericRate > 1000)
    return { isValid: false, error: "Rate is unexpectedly large" };
  return { isValid: true, rate: numericRate };
};
