'use client';

import React, { useState } from "react";
import ChatWindow from "../chat/ChatWindow";

interface SendMessageButtonProps {
  recipientId: string;
  recipientName?: string;
}

function SendMessageButton({ recipientId, recipientName }: SendMessageButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChat = () => {
    setIsOpen(true);
  };

  const handleCloseChat = () => {
    setIsOpen(false);
  };

  return (
    <>
      <button 
        onClick={handleOpenChat}
        className="btn-secondary flex items-center gap-2 w-full justify-center"
        aria-label="ส่งข้อความ"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>
        ส่งข้อความ
      </button>
      
      {/* หน้าต่างแชทจะเปิดโดยใช้ recipientId เพื่อโหลดประวัติการแชท */}
      {isOpen && (
        <ChatWindow 
          isOpen={isOpen}
          onClose={handleCloseChat}
          recipientId={recipientId}
          recipientName={recipientName}
          initialView="chat" // เปิดหน้าต่างแชทโดยตรงไม่ต้องผ่านหน้า inbox
        />
      )}
    </>
  );
}

export default SendMessageButton;