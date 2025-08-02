import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import asyncWrapper from "./asyncWrapper";
import AppError from "../utils/AppError";

// Extend the Request interface to include currentUser
declare global {
  namespace Express {
    interface Request {
      currentUser?: any;
    }
  }
}

const verifyToken = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.token;

    if (!token) {
      return next(new AppError("Access token is required", 401, "fail"));
    }

    try {
      const jwtSecret = process.env.JWT_SECRET_KEY;
      if (!jwtSecret) {
        return next(new AppError("JWT secret not configured", 500, "error"));
      }

      const decoded = jwt.verify(token, jwtSecret) as any;
      req.currentUser = decoded;
      next();
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        return next(new AppError("Token has expired", 401, "fail"));
      } else if (err instanceof jwt.JsonWebTokenError) {
        return next(new AppError("Invalid token", 401, "fail"));
      } else {
        return next(new AppError("Token verification failed", 401, "fail"));
      }
    }
  }
);

export default verifyToken;
