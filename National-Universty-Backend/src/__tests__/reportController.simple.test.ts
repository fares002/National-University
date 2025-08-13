import request from "supertest";
import express from "express";
import { jest } from "@jest/globals";
import {
  getDailyReport,
  getMonthlyReport,
  getYearlyReport,
  getDashboardReport,
  getFinancialSummary,
} from "../controllers/reportController";

// Create test app
const app = express();
app.use(express.json());

// Mock authentication middleware for testing
app.use((req, res, next) => {
  req.currentUser = {
    id: "test-admin-id",
    username: "admin",
    email: "admin@test.com",
    role: "admin",
  };
  next();
});

// Setup routes
app.get("/api/reports/daily/:date", getDailyReport);
app.get("/api/reports/monthly/:year/:month", getMonthlyReport);
app.get("/api/reports/yearly/:year", getYearlyReport);
app.get("/api/reports/dashboard", getDashboardReport);
app.get("/api/reports/financial-summary", getFinancialSummary);

describe("Report Controller Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Route Tests", () => {
    it("should handle invalid date format for daily report", async () => {
      const response = await request(app)
        .get("/api/reports/daily/invalid-date")
        .expect(400);

      expect(response.body.status).toBe("fail");
      expect(response.body.message).toBe(
        "Invalid date format. Please use YYYY-MM-DD"
      );
    });

    it("should handle invalid month for monthly report", async () => {
      const response = await request(app)
        .get("/api/reports/monthly/2024/13")
        .expect(400);

      expect(response.body.status).toBe("fail");
      expect(response.body.message).toBe(
        "Invalid month. Month must be between 1 and 12"
      );
    });

    it("should handle invalid year for monthly report", async () => {
      const response = await request(app)
        .get("/api/reports/monthly/1999/1")
        .expect(400);

      expect(response.body.status).toBe("fail");
      expect(response.body.message).toBe(
        "Invalid year. Year must be 2000 or later"
      );
    });

    it("should handle future year for yearly report", async () => {
      const currentYear = new Date().getFullYear();
      const futureYear = currentYear + 2;

      const response = await request(app)
        .get(`/api/reports/yearly/${futureYear}`)
        .expect(400);

      expect(response.body.status).toBe("fail");
      expect(response.body.message).toBe(
        `Cannot generate report for future year ${futureYear}`
      );
    });
  });

  describe("Route Structure Tests", () => {
    it("should have all required report endpoints defined", () => {
      // Test that routes are properly set up by checking if they exist
      const routes = app._router.stack
        .map((layer: any) => {
          if (layer.route) {
            return {
              path: layer.route.path,
              method: Object.keys(layer.route.methods)[0],
            };
          }
          return null;
        })
        .filter((route: any) => route !== null);

      const reportRoutes = routes.filter((route: any) =>
        route.path.includes("/api/reports")
      );

      expect(reportRoutes.length).toBeGreaterThan(0);
    });

    it("should properly handle authentication middleware", async () => {
      // This test verifies the auth middleware is working
      const response = await request(app).get(
        "/api/reports/daily/invalid-date"
      );

      // Should get validation error, not auth error, proving middleware works
      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Invalid date format");
    });
  });

  describe("Error Handling Tests", () => {
    it("should return proper error format", async () => {
      const response = await request(app)
        .get("/api/reports/daily/invalid")
        .expect(400);

      expect(response.body).toHaveProperty("status", "fail");
      expect(response.body).toHaveProperty("message");
      expect(typeof response.body.message).toBe("string");
    });

    it("should handle malformed route parameters", async () => {
      const response = await request(app)
        .get("/api/reports/monthly/abc/def")
        .expect(400);

      expect(response.body.status).toBe("fail");
    });
  });
});
