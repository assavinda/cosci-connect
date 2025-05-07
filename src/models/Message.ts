// src/models/Message.ts
import mongoose, { Schema, Document, Model } from 'mongoose';
import { encrypt, decrypt } from '../utils/encryptionUtils';

export interface IMessage extends Document {
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  content: string;
  isRead: boolean;
  createdAt: Date;
  
  // เพิ่มวิธีการสำหรับการถอดรหัสเนื้อหาข้อความ
  getDecryptedContent(): string;
}

const MessageSchema: Schema = new Schema(
  {
    senderId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    receiverId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    content: { 
      type: String, 
      required: true 
    },
    isRead: { 
      type: Boolean, 
      default: false 
    },
    createdAt: { 
      type: Date, 
      default: Date.now 
    }
  }
);

// สร้างดัชนีเพื่อประสิทธิภาพในการค้นหา
MessageSchema.index({ senderId: 1, receiverId: 1 });
MessageSchema.index({ receiverId: 1, isRead: 1 });
MessageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });

// เพิ่มวิธีการสำหรับการเข้ารหัสก่อนบันทึก
MessageSchema.pre('save', function(this: IMessage, next) {
  // ตรวจสอบว่าเป็นเอกสารใหม่หรือกำลังอัปเดตฟิลด์ content
  if (this.isModified('content')) {
    // เข้ารหัสเนื้อหาข้อความก่อนบันทึก
    this.content = encrypt(this.content);
  }
  next();
});

// เพิ่มวิธีการสำหรับการถอดรหัสเนื้อหาข้อความ
MessageSchema.methods.getDecryptedContent = function(this: IMessage): string {
  try {
    return decrypt(this.content);
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการถอดรหัสข้อความ:', error);
    return '[ไม่สามารถถอดรหัสข้อความได้]';
  }
};

// แก้ปัญหาการโหลดซ้ำของโมเดลใน Next.js
const MessageModel: Model<IMessage> = 
  mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

export default MessageModel;