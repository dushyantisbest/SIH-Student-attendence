import { Request, Response } from "express";
import Session from "../models/Session";
import Course from "../models/Course";
import AttendanceRecord from "../models/AttendanceRecord";
import User from "../models/User";
import {
  generateQRSecret,
  generateQRData,
  generateQRCode,
  verifyQRData,
} from "../utils/qrGenerator";
import { logger } from "../utils/logger";
import { CreateSessionRequest } from "../types";

export const createSession = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      course,
      title,
      description,
      duration = 60,
    }: CreateSessionRequest = req.body;
    const teacherId = req.user?.userId;

    if (!teacherId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    // Verify course exists and teacher has access
    const courseDoc = await Course.findOne({ _id: course, teacher: teacherId });
    if (!courseDoc) {
      res.status(404).json({
        success: false,
        message: "Course not found or access denied",
      });
      return;
    }

    // Generate QR secret
    const qrSecret = generateQRSecret();
    const qrExpiresAt = new Date(Date.now() + duration * 60 * 1000);

    // Create session
    const session = new Session({
      course,
      teacher: teacherId,
      title,
      description,
      duration,
      qrSecret,
      qrExpiresAt,
    });

    await session.save();

    // Generate initial QR code with session duration
    const qrData = {
      sessionId: (session._id as any).toString(),
      secret: qrSecret,
      timestamp: Date.now(),
      expiresAt: qrExpiresAt.getTime()
    };
    const qrCode = await generateQRCode(JSON.stringify(qrData));

    logger.info(`Session created: ${session._id} by teacher ${teacherId}`);

    res.status(201).json({
      success: true,
      message: "Session created successfully",
      data: {
        session: {
          id: (session._id as any).toString(),
          course: session.course,
          title: session.title,
          description: session.description,
          startTime: session.startTime,
          isActive: session.isActive,
          qrCode,
          qrData,
        },
      },
    });
  } catch (error) {
    logger.error("Create session error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create session",
    });
  }
};

export const getSession = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const session = await Session.findById(id)
      .populate("course", "name code")
      .populate("teacher", "name email")
      .populate({
        path: "attendance",
        populate: {
          path: "student",
          select: "name email studentId",
        },
      });

    if (!session) {
      res.status(404).json({
        success: false,
        message: "Session not found",
      });
      return;
    }

    // Check if user has access to this session
    const hasAccess =
      session.teacher.toString() === userId || req.user?.role === "admin";

    if (!hasAccess) {
      res.status(403).json({
        success: false,
        message: "Access denied",
      });
      return;
    }

    res.json({
      success: true,
      data: { session },
    });
  } catch (error) {
    logger.error("Get session error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get session",
    });
  }
};

export const getQRCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const session = await Session.findById(id);
    if (!session) {
      res.status(404).json({
        success: false,
        message: "Session not found",
      });
      return;
    }

    // Check if user has access
    if (session.teacher.toString() !== userId && req.user?.role !== "admin") {
      res.status(403).json({
        success: false,
        message: "Access denied",
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

    // Calculate expiration based on session duration and creation time
    const sessionDurationMs = (session.duration || 60) * 60 * 1000;
    const sessionExpiresAt = new Date(session.createdAt).getTime() + sessionDurationMs;
    
    // Generate new QR code with session-based expiration
    const qrData = {
      sessionId: (session._id as any).toString(),
      secret: session.qrSecret!,
      timestamp: Date.now(),
      expiresAt: sessionExpiresAt
    };
    const qrCode = await generateQRCode(JSON.stringify(qrData));

    res.json({
      success: true,
      data: {
        qrCode,
        qrData,
        expiresAt: qrData.expiresAt,
      },
    });
  } catch (error) {
    logger.error("Get QR code error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate QR code",
    });
  }
};

export const closeSession = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const session = await Session.findById(id);
    if (!session) {
      res.status(404).json({
        success: false,
        message: "Session not found",
      });
      return;
    }

    // Check if user has access
    if (session.teacher.toString() !== userId && req.user?.role !== "admin") {
      res.status(403).json({
        success: false,
        message: "Access denied",
      });
      return;
    }

    // Close session
    session.isActive = false;
    session.endTime = new Date();
    await session.save();

    logger.info(`Session closed: ${session._id} by user ${userId}`);

    res.json({
      success: true,
      message: "Session closed successfully",
      data: {
        session: {
          id: (session._id as any).toString(),
          isActive: session.isActive,
          endTime: session.endTime,
        },
      },
    });
  } catch (error) {
    logger.error("Close session error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to close session",
    });
  }
};

export const getMySessions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { page = 1, limit = 10, status = "all" } = req.query;

    let query: any = {};

    if (req.user?.role === "teacher") {
      query.teacher = userId;
    } else if (req.user?.role === "student") {
      // For students, get sessions from their enrolled courses
      const user = await User.findById(userId).populate("courses");
      const courseIds = user?.courses.map((course) => course._id) || [];
      query.course = { $in: courseIds };
    }

    if (status === "active") {
      query.isActive = true;
    } else if (status === "closed") {
      query.isActive = false;
    }

    const sessions = await Session.find(query)
      .populate("course", "name code")
      .populate("teacher", "name email")
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Session.countDocuments(query);

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total,
        },
      },
    });
  } catch (error) {
    logger.error("Get my sessions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get sessions",
    });
  }
};
