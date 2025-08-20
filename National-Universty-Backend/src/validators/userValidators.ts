import { body, param, query } from "express-validator";

// Validate registration data
const registerValidator = [
  body("username")
    .notEmpty()
    .withMessage("Username is required")
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage("Username must be between 3 and 50 characters")
    .matches(/^[\p{L}\p{N}_\-\s]+$/u)
    .withMessage(
      "Username can contain letters (any language), numbers, spaces, underscores, and hyphens"
    ),
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage("Email must not exceed 100 characters"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),

  body("passwordConfirmation")
    .notEmpty()
    .withMessage("Password confirmation is required")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Password confirmation does not match password");
      }
      return true;
    }),
];

// Validate login data
const loginValidator = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 1 })
    .withMessage("Password cannot be empty"),
];

// Validate query parameters for search and filtering
const getUsersQueryValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .escape(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100")
    .escape(),

  query("search")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Search term must not exceed 100 characters")
    .escape(),

  query("role")
    .optional()
    .isIn(["admin", "accountant", "finance_employee", "auditor"])
    .withMessage(
      "Role must be one of: admin, accountant, finance_employee, auditor"
    )
    .escape(),
];

// Validate user ID parameter
const userIdValidator = [
  param("id")
    .notEmpty()
    .withMessage("User ID is required")
    .isLength({ min: 1, max: 50 })
    .withMessage("User ID must be between 1 and 50 characters"),
];

// Validate user update data
const updateUserValidator = [
  ...userIdValidator,

  body("username")
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage("Username must be between 3 and 50 characters")
    .matches(/^[\p{L}\p{N}_\-\s]+$/u)
    .withMessage(
      "Username can contain letters (any language), numbers, spaces, underscores, and hyphens"
    ),

  body("email")
    .optional()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage("Email must not exceed 100 characters"),

  body("password")
    .optional()
    .isLength({ min: 8 })
    .withMessage("Current password must be at least 8 characters long"),

  body("newPassword")
    .optional()
    .isLength({ min: 8, max: 128 })
    .withMessage("New password must be between 8 and 128 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "New password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),

  body("role")
    .optional()
    .isIn(["admin", "auditor"])
    .withMessage("Role must be one of: admin, auditor"),
];

export {
  registerValidator,
  loginValidator,
  getUsersQueryValidator,
  userIdValidator,
  updateUserValidator,
};
