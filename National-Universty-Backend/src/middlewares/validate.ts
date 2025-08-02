import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import AppError from "../utils/AppError";
import { httpStatusText } from "../utils/httpStatusText";
const validate = (req: Request, res: Response, next: NextFunction) => {
const errors = validationResult(req);
if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map((err) => err.msg);
    return next(
    new AppError(extractedErrors.join(", "), 400, httpStatusText.FAIL)
    );
}
next();
};
export default validate;