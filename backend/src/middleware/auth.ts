import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { JWTPayload } from "../types";
import { logger } from "../utils/logger";

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check JWT token first
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const decoded = verifyToken(token);
        req.user = decoded;
        return next();
      } catch (error) {
        // JWT failed, continue to check session
      }
    }

    // Check session authentication
    const sessionUser = (req.session as any).user;
    if (sessionUser) {
      req.user = {
        userId: sessionUser.id,
        email: sessionUser.email,
        role: sessionUser.role
      };
      return next();
    }

    // No authentication found
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  } catch (error) {
    logger.error("Authentication error:", error);
    res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
      return;
    }

    next();
  };
};

