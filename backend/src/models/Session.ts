import mongoose, { Document, Schema } from "mongoose";

export interface ISession extends Document {
  course: mongoose.Types.ObjectId;
  teacher: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  duration: number;
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  qrSecret?: string;
  qrExpiresAt?: Date;
  attendance: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    duration: {
      type: Number,
      default: 60,
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    qrSecret: {
      type: String,
    },
    qrExpiresAt: {
      type: Date,
    },
    attendance: [
      {
        type: Schema.Types.ObjectId,
        ref: "AttendanceRecord",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
SessionSchema.index({ course: 1 });
SessionSchema.index({ teacher: 1 });
SessionSchema.index({ isActive: 1 });
SessionSchema.index({ startTime: 1 });

export default mongoose.model<ISession>("Session", SessionSchema);

