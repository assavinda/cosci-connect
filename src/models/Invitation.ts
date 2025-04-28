// src/models/Invitation.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IInvitation extends Document {
  projectId: mongoose.Types.ObjectId;
  projectTitle: string;
  freelancerId: mongoose.Types.ObjectId;
  freelancerName: string;
  ownerId: mongoose.Types.ObjectId;
  ownerName: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt?: Date;
  respondedAt?: Date;
}

const InvitationSchema: Schema = new Schema(
  {
    projectId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Project', 
      required: true 
    },
    projectTitle: { 
      type: String, 
      required: true 
    },
    freelancerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    freelancerName: { 
      type: String, 
      required: true 
    },
    ownerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    ownerName: { 
      type: String, 
      required: true 
    },
    status: { 
      type: String, 
      enum: ['pending', 'accepted', 'rejected'], 
      default: 'pending',
      required: true 
    },
    createdAt: { 
      type: Date, 
      default: Date.now 
    },
    updatedAt: { 
      type: Date 
    },
    respondedAt: { 
      type: Date 
    }
  },
  { timestamps: true }
);

// Create indexes for better query performance
InvitationSchema.index({ projectId: 1, freelancerId: 1 }, { unique: true });
InvitationSchema.index({ freelancerId: 1 });
InvitationSchema.index({ ownerId: 1 });
InvitationSchema.index({ status: 1 });
InvitationSchema.index({ createdAt: -1 });

// Fix for TypeScript to handle mongoose models with Next.js hot reloading
const InvitationModel: Model<IInvitation> = mongoose.models.Invitation || 
  mongoose.model<IInvitation>('Invitation', InvitationSchema);

export default InvitationModel;