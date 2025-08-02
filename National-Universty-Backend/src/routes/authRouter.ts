import express from "express";
import { register, login, logout, getCurrentUser } from "../controllers/authControllers";

import {
  registerValidator,
  loginValidator,
} from "../validators/authValidators";
import validate from "../middlewares/validate";
import verifyToken from "../middlewares/verifyToken";

const authRouter = express.Router();

// Traditional authentication routes
authRouter.route("/login").post(loginValidator, validate, login);

authRouter.route("/signup").post(registerValidator, validate, register);

authRouter.route("/logout").post(logout);
authRouter.route("/me").get(verifyToken ,getCurrentUser);

export default authRouter;
