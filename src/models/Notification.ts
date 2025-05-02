// src/models/Notification.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

// Define notification types
export type NotificationType = 
  | 'project_request'       // คำขอร่วมโปรเจกต์จากฟรีแลนซ์
  | 'project_invitation'    // คำเชิญทำโปรเจกต์จากเจ้าของโปรเจกต์
  | 'project_accepted'      // การยอมรับโปรเจกต์
  | 'project_rejected'      // การปฏิเสธโปรเจกต์
  | 'project_completed'     // โปรเจกต์เสร็จสิ้น
  | 'project_status_change' // การเปลี่ยนสถานะโปรเจกต์
  | 'message';              // ข้อความใหม่

// Notification interface
export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  data?: {
    projectId?: string;
    projectTitle?: string;
    userId?: string;
    userName?: string;
    status?: string;
  };
}

// Notification schema
const NotificationSchema: Schema = new Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true // Create index for better query performance
    },
    type: { 
      type: String, 
      required: true,
      enum: ['project_request', 'project_invitation', 'project_accepted', 
             'project_rejected', 'project_completed', 'project_status_change', 'message']
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    data: {
      projectId: { type: String },
      projectTitle: { type: String },
      userId: { type: String },
      userName: { type: String },
      status: { type: String }
    }
  },
  { 
    timestamps: true, // Adds createdAt and updatedAt fields
    // Set default expiry after 30 days to prevent unlimited growth
    expires: 60 * 60 * 24 * 30
  }
);

// Create compound index for faster queries
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1 });

// Create the model
const NotificationModel: Model<INotification> = 
  mongoose.models.Notification || 
  mongoose.model<INotification>('Notification', NotificationSchema);

export default NotificationModel;