// src/models/Notification.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId;  // User ID of the recipient
  senderId?: mongoose.Types.ObjectId;    // User ID of the sender (optional)
  type: string;                          // Type of notification (e.g., 'project_request', 'project_accepted')
  title: string;                         // Title of the notification
  message: string;                       // Message content
  projectId?: mongoose.Types.ObjectId;   // Related project ID (if applicable)
  isRead: boolean;                       // Whether the notification has been read
  link?: string;                         // URL to navigate to when clicked
  createdAt: Date;                       // When the notification was created
}

const NotificationSchema: Schema = new Schema(
  {
    recipientId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true  // Add index for better query performance
    },
    senderId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    type: { 
      type: String, 
      required: true,
      enum: [
        'project_request',        // Freelancer requested to join project
        'project_invitation',     // Project owner invited freelancer
        'project_accepted',       // Project was accepted
        'project_rejected',       // Project was rejected
        'project_status_change',  // Project status changed
        'project_progress_update',// Project progress updated
        'project_completed',      // Project was completed
        'project_revision',       // Project needs revision
        'system_message'          // System notification
      ]
    },
    title: { 
      type: String, 
      required: true 
    },
    message: { 
      type: String, 
      required: true 
    },
    projectId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Project' 
    },
    isRead: { 
      type: Boolean, 
      default: false 
    },
    link: { 
      type: String 
    },
    createdAt: { 
      type: Date, 
      default: Date.now,
      index: true  // Add index for sorting by date
    }
  }
);

// Create indexes for better query performance
NotificationSchema.index({ recipientId: 1, isRead: 1 });
NotificationSchema.index({ recipientId: 1, createdAt: -1 });

// Fix for TypeScript to handle mongoose models with Next.js hot reloading
const NotificationModel: Model<INotification> = mongoose.models.Notification || 
  mongoose.model<INotification>('Notification', NotificationSchema);

export default NotificationModel;