import mongoose, { Document, Schema } from "mongoose";

export interface ICourse extends Document {
  name: string;
  code: string;
  teacher: mongoose.Types.ObjectId;
  students: mongoose.Types.ObjectId[];
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
CourseSchema.index({ code: 1 });
CourseSchema.index({ teacher: 1 });
CourseSchema.index({ students: 1 });

export default mongoose.model<ICourse>("Course", CourseSchema);

