import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../utils/prisma";
import asyncWrapper from "../middlewares/asyncWrapper";
import generateJWT from "../middlewares/genrateJWT";
import AppError from "../utils/AppError";
import jwt from "jsonwebtoken";
import redis from "../utils/redis";
import { sendPasswordResetEmail } from "../utils/emailService";

interface RegisterBody {
  username: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  role: string;
}
interface LoginBody {
  email: string;
  password: string;
}

const register = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      username,
      email,
      password,
      passwordConfirmation,
      role,
    }: RegisterBody = req.body;
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const error = new AppError("User already exists", 400, "fail");
      return next(error);
    }

    if (passwordConfirmation !== password) {
      const error = new AppError(
        "Password not equal to Password Confirmation",
        400,
        "fail"
      );
      return next(error);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        role: (role === "admin" ? "admin" : "auditor") as any,
        passwordHash: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    // Generate JWT token
    const token = await generateJWT({
      email: newUser.email,
      id: newUser.id,
      role: newUser.role,
    });
    // Set cookie options
    const isProd = process.env.NODE_ENV === "production";
    return res.status(201).json({
      status: "success",
      data: {
        message: "User created successfully",
        user: newUser,
        token: token,
      },
    });
  }
);

const login = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password }: LoginBody = req.body;
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const error = new AppError("Invalid email or password", 401, "fail");
      return next(error);
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      const error = new AppError("Invalid email or password", 401, "fail");
      return next(error);
    }

    // Generate JWT token
    const token = await generateJWT({
      email: user.email,
      id: user.id,
      role: user.role,
    });

    // Set cookie options
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 10, // 10 days
      path: "/",
    });

    return res.status(200).json({
      status: "success",
      data: {
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        token: token,
      },
    });
  }
);

const logout = asyncWrapper(async (req: Request, res: Response) => {
  const isProd = process.env.NODE_ENV === "production";

  res.clearCookie("token", {
    path: "/",
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
  });

  res.status(200).json({
    status: "success",
    data: {
      message: "Logged out successfully",
    },
  });
});

const getCurrentUser = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    // Check if currentUser exists (comes from verifyToken middleware)
    if (!req.currentUser) {
      return next(new AppError("Not authenticated", 401, "fail"));
    }

    // Fetch user from DB to get the latest info
    const user = await prisma.user.findUnique({
      where: { id: req.currentUser.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return next(new AppError("User not found", 404, "fail"));
    }

    return res.status(200).json({
      status: "success",
      data: { user },
    });
  }
);

/**
 * Forgot Password - Send reset token to email
 * Access: Public
 */
const forgotPassword = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log("🔍 ForgotPassword function called");
    console.log("📧 Request body:", req.body);

    try {
      const { email } = req.body;

      if (!email) {
        console.log("❌ No email provided");
        return next(new AppError("Email is required", 400));
      }

      console.log("🔍 Looking for user with email:", email);

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { email },
      });

      console.log("👤 User found:", user ? "Yes" : "No");

      if (!user) {
        // Don't reveal if user exists or not for security
        console.log("📤 Sending success response for non-existent user");
        return res.status(200).json({
          status: "success",
          data: {
            message: "If the email exists, a password reset link has been sent",
          },
        });
      }

      console.log("🔑 Generating JWT token for user:", user.id);

      // Generate JWT token for password reset (expires in 15 minutes)
      const resetToken = jwt.sign(
        { userId: user.id, email: user.email, type: "password_reset" },
        process.env.JWT_SECRET || "fallback-secret",
        { expiresIn: "15m" }
      );

      console.log("🔑 JWT token generated successfully");

      // Store token in Redis with 15 minute expiration
      try {
        await redis.setex(`password_reset:${user.id}`, 900, resetToken);
        console.log("✅ Token stored in Redis successfully");
      } catch (redisError) {
        console.error("❌ Redis error:", redisError);
        // If Redis fails, we can still proceed but log the error
        // In production, you might want to handle this differently
      }

      // Generate reset URL
      const resetUrl = `${
        process.env.FRONTEND_URL || "http://localhost:8080"
      }/reset-password?token=${resetToken}`;

      console.log(`📧 Password reset URL generated: ${resetUrl}`);

      // Send email with reset link
      try {
        const emailSent = await sendPasswordResetEmail(
          user.email,
          resetUrl,
          user.username
        );

        if (emailSent) {
          console.log("✅ Password reset email sent successfully");
        } else {
          console.log("⚠️ Failed to send password reset email");
        }
      } catch (emailError) {
        console.error("❌ Email sending error:", emailError);
        // Continue with the response even if email fails
      }

      console.log("📤 Sending success response");
      return res.status(200).json({
        status: "success",
        data: {
          message: "If the email exists, a password reset link has been sent",
          // Remove this in production - only for development
          resetUrl:
            process.env.NODE_ENV === "development" ? resetUrl : undefined,
        },
      });
    } catch (error) {
      console.error("💥 Forgot password error:", error);
      return res.status(500).json({
        status: "error",
        message: "Internal server error occurred",
      });
    }
  }
);

/**
 * Reset Password - Reset password using token
 * Access: Public
 */
const resetPassword = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return next(
        new AppError(
          "Token, new password, and confirm password are required",
          400
        )
      );
    }

    if (newPassword !== confirmPassword) {
      return next(new AppError("Passwords do not match", 400));
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "fallback-secret"
      ) as any;

      if (decoded.type !== "password_reset") {
        return next(new AppError("Invalid token type", 400));
      }

      // Check if token exists in Redis
      const storedToken = await redis.get(`password_reset:${decoded.userId}`);

      if (!storedToken || storedToken !== token) {
        return next(new AppError("Invalid or expired reset token", 400));
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update user password
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { passwordHash: hashedPassword },
      });

      // Remove token from Redis
      await redis.del(`password_reset:${decoded.userId}`);

      res.status(200).json({
        status: "success",
        data: {
          message: "Password has been reset successfully",
        },
      });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return next(new AppError("Invalid or expired reset token", 400));
      }
      return next(new AppError("Error resetting password", 500));
    }
  }
);

/**
 * Verify Reset Token - Verify if reset token is valid
 * Access: Public
 */
const verifyResetToken = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.params;

    try {
      // Verify JWT token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "fallback-secret"
      ) as any;

      if (decoded.type !== "password_reset") {
        return next(new AppError("Invalid token type", 400));
      }

      // Check if token exists in Redis
      const storedToken = await redis.get(`password_reset:${decoded.userId}`);

      if (!storedToken || storedToken !== token) {
        return next(new AppError("Invalid or expired reset token", 400));
      }

      res.status(200).json({
        status: "success",
        data: {
          message: "Token is valid",
          email: decoded.email,
        },
      });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return next(new AppError("Invalid or expired reset token", 400));
      }
      return next(new AppError("Error verifying token", 500));
    }
  }
);

export {
  register,
  login,
  logout,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  verifyResetToken,
};
