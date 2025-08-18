import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import userRouter from "./routes/userRouter";
import authRouter from "./routes/authRouter";
import paymentRoutes from "./routes/paymentRoutes";
import expenseRoutes from "./routes/expenseRoutes";
import reportRoutes from "./routes/reportRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:8080",
      "http://localhost:8081",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// // Session configuration for Passport.js
// app.use(
//   session({
//     secret:
//       process.env.SESSION_SECRET || "your-secret-key-change-in-production",
//     resave: false,
//     saveUninitialized: false,
//     cookie: {
//       secure: process.env.NODE_ENV === "production",
//       maxAge: 1000 * 60 * 60 * 24 * 10, // 10 days
//     },
//   })
// );

// Passport.js middleware

// Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/expenses", expenseRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/analytics", analyticsRoutes);

app.use((req: Request, res: Response) => {
  return res.status(404).json({
    status: "fail",
    data: {
      message: "This resource is not available",
    },
  });
});

//global error handler
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = error.statusCode || 500;

  // JSend format based on error type
  if (error.status === "fail") {
    // Client errors (4xx)
    return res.status(statusCode).json({
      status: "fail",
      data: {
        message: error.message,
      },
    });
  } else {
    // Server errors (5xx)
    return res.status(statusCode).json({
      status: "error",
      message: error.message || "Internal server error",
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
