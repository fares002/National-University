import { Redis } from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD || undefined,
  lazyConnect: true,
  connectTimeout: 10000,
  commandTimeout: 5000,
  maxRetriesPerRequest: 3,
  keepAlive: 30000,
  enableReadyCheck: true,
  enableOfflineQueue: false,
  showFriendlyErrorStack: process.env.NODE_ENV !== "production",
});

redis.on("connect", () => {
  console.log("✅ Redis connected successfully");
});
redis.on("error", (err) => {
  console.error("❌ Redis connection error:", err);
});
redis.on("ready", () => {
  console.log("🚀 Redis is ready to accept commands");
});

/**
 * Cache invalidation utilities
 */
export const invalidateDashboardCache = async (): Promise<void> => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Invalidate current day dashboard cache
    const todayCacheKey = `dashboard:report:${currentYear}:${currentMonth}:${now.getDate()}`;

    // Also invalidate yesterday's cache in case of late entries
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayCacheKey = `dashboard:report:${yesterday.getFullYear()}:${yesterday.getMonth()}:${yesterday.getDate()}`;

    await redis.del(todayCacheKey, yesterdayCacheKey);
    console.log("🗑️ Dashboard cache invalidated for dashboard updates");
  } catch (error) {
    console.warn(
      "⚠️ Dashboard cache invalidation error:",
      (error as Error).message
    );
  }
};

export const invalidateExpenseCache = async (): Promise<void> => {
  try {
    // Get all keys that match expense cache pattern
    const keys = await redis.keys("expenses:all:*");
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`🗑️ Invalidated ${keys.length} expense cache keys`);
    }
  } catch (error) {
    console.warn(
      "⚠️ Expense cache invalidation error:",
      (error as Error).message
    );
  }
};

export const invalidatePaymentCache = async (): Promise<void> => {
  try {
    // Get all keys that match payment cache pattern
    const keys = await redis.keys("payments:all:*");
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`🗑️ Invalidated ${keys.length} payment cache keys`);
    }
  } catch (error) {
    console.warn(
      "⚠️ Payment cache invalidation error:",
      (error as Error).message
    );
  }
};

export default redis;
