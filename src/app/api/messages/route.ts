// src/app/api/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectToDatabase from '@/libs/mongodb';
import Message from '@/models/Message';
import User from '@/models/User';
import mongoose from 'mongoose';

// GET - ดึงรายการแชทของผู้ใช้
export async function GET(req: NextRequest) {
  try {
    // ตรวจสอบการล็อกอิน
    const session = await getServerSession();
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบเพื่อดูข้อความแชท' },
        { status: 401 }
      );
    }

    // เชื่อมต่อฐานข้อมูล
    await connectToDatabase();
    
    // ค้นหาข้อมูลผู้ใช้
    const user = await User.findOne({ email: session.user.email }).exec();
    
    if (!user) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลผู้ใช้' },
        { status: 404 }
      );
    }
    
    // อ่านพารามิเตอร์จาก URL
    const url = new URL(req.url);
    const otherUserId = url.searchParams.get('userId');
    
    // ถ้ามีการระบุ userId ให้ดึงข้อความระหว่างผู้ใช้สองคน
    if (otherUserId && mongoose.Types.ObjectId.isValid(otherUserId)) {
      // ค้นหาข้อความระหว่างผู้ใช้สองคน (ทั้งที่ส่งและรับ)
      const messages = await Message.find({
        $or: [
          { senderId: user._id, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: user._id }
        ]
      })
      .sort({ createdAt: 1 }) // เรียงตามเวลาจากเก่าไปใหม่
      .lean()
      .exec();
      
      // ทำเครื่องหมายว่าอ่านแล้วสำหรับข้อความที่ยังไม่ได้อ่าน
      await Message.updateMany(
        { senderId: otherUserId, receiverId: user._id, isRead: false },
        { isRead: true }
      );
      
      // ค้นหาข้อมูลผู้ใช้อีกฝ่าย
      const otherUser = await User.findById(otherUserId).select('name profileImageUrl').lean();
      
      return NextResponse.json({
        messages: messages.map(msg => ({
          id: msg._id.toString(),
          content: msg.content,
          sender: msg.senderId.toString() === user._id.toString() ? 'me' : 'other',
          timestamp: msg.createdAt,
          isRead: msg.isRead
        })),
        otherUser: otherUser ? {
          id: otherUser._id.toString(),
          name: otherUser.name,
          profileImageUrl: otherUser.profileImageUrl
        } : null
      });
    } else {
      // ดึงรายการแชททั้งหมดของผู้ใช้ (แสดงเฉพาะล่าสุดจากแต่ละคู่สนทนา)
      // สร้าง pipeline สำหรับ MongoDB Aggregation
      const chatList = await Message.aggregate([
        // ค้นหาข้อความที่เกี่ยวข้องกับผู้ใช้ปัจจุบัน
        {
          $match: {
            $or: [
              { senderId: user._id },
              { receiverId: user._id }
            ]
          }
        },
        // จัดกลุ่มตามคู่สนทนา
        {
          $sort: { createdAt: -1 } // เรียงตามเวลาล่าสุดก่อน
        },
        {
          $group: {
            _id: {
              $cond: {
                if: { $eq: ["$senderId", user._id] },
                then: "$receiverId",
                else: "$senderId"
              }
            },
            lastMessage: { $first: "$$ROOT" },
            unreadCount: {
              $sum: {
                $cond: [
                  { $and: [
                    { $eq: ["$receiverId", user._id] }, 
                    { $eq: ["$isRead", false] }
                  ]},
                  1, 
                  0
                ]
              }
            }
          }
        },
        // เรียงตามข้อความล่าสุด
        {
          $sort: { "lastMessage.createdAt": -1 }
        }
      ]);
      
      // รวบรวม ID ผู้ใช้ทั้งหมดเพื่อดึงข้อมูล
      const userIds = chatList.map(chat => chat._id);
      
      // ดึงข้อมูลผู้ใช้
      const chatUsers = await User.find(
        { _id: { $in: userIds } },
        { _id: 1, name: 1, profileImageUrl: 1 }
      ).lean();
      
      // จับคู่ข้อมูลผู้ใช้กับข้อความ
      const formattedChatList = chatList.map(chat => {
        const chatUser = chatUsers.find(u => u._id.toString() === chat._id.toString());
        
        if (!chatUser) return null;
        
        return {
          userId: chatUser._id.toString(),
          name: chatUser.name,
          profileImageUrl: chatUser.profileImageUrl || null,
          lastMessage: chat.lastMessage.content,
          timestamp: chat.lastMessage.createdAt,
          unreadCount: chat.unreadCount
        };
      }).filter(Boolean);
      
      return NextResponse.json({
        chatList: formattedChatList
      });
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อความแชท' },
      { status: 500 }
    );
  }
}

