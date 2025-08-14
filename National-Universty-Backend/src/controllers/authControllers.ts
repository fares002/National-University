import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../utils/prisma";
import asyncWrapper from "../middlewares/asyncWrapper";
import generateJWT from "../middlewares/genrateJWT";
import AppError from "../utils/AppError";


interface RegisterBody {
  username: string;
  email: string;
  password: string;
  passwordConfirmation: string;
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
        role: "auditor", // Default role
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
    const token = await generateJWT({ email: newUser.email, id: newUser.id });
    // Set cookie options
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 10, // 10 days
      path: "/",
    });
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

    console.log(token);

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


export { register, login, logout, getCurrentUser };
