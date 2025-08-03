import { body, param, query } from "express-validator";

// Validate payment ID parameter
const paymentIdValidator = [
  param("id")
    .notEmpty()
    .withMessage("Payment ID is required")
    .isUUID()
    .withMessage("Payment ID must be a valid UUID"),
];

// Validate student ID parameter
const studentIdValidator = [
  param("studentId")
    .notEmpty()
    .withMessage("Student ID is required")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Student ID must be between 1 and 50 characters"),
];

// Validate receipt number parameter
const receiptNumberValidator = [
  param("receiptNumber")
    .notEmpty()
    .withMessage("Receipt number is required")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Receipt number must be between 1 and 100 characters"),
];

// Validate payment creation data
const createPaymentValidator = [
  body("studentId")
    .notEmpty()
    .withMessage("Student ID is required")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Student ID must be between 1 and 50 characters"),

  body("studentName")
    .notEmpty()
    .withMessage("Student name is required")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Student name must be between 2 and 100 characters")
    .matches(/^[a-zA-Z\u0600-\u06FF\s]+$/)
    .withMessage("Student name can only contain letters and spaces"),

  body("feeType")
    .notEmpty()
    .withMessage("Fee type is required")
    .isIn([
      "NEW_YEAR",
      "SUPPLEMENTARY",
      "TRAINING",
      "STUDENT_SERVICES",
      "OTHER",
      "EXAM",
    ])
    .withMessage(
      "Fee type must be one of: NEW_YEAR, SUPPLEMENTARY, TRAINING, STUDENT_SERVICES, OTHER, EXAM"
    ),

  body("amount")
    .notEmpty()
    .withMessage("Amount is required")
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("Amount must be a valid decimal with up to 2 decimal places")
    .custom((value) => {
      const amount = parseFloat(value);
      if (amount <= 0) {
        throw new Error("Amount must be greater than 0");
      }
      if (amount > 999999999999.99) {
        throw new Error("Amount exceeds maximum limit");
      }
      return true;
    }),

  body("receiptNumber")
    .notEmpty()
    .withMessage("Receipt number is required")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Receipt number must be between 1 and 100 characters")
    .matches(/^[a-zA-Z0-9\-_]+$/)
    .withMessage(
      "Receipt number can only contain letters, numbers, hyphens, and underscores"
    ),

  body("paymentMethod")
    .notEmpty()
    .withMessage("Payment method is required")
    .isIn(["CASH", "TRANSFER", "CHEQUE"])
    .withMessage("Payment method must be one of: CASH, TRANSFER, CHEQUE"),

  body("paymentDate")
    .notEmpty()
    .withMessage("Payment date is required")
    .isISO8601()
    .withMessage("Payment date must be a valid date in ISO8601 format")
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      if (date > now) {
        throw new Error("Payment date cannot be in the future");
      }
      return true;
    }),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Notes must not exceed 500 characters"),
];

// Validate payment update data
const updatePaymentValidator = [
  ...paymentIdValidator,

  body("studentId")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Student ID must be between 1 and 50 characters"),

  body("studentName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Student name must be between 2 and 100 characters")
    .matches(/^[a-zA-Z\u0600-\u06FF\s]+$/)
    .withMessage("Student name can only contain letters and spaces"),

  body("feeType")
    .optional()
    .isIn([
      "NEW_YEAR",
      "SUPPLEMENTARY",
      "TRAINING",
      "STUDENT_SERVICES",
      "OTHER",
      "EXAM",
    ])
    .withMessage(
      "Fee type must be one of: NEW_YEAR, SUPPLEMENTARY, TRAINING, STUDENT_SERVICES, OTHER, EXAM"
    ),

  body("amount")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("Amount must be a valid decimal with up to 2 decimal places")
    .custom((value) => {
      if (value !== undefined) {
        const amount = parseFloat(value);
        if (amount <= 0) {
          throw new Error("Amount must be greater than 0");
        }
        if (amount > 999999999999.99) {
          throw new Error("Amount exceeds maximum limit");
        }
      }
      return true;
    }),

  body("receiptNumber")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Receipt number must be between 1 and 100 characters")
    .matches(/^[a-zA-Z0-9\-_]+$/)
    .withMessage(
      "Receipt number can only contain letters, numbers, hyphens, and underscores"
    ),

  body("paymentMethod")
    .optional()
    .isIn(["CASH", "TRANSFER", "CHEQUE"])
    .withMessage("Payment method must be one of: CASH, TRANSFER, CHEQUE"),

  body("paymentDate")
    .optional()
    .isISO8601()
    .withMessage("Payment date must be a valid date in ISO8601 format")
    .custom((value) => {
      if (value !== undefined) {
        const date = new Date(value);
        const now = new Date();
        if (date > now) {
          throw new Error("Payment date cannot be in the future");
        }
      }
      return true;
    }),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Notes must not exceed 500 characters"),
];

// Validate pagination and search parameters
const paginationValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be a positive integer between 1 and 100"),

  query("search")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Search term must not exceed 100 characters"),

  query("feeType")
    .optional()
    .isIn([
      "NEW_YEAR",
      "SUPPLEMENTARY",
      "TRAINING",
      "STUDENT_SERVICES",
      "OTHER",
      "EXAM",
    ])
    .withMessage(
      "Fee type must be one of: NEW_YEAR, SUPPLEMENTARY, TRAINING, STUDENT_SERVICES, OTHER, EXAM"
    ),

  query("paymentMethod")
    .optional()
    .isIn(["CASH", "TRANSFER", "CHEQUE"])
    .withMessage("Payment method must be one of: CASH, TRANSFER, CHEQUE"),

  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid date in ISO8601 format"),

  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid date in ISO8601 format"),
];

export {
  paymentIdValidator,
  studentIdValidator,
  receiptNumberValidator,
  createPaymentValidator,
  updatePaymentValidator,
  paginationValidator,
};
