import { Router } from "express";
import {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  getPaymentsByStudentId,
  getPaymentByReceiptNumber,
} from "../controllers/paymentController";
import {
  paymentIdValidator,
  studentIdValidator,
  receiptNumberValidator,
  createPaymentValidator,
  updatePaymentValidator,
  paginationValidator,
} from "../validators/paymentValidators";
import validate from "../middlewares/validate";
import verifyToken from "../middlewares/verifyToken";
import allowedTo from "../middlewares/allowedTo";

const router = Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

/**
 * GET /api/payments
 * Get all payments with pagination and filtering
 * Access: admin, auditor
 */
router.get(
  "/",
  allowedTo("admin", "auditor"),
  paginationValidator,
  validate,
  getAllPayments
);

/**
 * GET /api/payments/:id
 * Get payment by ID
 * Access: admin, auditor
 */
router.get(
  "/:id",
  allowedTo("admin", "auditor"),
  paymentIdValidator,
  validate,
  getPaymentById
);

/**
 * POST /api/payments
 * Create new payment
 * Access: admin only
 */
router.post(
  "/",
  allowedTo("admin"),
  createPaymentValidator,
  validate,
  createPayment
);

/**
 * PUT /api/payments/:id
 * Update payment by ID
 * Access: admin only
 */
router.put(
  "/:id",
  allowedTo("admin"),
  updatePaymentValidator,
  validate,
  updatePayment
);

/**
 * DELETE /api/payments/:id
 * Delete payment by ID
 * Access: admin only
 */
router.delete(
  "/:id",
  allowedTo("admin"),
  paymentIdValidator,
  validate,
  deletePayment
);

/**
 * GET /api/payments/student/:studentId
 * Get payments by student ID
 * Access: admin, auditor
 */
router.get(
  "/student/:studentId",
  allowedTo("admin", "auditor"),
  studentIdValidator,
  paginationValidator,
  validate,
  getPaymentsByStudentId
);

/**
 * GET /api/payments/receipt/:receiptNumber
 * Get payment by receipt number
 * Access: admin, auditor
 */
router.get(
  "/receipt/:receiptNumber",
  allowedTo("admin", "auditor"),
  receiptNumberValidator,
  validate,
  getPaymentByReceiptNumber
);

export default router;
