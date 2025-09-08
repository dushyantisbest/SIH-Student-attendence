import { Router } from "express";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

// Get user profile
router.get("/profile", async (req, res) => {
  try {
    const user = await require("../models/User").default.findById(req.user?.userId).select("-password");
    res.json({ success: true, data: { user } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get profile" });
  }
});

// Update profile
router.put("/profile", async (req, res) => {
  try {
    const { name, department } = req.body;
    const user = await require("../models/User").default.findByIdAndUpdate(
      req.user?.userId,
      { name, department },
      { new: true }
    ).select("-password");
    res.json({ success: true, data: { user } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
});

// Register device
router.post("/device", async (req, res) => {
  try {
    const { deviceId, deviceType } = req.body;
    // Store device info logic here
    res.json({ success: true, message: "Device registered" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to register device" });
  }
});

// Get enrolled courses
router.get("/courses", async (req, res) => {
  try {
    const courses = await require("../models/Course").default.find({ 
      students: req.user?.userId 
    });
    res.json({ success: true, data: { courses } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get courses" });
  }
});

// Get all students (for teachers)
router.get("/all-students", async (req, res) => {
  try {
    const students = await require("../models/User").default.find({ 
      role: "student" 
    }).select("name email studentId");
    res.json({ success: true, data: { students } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get students" });
  }
});

export default router;