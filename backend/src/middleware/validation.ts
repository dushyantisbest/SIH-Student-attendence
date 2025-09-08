import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
    return;
  }

  next();
};

export const validateLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  handleValidationErrors,
];

export const validateRegister = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("name")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters long"),
  body("role")
    .isIn(["student", "teacher", "admin"])
    .withMessage("Role must be student, teacher, or admin"),
  body("studentId")
    .if(body("role").equals("student"))
    .notEmpty()
    .trim()
    .isLength({ min: 3 })
    .withMessage("Student ID is required for students and must be at least 3 characters long"),
  handleValidationErrors,
];

export const validateCreateSession = [
  body("course").isMongoId().withMessage("Please provide a valid course ID"),
  body("title")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Title must be at least 3 characters long"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),
  body("duration")
    .optional()
    .isInt({ min: 5, max: 180 })
    .withMessage("Duration must be between 5 and 180 minutes"),
  handleValidationErrors,
];

export const validateMarkAttendance = [
  body("sessionId")
    .isMongoId()
    .withMessage("Please provide a valid session ID"),
  body("qrData").isObject().withMessage("QR data is required"),
  body("qrData.sessionId")
    .isMongoId()
    .withMessage("Invalid QR data session ID"),
  body("qrData.timestamp").isNumeric().withMessage("Invalid QR data timestamp"),
  body("qrData.secret").isString().withMessage("Invalid QR data secret"),
  body("qrData.expiresAt").isNumeric().withMessage("Invalid QR data expiry"),
  handleValidationErrors,
];

