// src/models/User.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'student' | 'alumni' | 'teacher';
  studentId?: string;
  major: string;
  skills: string[];
  profileImageUrl?: string;
  portfolioUrl?: string;
  bio?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { 
      type: String, 
      required: true, 
      enum: ['student', 'alumni', 'teacher'] 
    },
    studentId: { 
      type: String, 
      required: function() { return this.role === 'student'; },
      sparse: true
    },
    major: { type: String, required: true },
    skills: [{ type: String }],
    profileImageUrl: { type: String },
    portfolioUrl: { type: String },
    bio: { type: String },
    emailVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Create a unique index for studentId only for students
UserSchema.index(
  { studentId: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { role: 'student' }
  }
);

// Fix for TypeScript to handle mongoose models with Next.js hot reloading
const UserModel: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default UserModel;