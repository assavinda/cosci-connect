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
  status: 'open' | 'in_progress' | 'awaiting' | 'revision' | 'completed';
  
  // ฟิลด์ที่เพิ่มเติม
  assignedTo?: mongoose.Types.ObjectId;  // ฟรีแลนซ์ที่ได้รับมอบหมายงาน
  assignedFreelancerName?: string;  // ชื่อของฟรีแลนซ์ที่ได้รับมอบหมายงาน (เพิ่มใหม่)
  
  // ฟิลด์สำหรับการจัดการคำขอร่วมงาน
  freelancersRequested: mongoose.Types.ObjectId[];  // อาเรย์ของฟรีแลนซ์ ID ที่ส่งคำขอร่วมงานให้เจ้าของโปรเจกต์
  freelancersRequestedNames?: Map<string, string>;  // Map ของ ID ฟรีแลนซ์และชื่อ (เพิ่มใหม่)
  requestToFreelancer?: mongoose.Types.ObjectId;  // ฟรีแลนซ์ ID ที่เจ้าของโปรเจกต์ส่งคำขอร่วมงานไป
  requestToFreelancerName?: string;  // ชื่อของฟรีแลนซ์ที่ส่งคำขอไป (เพิ่มใหม่)
  
  progress?: number;
  createdAt: Date;
  updatedAt?: Date;
  completedAt?: Date;
}

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
      enum: ['open', 'in_progress', 'awaiting', 'revision', 'completed'],
      default: 'open'
    },
    
    // ฟิลด์ที่เพิ่มเติม
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedFreelancerName: { type: String }, // เพิ่มใหม่
    
    // ฟิลด์สำหรับการจัดการคำขอร่วมงาน
    freelancersRequested: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      default: []
    },
    freelancersRequestedNames: {
      type: Map,
      of: String,
      default: new Map()
    }, // เพิ่มใหม่
    requestToFreelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    requestToFreelancerName: { type: String }, // เพิ่มใหม่
    
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