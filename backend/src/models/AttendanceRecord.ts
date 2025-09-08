import mongoose, { Document, Schema } from "mongoose";

export interface IAttendanceRecord extends Document {
  student: mongoose.Types.ObjectId;
  session: mongoose.Types.ObjectId;
  markedAt: Date;
  status: "present" | "late" | "absent";
  deviceInfo?: string;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceRecordSchema = new Schema<IAttendanceRecord>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    session: {
      type: Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },
    markedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["present", "late", "absent"],
      default: "present",
    },
    deviceInfo: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate attendance
AttendanceRecordSchema.index({ student: 1, session: 1 }, { unique: true });

// Index for efficient queries
AttendanceRecordSchema.index({ session: 1 });
AttendanceRecordSchema.index({ student: 1 });
AttendanceRecordSchema.index({ markedAt: 1 });

export default mongoose.model<IAttendanceRecord>(
  "AttendanceRecord",
  AttendanceRecordSchema
);

