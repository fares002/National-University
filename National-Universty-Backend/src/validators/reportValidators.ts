import { param, query } from "express-validator";

// Validate date parameter for daily reports
const dateValidator = [
  param("date")
    .notEmpty()
    .withMessage("Date is required")
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("Date must be in YYYY-MM-DD format")
    .isISO8601()
    .withMessage("Date must be a valid ISO 8601 date")
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      if (date > today) {
        throw new Error("Date cannot be in the future");
      }

      // Check if date is not too far in the past (e.g., not more than 5 years ago)
      const fiveYearsAgo = new Date();
      fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

      if (date < fiveYearsAgo) {
        throw new Error("Date cannot be more than 5 years in the past");
      }

      return true;
    }),
];

// Validate year and month parameters for monthly reports
const monthlyReportValidator = [
  param("year")
    .notEmpty()
    .withMessage("Year is required")
    .isInt({ min: 2020, max: new Date().getFullYear() })
    .withMessage(`Year must be between 2020 and ${new Date().getFullYear()}`),

  param("month")
    .notEmpty()
    .withMessage("Month is required")
    .isInt({ min: 1, max: 12 })
    .withMessage("Month must be between 1 and 12"),
];

// Validate year parameter for yearly reports
const yearlyReportValidator = [
  param("year")
    .notEmpty()
    .withMessage("Year is required")
    .isInt({ min: 2020, max: new Date().getFullYear() })
    .withMessage(`Year must be between 2020 and ${new Date().getFullYear()}`),
];

export { dateValidator, monthlyReportValidator, yearlyReportValidator };

// Validate custom range (query: from, to) for custom PDF report
const rangeReportValidator = [
  query("from")
    .notEmpty()
    .withMessage("from is required")
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("from must be in YYYY-MM-DD format")
    .isISO8601()
    .withMessage("from must be a valid ISO 8601 date"),
  query("to")
    .notEmpty()
    .withMessage("to is required")
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("to must be in YYYY-MM-DD format")
    .isISO8601()
    .withMessage("to must be a valid ISO 8601 date")
    .custom((value, { req }) => {
      const r: any = req as any;
      const from = new Date(String(r?.query?.from));
      const to = new Date(String(value));

      if (isNaN(from.getTime()) || isNaN(to.getTime())) {
        throw new Error("Invalid date range");
      }

      if (from > to) {
        throw new Error("from must be before or equal to to");
      }

      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (to > today) {
        throw new Error("to cannot be in the future");
      }

      const fiveYearsAgo = new Date();
      fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
      if (from < fiveYearsAgo) {
        throw new Error("from cannot be more than 5 years in the past");
      }

      return true;
    }),
];

export { rangeReportValidator };
