import request from "supertest";
import express from "express";
import { register, login } from "../controllers/authControllers";
import { prisma } from "../utils/prisma";
import bcrypt from "bcrypt";
import AppError from "../utils/AppError";

// Mock Prisma
jest.mock("../utils/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Mock bcrypt
jest.mock("bcrypt", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// Mock JWT generator
jest.mock("../middlewares/genrateJWT", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// إنشاء تطبيق Express للاختبار
const app = express();
app.use(express.json());

// إضافة routes
app.post("/api/auth/register", register);
app.post("/api/auth/login", login);

// Error handling middleware
app.use(
  (
    error: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        status: error.status,
        message: error.message,
      });
    }

    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
);

describe("Auth Controller Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/auth/register - User Registration", () => {
    it("should register a new user successfully", async () => {
      const newUser = {
        username: "testuser",
        email: "test@example.com",
        password: "Test123!@#",
        passwordConfirmation: "Test123!@#",
      };

      const hashedPassword = "hashed_password_123";
      const mockCreatedUser = {
        id: "user-123",
        username: "testuser",
        email: "test@example.com",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock bcrypt hash
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      // Mock Prisma responses
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null); // لا يوجد user بنفس الـ email
      (prisma.user.create as jest.Mock).mockResolvedValue(mockCreatedUser);

      const response = await request(app)
        .post("/api/auth/register")
        .send(newUser)
        .expect(201);

      expect(response.body.status).toBe("success");
      expect(response.body.data).toHaveProperty("user");
      expect(response.body.data).toHaveProperty("token");
      expect(response.body.data.user.email).toBe("test@example.com");

      // تحقق من استدعاء bcrypt
      expect(bcrypt.hash).toHaveBeenCalledWith("Test123!@#", 12);

      // تحقق من Prisma calls
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          username: "testuser",
          email: "test@example.com",
          password: hashedPassword,
          role: "admin",
        },
        select: expect.any(Object),
      });
    });

    it("should return error for duplicate email", async () => {
      const newUser = {
        username: "newuser",
        email: "existing@example.com",
        password: "Test123!@#",
        passwordConfirmation: "Test123!@#",
      };

      // Mock existing user with same email
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "existing-user",
        email: "existing@example.com",
      });

      const response = await request(app)
        .post("/api/auth/register")
        .send(newUser)
        .expect(400);

      expect(response.body.status).toBe("fail");
      expect(response.body.message).toBe("User already exists");

      // تأكد أن create لم يتم استدعاؤه
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it("should return error for password mismatch", async () => {
      const newUser = {
        username: "testuser",
        email: "test@example.com",
        password: "Test123!@#",
        passwordConfirmation: "DifferentPassword123",
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post("/api/auth/register")
        .send(newUser)
        .expect(400);

      expect(response.body.status).toBe("fail");
      expect(response.body.message).toBe(
        "Password not equal to Password Confirmation"
      );

      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });
  });

  describe("POST /api/auth/login - User Login", () => {
    it("should login user successfully with valid credentials", async () => {
      const loginData = {
        email: "user@example.com",
        password: "Test123!@#",
      };

      const mockUser = {
        id: "user-123",
        username: "testuser",
        email: "user@example.com",
        password: "hashed_password",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock Prisma user lookup
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // Mock bcrypt compare
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(200);

      expect(response.body.status).toBe("success");
      expect(response.body.data).toHaveProperty("user");
      expect(response.body.data).toHaveProperty("token");
      expect(response.body.data.user.email).toBe("user@example.com");

      // تحقق من Prisma calls
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "user@example.com" },
        select: expect.any(Object),
      });

      // تحقق من bcrypt
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "Test123!@#",
        "hashed_password"
      );
    });

    it("should return error for invalid email", async () => {
      const loginData = {
        email: "nonexistent@example.com",
        password: "Test123!@#",
      };

      // Mock user not found
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(401);

      expect(response.body.status).toBe("fail");
      expect(response.body.message).toBe("User not found");

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it("should return error for invalid password", async () => {
      const loginData = {
        email: "user@example.com",
        password: "wrongpassword",
      };

      const mockUser = {
        id: "user-123",
        email: "user@example.com",
        password: "hashed_password",
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(401);

      expect(response.body.status).toBe("fail");
      expect(response.body.message).toBe("Invalid password");

      expect(bcrypt.compare).toHaveBeenCalledWith(
        "wrongpassword",
        "hashed_password"
      );
    });
  });
});
