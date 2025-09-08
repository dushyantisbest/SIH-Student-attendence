import { Request, Response } from "express";
import User from "../models/User";
import { generateTokens } from "../utils/jwt";
import { logger } from "../utils/logger";
import { LoginRequest, RegisterRequest } from "../types";

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      email,
      password,
      name,
      role,
      studentId,
      department,
    }: RegisterRequest = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
      return;
    }

    // Check if studentId is unique (if provided)
    if (studentId) {
      const existingStudent = await User.findOne({ studentId });
      if (existingStudent) {
        res.status(400).json({
          success: false,
          message: "Student ID already exists",
        });
        return;
      }
    }

    // Create new user
    const user = new User({
      email,
      password,
      name,
      role,
      studentId,
      department,
    });

    await user.save();

    // Generate tokens
    const tokens = generateTokens({
      userId: (user._id as any).toString(),
      email: user.email,
      role: user.role,
    });

    logger.info(`New user registered: ${user.email} (${user.role})`);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          studentId: user.studentId,
          department: user.department,
        },
        ...tokens,
      },
    });
  } catch (error) {
    logger.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginRequest = req.body;

    // Find user by email
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: "Account is deactivated",
      });
      return;
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
      return;
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const tokens = generateTokens({
      userId: (user._id as any).toString(),
      email: user.email,
      role: user.role,
    });

    // Store user in session
    (req as any).session.user = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      studentId: user.studentId,
      department: user.department,
    };

    logger.info(`User logged in: ${user.email}`);

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          studentId: user.studentId,
          department: user.department,
        },
        ...tokens,
      },
    });
  } catch (error) {
    logger.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

export const getProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId).populate("courses");

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user: {
          id: (user._id as any).toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          studentId: user.studentId,
          department: user.department,
          courses: user.courses,
          lastLogin: user.lastLogin,
        },
      },
    });
  } catch (error) {
    logger.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get profile",
    });
  }
};
