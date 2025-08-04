import { Router } from "express";
import {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpensesByCategory,
  getExpensesByVendor,
} from "../controllers/expenseController";
import {
  expenseIdValidator,
  categoryValidator,
  vendorValidator,
  createExpenseValidator,
  updateExpenseValidator,
  paginationValidator,
  dateRangeValidator,
} from "../validators/expenseValidators";
import validate from "../middlewares/validate";
import verifyToken from "../middlewares/verifyToken";
import allowedTo from "../middlewares/allowedTo";

const router = Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

/**
 * GET /api/expenses
 * Get all expenses with pagination and filtering
 * Access: admin, auditor
 */
router.get(
  "/",
  allowedTo("admin", "auditor"),
  paginationValidator,
  dateRangeValidator,
  validate,
  getAllExpenses
);

/**
 * GET /api/expenses/:id
 * Get expense by ID
 * Access: admin, auditor
 */
router.get(
  "/:id",
  allowedTo("admin", "auditor"),
  expenseIdValidator,
  validate,
  getExpenseById
);

/**
 * POST /api/expenses
 * Create new expense
 * Access: admin only
 */
router.post(
  "/",
  allowedTo("admin"),
  createExpenseValidator,
  validate,
  createExpense
);

/**
 * PATCH /api/expenses/:id
 * Update expense by ID
 * Access: admin only
 */
router.patch(
  "/:id",
  allowedTo("admin"),
  expenseIdValidator,
  updateExpenseValidator,
  validate,
  updateExpense
);

/**
 * DELETE /api/expenses/:id
 * Delete expense by ID
 * Access: admin only
 */
router.delete(
  "/:id",
  allowedTo("admin"),
  expenseIdValidator,
  validate,
  deleteExpense
);

/**
 * GET /api/expenses/category/:category
 * Get expenses by category
 * Access: admin, auditor
 */
router.get(
  "/category/:category",
  allowedTo("admin", "auditor"),
  categoryValidator,
  paginationValidator,
  validate,
  getExpensesByCategory
);

/**
 * GET /api/expenses/vendor/:vendor
 * Get expenses by vendor
 * Access: admin, auditor
 */
router.get(
  "/vendor/:vendor",
  allowedTo("admin", "auditor"),
  vendorValidator,
  paginationValidator,
  validate,
  getExpensesByVendor
);

export default router;
