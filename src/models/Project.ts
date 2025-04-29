// src/models/Project.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProject extends Document {
  title: string;
  description: string;
  budget: number;
  deadline: Date;
  requiredSkills: string[];
  owner: mongoose.Types.ObjectId;
  ownerName: string;
  status: 'open' | 'assigned' | 'in_progress' | 'revision' | 'awaiting' | 'completed' | 'cancelled';
  
  // ฟิลด์ที่เพิ่มเติม
  assignedTo?: mongoose.Types.ObjectId;  // ฟรีแลนซ์ที่ได้รับมอบหมายงาน
  
  // ฟิลด์สำหรับการจัดการคำขอร่วมงาน
  freelancersRequested: mongoose.Types.ObjectId[];  // อาเรย์ของฟรีแลนซ์ ID ที่ส่งคำขอร่วมงานให้เจ้าของโปรเจกต์
  requestToFreelancer?: mongoose.Types.ObjectId;  // ฟรีแลนซ์ ID ที่เจ้าของโปรเจกต์ส่งคำขอร่วมงานไป
  
  progress?: number;
  createdAt: Date;
  updatedAt?: Date;
  completedAt?: Date;
}

// Schema for message
const MessageSchema = new Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fromName: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false }
});

const ProjectSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    budget: { type: Number, required: true, min: 100 },
    deadline: { type: Date, required: true },
    requiredSkills: { type: [String], required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ownerName: { type: String, required: true },
    status: { 
      type: String, 
      required: true, 
      enum: ['open', 'assigned', 'in_progress', 'revision', 'awaiting', 'completed', 'cancelled'],
      default: 'open'
    },
    
    // ฟิลด์ที่เพิ่มเติม
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    // ฟิลด์สำหรับการจัดการคำขอร่วมงาน
    freelancersRequested: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      default: []
    },
    requestToFreelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    progress: { type: Number, min: 0, max: 100, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
    completedAt: { type: Date }
  }
);

// Create indexes for better query performance
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ owner: 1 });
ProjectSchema.index({ assignedTo: 1 });
ProjectSchema.index({ requiredSkills: 1 });
ProjectSchema.index({ createdAt: -1 });
ProjectSchema.index({ freelancersRequested: 1 });
ProjectSchema.index({ requestToFreelancer: 1 });

// Fix for TypeScript to handle mongoose models with Next.js hot reloading
const ProjectModel: Model<IProject> = mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);

export default ProjectModel;