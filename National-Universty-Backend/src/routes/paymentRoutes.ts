import { Router } from "express";
import {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  getPaymentsByStudentId,
  getPaymentByReceiptNumber,
  searchPayments,
} from "../controllers/paymentController";
import { getPaymentReceiptPdf } from "../controllers/paymentController";
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

/**
 * GET /api/payments/verify/:receiptNumber
 * Public endpoint for receipt verification (no authentication required)
 * Access: Public
 */
router.get(
  "/verify/:receiptNumber",
  receiptNumberValidator,
  validate,
  getPaymentByReceiptNumber
);

// Apply authentication middleware to all routes below
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
 * GET /api/payments/search
 * Quick search payments
 * Access: admin, auditor
 */
router.get("/search", allowedTo("admin", "auditor"), validate, searchPayments);

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
 * GET /api/payments/:id/receipt
 * Get PDF receipt for payment
 * Access: admin, auditor
 */
router.get(
  "/:id/receipt",
  allowedTo("admin", "auditor"),
  paymentIdValidator,
  validate,
  getPaymentReceiptPdf
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
router.patch(
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
