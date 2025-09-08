import { Router } from "express";
import {
  markAttendance,
  getAttendanceHistory,
  getSessionAttendance,
} from "../controllers/attendanceController";
import { scanQRCode, uploadMiddleware } from "../controllers/qrScanController";
import { authenticate, authorize } from "../middleware/auth";
import { validateMarkAttendance } from "../middleware/validation";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Student routes
router.post("/claim", validateMarkAttendance, markAttendance);
router.get("/history", getAttendanceHistory);

// Teacher and Admin routes
router.get("/session/:id", authorize("teacher", "admin"), getSessionAttendance);
router.delete("/:id", authorize("teacher", "admin"), async (req, res) => {
  try {
    await require('../models/AttendanceRecord').default.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Attendance record deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete attendance record' });
  }
});
router.post("/verify", uploadMiddleware, scanQRCode);

export default router;

