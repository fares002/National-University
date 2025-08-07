import { param } from "express-validator";

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
