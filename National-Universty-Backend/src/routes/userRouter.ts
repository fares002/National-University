import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  createUser,
} from "../controllers/userController";
import {
  getUsersQueryValidator,
  userIdValidator,
  updateUserValidator,
  registerValidator,
} from "../validators/userValidators";
import validate from "../middlewares/validate";
import verifyToken from "../middlewares/verifyToken";
import allowedTo from "../middlewares/allowedTo";
const userRouter = express.Router();
// Apply authentication middleware to all routes

userRouter.use(verifyToken);

/**
 * GET /api/v1/users
 * Get all users (admin only)
 * Query Parameters:
 * - page: page number (optional, default: 1)
 * - limit: results per page (optional, default: 10)
 */
userRouter
  .route("/")
  .get(allowedTo("admin"), getUsersQueryValidator, validate, getAllUsers)
  .post(allowedTo("admin"), registerValidator, validate, createUser);

/**
 * GET /api/v1/users/:id
 * Get user by ID
 * User can view their own data, admin can view any user
 */
userRouter.route("/:id").get(userIdValidator, validate, getUserById);

/**
 * PATCH /api/v1/users/:id
 * Update user data
 * User can update their own data, admin can update any user
 * Body Parameters:
 * - name: new user name (optional)
 * - email: new email (optional)
 * - password: current password (required when changing password for regular user)
 * - newPassword: new password (optional)
 * - avatar: avatar URL (optional)
 */
userRouter.route("/:id").patch(updateUserValidator, validate, updateUser);

/**
 * DELETE /api/v1/users/:id
 * Delete user
 * User can delete their own account, admin can delete any user
 * Warning: Last admin cannot delete themselves
 */
userRouter.route("/:id").delete(userIdValidator, validate, deleteUser);

export default userRouter;
