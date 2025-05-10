'use client'
import React, { useEffect, useState } from "react";
import ChatWindow from "../chat/ChatWindow";
import axios from 'axios';
import { useSession } from "next-auth/react";
import { usePusher } from "../../../providers/PusherProvider";

function InboxButton() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // ใช้ Pusher hook
  const { subscribeToChatListUpdates } = usePusher();

  // เช็คจำนวนข้อความที่ยังไม่ได้อ่านเมื่อล็อกอินแล้ว
  useEffect(() => {
    if (status === 'authenticated') {
      fetchUnreadCount();
    } else {
      setUnreadCount(0);
    }
  }, [status]);

  // เช็คจำนวนข้อความที่ยังไม่ได้อ่านเมื่อระยะเวลาผ่านไป (30 วินาที)
  useEffect(() => {
    if (status === 'authenticated') {
      const interval = setInterval(() => {
        if (!isOpen) { // ตรวจสอบเฉพาะเมื่อไม่ได้เปิดหน้าต่างแชท
          fetchUnreadCount();
        }
      }, 30000); // 30 วินาที
      
      return () => clearInterval(interval);
    }
  }, [status, isOpen]);
  
  // เพิ่ม: รับการอัปเดตข้อความใหม่แบบเรียลไทม์
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) return;
    
    // ฟังก์ชันสำหรับรับการอัปเดตรายการแชท
    const handleChatListUpdate = (data: any) => {
      console.log('📋 Chat list updated (InboxButton):', data);
      
      // อัปเดตจำนวนข้อความที่ยังไม่ได้อ่าน
      if (!isOpen) { // อัปเดตเฉพาะเมื่อไม่ได้เปิดหน้าต่างแชท
        fetchUnreadCount();
      }
    };
    
    // ลงทะเบียนรับการอัปเดตรายการแชท
    const unsubscribe = subscribeToChatListUpdates(session.user.id, handleChatListUpdate);
    
    return () => {
      unsubscribe();
    };
  }, [status, session?.user?.id, isOpen, subscribeToChatListUpdates]);

  // ดึงจำนวนข้อความที่ยังไม่ได้อ่าน
  const fetchUnreadCount = async () => {
    if (status !== 'authenticated') return;
    
    setLoading(true);
    try {
      const response = await axios.get('/api/messages');
      
      // นับจำนวนข้อความที่ยังไม่ได้อ่าน
      let count = 0;
      if (response.data.chatList && Array.isArray(response.data.chatList)) {
        response.data.chatList.forEach((chat) => {
          count += chat.unreadCount || 0;
        });
      }
      
      setUnreadCount(count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    } finally {
      setLoading(false);
    }
  };

  // เปิด/ปิดหน้าต่างแชท
  const toggleChatWindow = () => {
    setIsOpen(!isOpen);
    
    // เมื่อเปิดหน้าต่างแชท ตั้งค่าจำนวนข้อความที่ยังไม่ได้อ่านเป็น 0
    if (!isOpen) {
      setUnreadCount(0);
    }
  };

  // ปิดหน้าต่างแชท
  const handleCloseChat = () => {
    setIsOpen(false);
    fetchUnreadCount();
  };

  // หากยังไม่ได้ล็อกอินหรือกำลังโหลด ไม่ต้องแสดงปุ่ม
  if (status === 'unauthenticated' || status === 'loading') {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-0 right-0 m-4 sm:m-10 hover:scale-[1.05] z-40">
        <button 
          className="bg-white/80 backdrop-blur-md text-primary-blue-500 border-2 border-primary-blue-500 shadow-lg hover:text-primary-blue-400 hover:border-primary-blue-400 p-3 w-[56px] font-medium rounded-full relative"
          onClick={toggleChatWindow}
          aria-label="เปิดข้อความ"
        >
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M3,12V19.4C3,19.9522 3.44772,20.4 4,20.4H20C20.5523,20.4 21,19.9522 21,19.4V12" 
            />
            <path 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M3,12L5.394,5.1056C5.5101,4.77825 5.82755,4.6 6.17157,4.6H17.8284C18.1724,4.6 18.4899,4.77825 18.606,5.1056L21,12" 
            />
            <path 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M9,12L10.8,14.4C11.2944,15.0666 12.2056,15.0666 12.7,14.4L14.5,12" 
            />
            <path 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M3,12H8.5C8.77614,12 9,12.2239 9,12.5V12.5C9,12.7761 9.22386,13 9.5,13H14.5C14.7761,13 15,12.7761 15,12.5V12.5C15,12.2239 15.2239,12 15.5,12H21" 
            />
          </svg>
          
          {/* แสดงจำนวนข้อความที่ยังไม่ได้อ่าน (แบบเรียลไทม์) */}
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </div>
          )}
        </button>
      </div>
      
      {/* หน้าต่างแชท */}
      {isOpen && (
        <ChatWindow 
          isOpen={isOpen} 
          onClose={handleCloseChat} 
        />
      )}
    </>
  )
}

export default InboxButton