// POST - ส่งข้อความแชทใหม่
export async function POST(req: NextRequest) {
  try {
    // ตรวจสอบการล็อกอิน
    const session = await getServerSession();
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบเพื่อส่งข้อความแชท' },
        { status: 401 }
      );
    }
    
    // เชื่อมต่อฐานข้อมูล
    await connectToDatabase();
    
    // ค้นหาข้อมูลผู้ใช้
    const user = await User.findOne({ email: session.user.email }).exec();
    
    if (!user) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลผู้ใช้' },
        { status: 404 }
      );
    }
    
    // รับข้อมูลจาก request
    const data = await req.json();
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!data.receiverId || !data.content) {
      return NextResponse.json(
        { error: 'กรุณาระบุผู้รับและเนื้อหาข้อความ' },
        { status: 400 }
      );
    }
    
    // ตรวจสอบรูปแบบ receiverId
    if (!mongoose.Types.ObjectId.isValid(data.receiverId)) {
      return NextResponse.json(
        { error: 'รูปแบบ ID ผู้รับไม่ถูกต้อง' },
        { status: 400 }
      );
    }
    
    // ตรวจสอบว่าผู้รับมีอยู่จริงหรือไม่
    const receiver = await User.findById(data.receiverId).exec();
    
    if (!receiver) {
      return NextResponse.json(
        { error: 'ไม่พบผู้รับ' },
        { status: 404 }
      );
    }
    
    // สร้างข้อความใหม่
    const message = new Message({
      senderId: user._id,
      receiverId: data.receiverId,
      content: data.content.trim(),
      isRead: false,
      createdAt: new Date()
    });
    
    // บันทึกข้อความลงฐานข้อมูล
    await message.save();
    
    return NextResponse.json({
      success: true,
      message: {
        id: message._id.toString(),
        content: message.content,
        sender: 'me',
        timestamp: message.createdAt,
        isRead: message.isRead
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการส่งข้อความแชท' },
      { status: 500 }
    );
  }
}

// PATCH - ทำเครื่องหมายว่าอ่านข้อความแล้ว
export async function PATCH(req: NextRequest) {
  try {
    // ตรวจสอบการล็อกอิน
    const session = await getServerSession();
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบเพื่อจัดการข้อความแชท' },
        { status: 401 }
      );
    }
    
    // เชื่อมต่อฐานข้อมูล
    await connectToDatabase();
    
    // ค้นหาข้อมูลผู้ใช้
    const user = await User.findOne({ email: session.user.email }).exec();
    
    if (!user) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลผู้ใช้' },
        { status: 404 }
      );
    }
    
    // รับข้อมูลจาก request
    const data = await req.json();
    
    // ทำเครื่องหมายว่าอ่านแล้วสำหรับข้อความจากผู้ส่งที่ระบุ
    if (data.senderId && mongoose.Types.ObjectId.isValid(data.senderId)) {
      await Message.updateMany(
        { senderId: data.senderId, receiverId: user._id, isRead: false },
        { isRead: true }
      );
      
      return NextResponse.json({
        success: true,
        message: 'ทำเครื่องหมายว่าอ่านข้อความแล้ว'
      });
    }
    
    // ทำเครื่องหมายว่าอ่านแล้วสำหรับข้อความเฉพาะ
    if (data.messageId && mongoose.Types.ObjectId.isValid(data.messageId)) {
      const message = await Message.findById(data.messageId).exec();
      
      if (!message) {
        return NextResponse.json(
          { error: 'ไม่พบข้อความ' },
          { status: 404 }
        );
      }
      
      // ตรวจสอบว่าผู้ใช้เป็นผู้รับข้อความจริงหรือไม่
      if (message.receiverId.toString() !== user._id.toString()) {
        return NextResponse.json(
          { error: 'ไม่มีสิทธิ์ทำเครื่องหมายว่าอ่านข้อความนี้แล้ว' },
          { status: 403 }
        );
      }
      
      message.isRead = true;
      await message.save();
      
      return NextResponse.json({
        success: true,
        message: 'ทำเครื่องหมายว่าอ่านข้อความแล้ว'
      });
    }
    
    return NextResponse.json(
      { error: 'กรุณาระบุ senderId หรือ messageId' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการทำเครื่องหมายว่าอ่านข้อความแล้ว' },
      { status: 500 }
    );
  }
}