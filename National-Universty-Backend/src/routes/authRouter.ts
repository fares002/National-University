import express from "express";
import {
  register,
  login,
  logout,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  verifyResetToken,
} from "../controllers/authControllers";

import {
  registerValidator,
  loginValidator,
} from "../validators/authValidators";
import validate from "../middlewares/validate";
import verifyToken from "../middlewares/verifyToken";

const authRouter = express.Router();

// Traditional authentication routes
authRouter.route("/login").post(loginValidator, validate, login);

authRouter.route("/signup").post(registerValidator, validate, register);

authRouter.route("/logout").post(logout);

authRouter.route("/me").get(verifyToken, getCurrentUser);

/**
 * POST /api/auth/forgot-password
 * Send password reset email
 * Access: Public
 */
authRouter.post("/forgot-password", forgotPassword);

/**
 * POST /api/auth/reset-password
 * Reset password using token
 * Access: Public
 */
authRouter.post("/reset-password", resetPassword);

/**
 * GET /api/auth/verify-reset-token/:token
 * Verify reset token validity
 * Access: Public
 */
authRouter.get("/verify-reset-token/:token", verifyResetToken);


export default authRouter;
