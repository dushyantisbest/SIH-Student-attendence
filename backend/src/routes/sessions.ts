import { Router } from "express";
import {
  createSession,
  getSession,
  getQRCode,
  closeSession,
  getMySessions,
} from "../controllers/sessionController";
import { authenticate, authorize } from "../middleware/auth";
import { validateCreateSession } from "../middleware/validation";
import Session from "../models/Session";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Teacher and Admin routes
router.post(
  "/",
  authorize("teacher", "admin"),
  validateCreateSession,
  createSession
);
router.get("/my-sessions", getMySessions);
router.put("/:id", authorize("teacher", "admin"), async (req, res) => {
  try {
    const { title, description, duration } = req.body;
    const session = await Session.findByIdAndUpdate(
      req.params.id,
      { title, description, duration },
      { new: true }
    );
    res.json({ success: true, data: { session } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update session" });
  }
});
router.get("/active", async (req, res) => {
  try {
    const sessions = await Session.find({ isActive: true })
      .populate('course', 'name code')
      .populate('teacher', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: { sessions }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get active sessions'
    });
  }
});
router.get("/:id", getSession);
router.get("/:id/qr", authorize("teacher", "admin"), getQRCode);
router.post("/:id/close", authorize("teacher", "admin"), closeSession);

export default router;

