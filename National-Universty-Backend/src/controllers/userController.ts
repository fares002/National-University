import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma";
import asyncWrapper from "../middlewares/asyncWrapper";
import AppError from "../utils/AppError";
import bcrypt from "bcrypt";

// Types for request validation
interface UpdateUserBody {
  email?: string;
  password?: string;
  newPassword?: string;
  role?: "admin" | "auditor";
}

interface CreateUserBody {
  username: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  role?: "admin" | "auditor";
}

/**
 * Get all users (admin only)
 * Authorization handled by allowedTo middleware
 */
const getAllUsers = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    // Simple pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Get users with pagination
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        // Password excluded for security
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    return res.status(200).json({
      status: "success",
      data: {
        users,
        page,
        limit,
        count: users.length,
      },
    });
  }
);

/**
 * Get user by ID
 * Security: User can view their own data or admin can view any user
 */
const getUserById = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const currentUser = (req as any).currentUser;
    const currentUserId = currentUser?.id;
    const currentUserRole = currentUser?.role;

    // Check permissions: user can view own profile or admin can view any
    if (currentUserId !== id && currentUserRole !== "admin") {
      return next(
        new AppError(
          "Access denied. You can only view your own profile.",
          403,
          "fail"
        )
      );
    }

    // Find user by ID
    const foundUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        // Password excluded for security
      },
    });

    if (!foundUser) {
      return next(new AppError("User not found", 404, "fail"));
    }

    return res.status(200).json({
      status: "success",
      data: {
        user: foundUser,
      },
    });
  }
);

/**
 * Update user data
 * Security: User can update their own data or admin can update any user
 * Performance: Update only required fields
 */
const updateUser = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { email, password, newPassword, role }: UpdateUserBody = req.body;
    const currentUser = (req as any).currentUser;
    const currentUserId = currentUser?.id;
    const currentUserRole = currentUser?.role;

    // Check permissions
    if (currentUserId !== id && currentUserRole !== "admin") {
      return next(
        new AppError(
          "Access denied. You can only update your own profile.",
          403,
          "fail"
        )
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return next(new AppError("User not found", 404, "fail"));
    }

    // Build update data
    const updateData: any = {};

    // Update email
    if (email !== undefined) {
      // Check if email already exists
      const emailExists = await prisma.user.findUnique({
        where: { email, NOT: { id } },
      });

      if (emailExists) {
        return next(new AppError("Email already in use", 400, "fail"));
      }

      updateData.email = email.toLowerCase();
    }

    // Update password
    if (newPassword !== undefined) {
      // Check current password for regular users
      if (currentUserRole !== "admin" && currentUserId === id) {
        if (!password) {
          return next(
            new AppError(
              "Current password is required to set new password",
              400,
              "fail"
            )
          );
        }

        const isCurrentPasswordValid = await bcrypt.compare(
          password,
          existingUser.passwordHash
        );
        if (!isCurrentPasswordValid) {
          return next(
            new AppError("Current password is incorrect", 400, "fail")
          );
        }
      }

      // Hash new password
      updateData.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    // Update role (admin only)
    if (role !== undefined) {
      if (currentUserRole !== "admin") {
        return next(new AppError("Only admins can change roles", 403, "fail"));
      }

      if (role !== "admin" && role !== "auditor") {
        return next(new AppError("Invalid role", 400, "fail"));
      }

      // Prevent removing the last admin role if target is admin and will become auditor
      if (existingUser.role === "admin" && role !== "admin") {
        const adminCount = await prisma.user.count({
          where: { role: "admin" },
        });
        if (adminCount <= 1) {
          return next(
            new AppError("Cannot remove the last admin role", 400, "fail")
          );
        }
      }

      updateData.role = role as any;
    }

    // Update avatar (remove this section since avatar doesn't exist)
    // if (avatar !== undefined) {
    //   updateData.avatar = avatar;
    // }

    // updatedAt is handled automatically by Prisma @updatedAt

    // Execute the update
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      status: "success",
      data: {
        message: "User profile updated successfully",
        user: updatedUser,
      },
    });
  }
);

/**
 * Delete user
 * Security: User can delete their own account or admin can delete any user
 * Note: Should add logic for deleting related data (soft delete recommended)
 */
const deleteUser = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const currentUser = (req as any).currentUser;
    const currentUserId = currentUser?.id;
    const currentUserRole = currentUser?.role;

    // Check permissions
    if (currentUserId !== id && currentUserRole !== "admin") {
      return next(
        new AppError(
          "Access denied. You can only delete your own account.",
          403,
          "fail"
        )
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return next(new AppError("User not found", 404, "fail"));
    }

    // Prevent admin from deleting themselves if they're the last admin
    if (currentUserRole === "admin" && currentUserId === id) {
      const adminCount = await prisma.user.count({
        where: { role: "admin" },
      });

      if (adminCount <= 1) {
        return next(
          new AppError("Cannot delete the last admin user", 400, "fail")
        );
      }
    }

    // Delete user (in production, consider using soft delete)
    await prisma.user.delete({
      where: { id },
    });

    // Clear cookies if user is deleting their own account
    if (currentUserId === id) {
      const isProd = process.env.NODE_ENV === "production";
      res.clearCookie("token", {
        path: "/",
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
      });
    }

    return res.status(200).json({
      status: "success",
      data: {
        message: "User account deleted successfully",
      },
    });
  }
);

export { getAllUsers, getUserById, updateUser, deleteUser };

// Admin create user (does not log in as the new user)
const createUser = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const currentUserRole = (req as any).currentUser?.role;
    console.log(currentUserRole)
    if (currentUserRole !== "admin") {
      return next(new AppError("Only admins can create users", 403, "fail"));
    }

    const {
      username,
      email,
      password,
      passwordConfirmation,
      role,
    }: CreateUserBody = req.body;

    if (!username || !email || !password || !passwordConfirmation) {
      return next(new AppError("Missing required fields", 400, "fail"));
    }
    if (password !== passwordConfirmation) {
      return next(
        new AppError(
          "Password confirmation does not match password",
          400,
          "fail"
        )
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return next(new AppError("User already exists", 400, "fail"));
    }

    const hashed = await bcrypt.hash(password, 12);
    const newUser = await prisma.user.create({
      data: {
        username,
        email: email.toLowerCase(),
        passwordHash: hashed,
        role: (role === "admin" ? "admin" : "auditor") as any,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      status: "success",
      data: {
        message: "User created successfully",
        user: newUser,
      },
    });
  }
);

export { createUser };
