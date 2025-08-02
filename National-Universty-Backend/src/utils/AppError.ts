// Custom error class for handling application errors
class AppError extends Error {
  statusCode: number;
  status: string;

  constructor(message: string, statusCode: number, status: string = "error") {
    super(message);
    this.statusCode = statusCode;
    this.status = status;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

export default AppError;
