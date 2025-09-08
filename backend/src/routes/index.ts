import { Router } from "express";
import authRoutes from "./auth";
import sessionRoutes from "./sessions";
import attendanceRoutes from "./attendance";
import courseRoutes from "./courses";
import userRoutes from "./users";
import adminRoutes from "./admin";

const router = Router();

// API routes
router.use("/auth", authRoutes);
router.use("/sessions", sessionRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/courses", courseRoutes);
router.use("/users", userRoutes);
router.use("/admin", adminRoutes);

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "QR Attendance API is running",
    timestamp: new Date().toISOString(),
  });
});

export default router;

