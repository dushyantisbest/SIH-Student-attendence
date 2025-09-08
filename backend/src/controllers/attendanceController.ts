import { Request, Response } from "express";
import Session from "../models/Session";
import AttendanceRecord from "../models/AttendanceRecord";
import Course from "../models/Course";
import User from "../models/User";
import { verifyQRData } from "../utils/qrGenerator";
import { logger } from "../utils/logger";
import { MarkAttendanceRequest } from "../types";

export const markAttendance = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { sessionId, qrData } = req.body;
    const studentId = req.user?.userId;

    if (!studentId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    // Get session
    const session = await Session.findById(sessionId).populate("course");
    if (!session) {
      res.status(404).json({
        success: false,
        message: "Session not found",
      });
      return;
    }

    // Check if session is active
    if (!session.isActive) {
      res.status(400).json({
        success: false,
        message: "Session is not active",
      });
      return;
    }

    // Verify QR data if provided
    if (qrData) {
      // Check if QR data matches session
      if (qrData.sessionId !== sessionId) {
        res.status(400).json({
          success: false,
          message: "Invalid QR code for this session",
        });
        return;
      }
      
      // Check if QR code has expired
      if (Date.now() > qrData.expiresAt) {
        res.status(400).json({
          success: false,
          message: "QR code has expired",
        });
        return;
      }
    }
    
    // Check if session has expired based on duration
    const sessionDurationMs = (session.duration || 60) * 60 * 1000;
    const sessionExpiresAt = new Date(session.createdAt).getTime() + sessionDurationMs;
    
    if (Date.now() > sessionExpiresAt) {
      res.status(400).json({
        success: false,
        message: "Session has expired",
      });
      return;
    }

    // Check if attendance already marked
    const existingAttendance = await AttendanceRecord.findOne({
      student: studentId,
      session: sessionId,
    });

    if (existingAttendance) {
      res.status(400).json({
        success: false,
        message: "Attendance already marked for this session",
      });
      return;
    }

    // Mark attendance
    const attendance = new AttendanceRecord({
      student: studentId,
      session: sessionId,
      deviceInfo: req.headers["user-agent"],
      ipAddress: req.ip,
    });

    await attendance.save();

    // Add to session attendance array
    session.attendance.push(attendance._id as any);
    await session.save();

    logger.info(
      `Attendance marked: Student ${studentId} for session ${sessionId}`
    );

    res.json({
      success: true,
      message: "Attendance marked successfully",
      data: {
        attendance: {
          id: (attendance._id as any).toString(),
          markedAt: attendance.markedAt,
          status: attendance.status,
        },
      },
    });
  } catch (error) {
    logger.error("Mark attendance error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark attendance",
    });
  }
};

export const getAttendanceHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { page = 1, limit = 10, course } = req.query;

    let query: any = { student: userId };

    if (course) {
      // Get sessions for the specific course
      const sessions = await Session.find({ course }).select("_id");
      const sessionIds = sessions.map((s) => s._id);
      query.session = { $in: sessionIds };
    }

    const attendance = await AttendanceRecord.find(query)
      .populate({
        path: "session",
        populate: {
          path: "course",
          select: "name code",
        },
      })
      .sort({ markedAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await AttendanceRecord.countDocuments(query);

    res.json({
      success: true,
      data: {
        attendance,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total,
        },
      },
    });
  } catch (error) {
    logger.error("Get attendance history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get attendance history",
    });
  }
};

export const getSessionAttendance = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    // Get session
    const session = await Session.findById(id)
      .populate("course", "name code")
      .populate("teacher", "name email");

    if (!session) {
      res.status(404).json({
        success: false,
        message: "Session not found",
      });
      return;
    }

    // Check access
    const hasAccess =
      session.teacher.toString() === userId || req.user?.role === "admin";

    if (!hasAccess) {
      res.status(403).json({
        success: false,
        message: "Access denied",
      });
      return;
    }

    // Get attendance records
    const attendance = await AttendanceRecord.find({ session: id })
      .populate("student", "name email studentId")
      .sort({ markedAt: -1 });

    res.json({
      success: true,
      data: {
        session: {
          id: (session._id as any).toString(),
          title: session.title,
          course: session.course,
          teacher: session.teacher,
          startTime: session.startTime,
          endTime: session.endTime,
          isActive: session.isActive,
        },
        attendance,
        total: attendance.length,
      },
    });
  } catch (error) {
    logger.error("Get session attendance error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get session attendance",
    });
  }
};
