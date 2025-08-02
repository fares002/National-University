import { Request, Response, NextFunction } from "express";

type AsyncFunction = (
req: Request,
res: Response,
next: NextFunction
) => Promise<any>;

const asyncWrapper = (asyncFn: AsyncFunction) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(asyncFn(req, res, next)).catch((error) => {
            console.log(error);
            next(error);
        });
    };
};

export default asyncWrapper;
