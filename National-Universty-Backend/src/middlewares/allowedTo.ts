import { Request, Response, NextFunction } from "express";
import AppError from "../utils/AppError";


export default (...roles: string[]) => {
return (req: Request, res: Response, next: NextFunction) => {
    console.log("Required roles:", roles);
    console.log("User role:", req.currentUser.role);
    if (!roles.includes(req.currentUser.role.toLowerCase())) {
    return next(
        new AppError(
        `Access denied. Required role(s): ${roles.join(", ")}`,
        403,
        "fail"
        )
    );
    }
    next(); 
};
};
