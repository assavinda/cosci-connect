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
  isOpen?: boolean; 
  basePrice?: number;  // เพิ่มฟิลด์ราคาเริ่มต้น
  galleryImages?: string[];  // เพิ่มฟิลด์รูปภาพตัวอย่างผลงาน
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
    isOpen: { type: Boolean, default: function() { return this.role === 'student'; } },
    basePrice: { 
      type: Number, 
      default: 500,  // ตั้งค่าเริ่มต้นเป็น 500 บาท
      min: 100,      // ราคาขั้นต่ำ 100 บาท
      required: function() { return this.role === 'student'; }
    },
    galleryImages: [{ type: String }]  // อาร์เรย์ของ URL รูปภาพ
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