export interface User {
  _id: string;
  email: string;
  name: string;
  role: "student" | "teacher" | "admin";
  studentId?: string;
  department?: string;
  courses?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Course {
  _id: string;
  name: string;
  code: string;
  teacher: string;
  students: string[];
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  _id: string;
  course: string;
  teacher: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  qrSecret?: string;
  attendance: AttendanceRecord[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceRecord {
  _id: string;
  student: string;
  session: string;
  markedAt: Date;
  status: "present" | "late" | "absent";
  deviceInfo?: string;
}

export interface QRData {
  sessionId: string;
  timestamp: number;
  secret: string;
  expiresAt: number;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: "student" | "teacher" | "admin";
  studentId?: string;
  department?: string;
}

export interface CreateSessionRequest {
  course: string;
  title: string;
  description?: string;
  duration?: number; // in minutes
}

export interface MarkAttendanceRequest {
  sessionId: string;
  qrData: QRData;
}

