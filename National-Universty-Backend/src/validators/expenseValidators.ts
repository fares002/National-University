import { body, param, query } from "express-validator";
// Validate expense ID parameter
const expenseIdValidator = [
param("id")
    .notEmpty()
    .withMessage("Expense ID is required")
    .isString()
    .withMessage("Expense ID must be a valid string")
    .isLength({ min: 1 })
    .withMessage("Expense ID cannot be empty"),
];
// Validate category parameter
const categoryValidator = [
param("category")
    .notEmpty()
    .withMessage("Category is required")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Category must be between 1 and 100 characters"),
];
// Validate vendor parameter
const vendorValidator = [
param("vendor")
    .notEmpty()
    .withMessage("Vendor is required")
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage("Vendor must be between 1 and 255 characters"),
];
// Validate expense creation data
const createExpenseValidator = [
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
body("description")
    .notEmpty()
    .withMessage("Description is required")
    .trim()
    .isLength({ min: 3, max: 1000 })
    .withMessage("Description must be between 3 and 1000 characters"),
body("category")
    .notEmpty()
    .withMessage("Category is required")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Category must be between 2 and 100 characters")
    .matches(/^[a-zA-Z\u0600-\u06FF\s\-_]+$/)
    .withMessage(
    "Category can only contain letters, spaces, hyphens, and underscores"
    ),
body("vendor")
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage("Vendor must be between 2 and 255 characters if provided")
    .matches(/^[a-zA-Z\u0600-\u06FF0-9\s\-_.&]+$/)
    .withMessage("Vendor contains invalid characters"),
body("receiptUrl")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Receipt URL must not exceed 500 characters")
    .isURL()
    .withMessage("Receipt URL must be a valid URL"),
body("date")
    .notEmpty()
    .withMessage("Date is required")
    .isISO8601()
    .withMessage("Date must be a valid ISO 8601 date")
    .custom((value) => {
    const date = new Date(value);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    if (date > today) {
        throw new Error("Date cannot be in the future");
    }
    // Check if date is not too far in the past (e.g., not more than 10 years ago)
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    if (date < tenYearsAgo) {
        throw new Error("Date cannot be more than 10 years in the past");
    }
    return true;
    }),
];
// Validate expense update data (all fields optional)
const updateExpenseValidator = [
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
body("description")
    .optional()
    .trim()
    .isLength({ min: 3, max: 1000 })
    .withMessage("Description must be between 3 and 1000 characters"),
body("category")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Category must be between 2 and 100 characters")
    .matches(/^[a-zA-Z\u0600-\u06FF\s\-_]+$/)
    .withMessage(
    "Category can only contain letters, spaces, hyphens, and underscores"
    ),
body("vendor")
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage("Vendor must be between 2 and 255 characters if provided")
    .matches(/^[a-zA-Z\u0600-\u06FF0-9\s\-_.&]+$/)
    .withMessage("Vendor contains invalid characters"),
body("receiptUrl")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Receipt URL must not exceed 500 characters")
    .isURL()
    .withMessage("Receipt URL must be a valid URL"),
body("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be a valid ISO 8601 date")
    .custom((value) => {
    if (value !== undefined) {
        const date = new Date(value);
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today
        if (date > today) {
        throw new Error("Date cannot be in the future");
        }
        // Check if date is not too far in the past (e.g., not more than 10 years ago)
        const tenYearsAgo = new Date();
        tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
        if (date < tenYearsAgo) {
        throw new Error("Date cannot be more than 10 years in the past");
        }
    }
    return true;
    }),
];
// Validate pagination and filtering parameters
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
    .isLength({ min: 1, max: 100 })
    .withMessage("Search term must be between 1 and 100 characters"),
query("category")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Category filter must be between 1 and 100 characters"),
query("vendor")
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage("Vendor filter must be between 1 and 255 characters"),
query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid ISO 8601 date"),
query("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid ISO 8601 date"),
query("minAmount")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("Minimum amount must be a valid decimal")
    .custom((value) => {
    if (value !== undefined) {
        const amount = parseFloat(value);
        if (amount < 0) {
        throw new Error("Minimum amount cannot be negative");
        }
    }
    return true;
    }),
query("maxAmount")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("Maximum amount must be a valid decimal")
    .custom((value, { req }) => {
    if (value !== undefined) {
        const maxAmount = parseFloat(value);
        if (maxAmount < 0) {
        throw new Error("Maximum amount cannot be negative");
        }
        // Check if maxAmount is greater than minAmount if both are provided
        if (req.query && req.query.minAmount) {
        const minAmount = parseFloat(req.query.minAmount as string);
        if (maxAmount < minAmount) {
            throw new Error(
            "Maximum amount must be greater than minimum amount"
            );
        }
        }
    }
    return true;
    }),
];
// Custom validator to check date range consistency
const dateRangeValidator = [
query("startDate")
    .optional()
    .custom((value, { req }) => {
    if (value && req.query && req.query.endDate) {
        const startDate = new Date(value);
        const endDate = new Date(req.query.endDate as string);
        if (startDate > endDate) {
        throw new Error("Start date must be before end date");
        }
    }
    return true;
    }),
];
export {
expenseIdValidator,
categoryValidator,
vendorValidator,
createExpenseValidator,
updateExpenseValidator,
paginationValidator,
dateRangeValidator,
};