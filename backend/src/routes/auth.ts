import { Router } from "express";
import { register, login, getProfile } from "../controllers/authController";
import { authenticate } from "../middleware/auth";
import { validateLogin, validateRegister } from "../middleware/validation";

const router = Router();

// Public routes
router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);

// Protected routes
router.get("/profile", authenticate, getProfile);

export default router;

