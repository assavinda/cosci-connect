'use client'
import Link from "next/link";
import React, { useState, useRef, useEffect } from "react"

// ข้อมูลตัวอย่างสำหรับการแสดงผล
const sampleMessages = [
  {
    id: 1,
    name: "จอห์น โด",
    lastMessage: "สวัสดีครับ เกี่ยวกับโปรเจกต์เว็บแอพที่คุยกันไว้...",
    timestamp: "12:30",
    avatar: "/placeholder-avatar.png",
    unread: true,
  },
  {
    id: 2,
    name: "มาริสา อิ่มสุข",
    lastMessage: "เรื่องแบบจำลอง 3 มิติเสร็จแล้วค่ะ",
    timestamp: "10:45",
    avatar: "/placeholder-avatar.png",
    unread: false,
  },
  {
    id: 3,
    name: "ดร.สมชาย วิทยา",
    lastMessage: "นัดประชุมพรุ่งนี้เวลา 14.00 น. นะครับ",
    timestamp: "เมื่อวาน",
    avatar: "/placeholder-avatar.png",
    unread: false,
  },
  {
    id: 4,
    name: "วรรณา สมบูรณ์",
    lastMessage: "งานออกแบบโลโก้เสร็จแล้วครับ รบกวนช่วยดูให้ด้วย",
    timestamp: "เมื่อวาน",
    avatar: "/placeholder-avatar.png",
    unread: true,
  },
];

// ข้อมูลตัวอย่างสำหรับการแชทกับ user ที่เลือก
const sampleChatHistory = [
  {
    id: 1,
    sender: "other",
    message: "สวัสดีครับ ผมสนใจโปรเจกต์ของคุณมากครับ",
    timestamp: "12:10",
  },
  {
    id: 2,
    sender: "me",
    message: "สวัสดีครับ ขอบคุณที่สนใจครับ คุณมีประสบการณ์ด้านไหนบ้างครับ?",
    timestamp: "12:15",
  },
  {
    id: 3,
    sender: "other",
    message: "ผมมีประสบการณ์ทำเว็บแอพพลิเคชั่นมา 3 ปีครับ ถนัดด้าน React, Next.js และ Node.js ครับ",
    timestamp: "12:20",
  },
  {
    id: 4,
    sender: "other",
    message: "เคยทำโปรเจกต์ที่คล้ายกันให้กับอาจารย์ท่านอื่นด้วยครับ",
    timestamp: "12:21",
  },
  {
    id: 5,
    sender: "me",
    message: "เยี่ยมเลยครับ งั้นเรานัดคุยรายละเอียดเพิ่มเติมไหมครับ?",
    timestamp: "12:25",
  },
  {
    id: 6,
    sender: "other",
    message: "ได้ครับ ผมว่างวันพรุ่งนี้ช่วงบ่ายครับ",
    timestamp: "12:28",
  },
  {
    id: 7,
    sender: "me",
    message: "โอเคครับ งั้นพรุ่งนี้บ่าย 2 โมงนะครับ",
    timestamp: "12:30",
  },
];

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

function ChatWindow({ isOpen, onClose }: ChatWindowProps) {
  const [view, setView] = useState("inbox"); // "inbox" or "chat"
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState(sampleMessages);
  const [chatHistory, setChatHistory] = useState(sampleChatHistory);
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef(null);
  const chatWindowRef = useRef(null);

  // เมธอดสำหรับส่งข้อความใหม่
  const sendMessage = () => {
    if (newMessage.trim() === "") return;
    
    // สร้างข้อความใหม่
    const newChatMessage = {
      id: chatHistory.length + 1,
      sender: "me",
      message: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    // อัปเดตประวัติการแชท
    setChatHistory([...chatHistory, newChatMessage]);
    
    // ล้างฟอร์ม
    setNewMessage("");
  };

  // เลื่อนไปยังข้อความล่าสุดเมื่อมีข้อความใหม่
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory]);

  // จัดการกับการกดปุ่ม Enter
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // เปิดหน้าต่างแชทเมื่อคลิกที่ InboxButton
  useEffect(() => {
    const inboxButton = document.querySelector('button[class*="bg-white/80"]');
    if (inboxButton) {
      // ไม่ต้องจัดการกับปุ่ม InboxButton ที่นี่
      // เพราะการเปิดปิดถูกควบคุมโดย InboxButton component แล้ว
    }

    // จัดการกับการคลิกนอกหน้าต่างแชทเพื่อปิด
    const handleClickOutside = (event) => {
      if (chatWindowRef.current && !chatWindowRef.current.contains(event.target)) {
        // ตรวจสอบว่าคลิกที่ InboxButton หรือไม่
        const isInboxButton = event.target.closest('button[class*="bg-white/80"]');
        if (!isInboxButton && isOpen) {
          onClose();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // แสดงหน้าแชทกับผู้ใช้ที่เลือก
  const openChat = (chatId) => {
    const selectedChatData = messages.find(msg => msg.id === chatId);
    setSelectedChat(selectedChatData);
    setView("chat");
    
    // อัปเดตสถานะการอ่านข้อความ
    setMessages(messages.map(msg => 
      msg.id === chatId ? { ...msg, unread: false } : msg
    ));
  };

  // กลับไปหน้า inbox
  const backToInbox = () => {
    setView("inbox");
    setSelectedChat(null);
  };

  return (
    <div 
      ref={chatWindowRef}
      className="fixed bottom-20 sm:bottom-10 right-6 sm:right-28 w-full sm:w-80 h-[360px] bg-white/90 backdrop-blur-md rounded-xl shadow-xl flex flex-col overflow-hidden z-50"
      style={{ maxWidth: 'calc(100vw - 48px)' }}
    >
      {/* Header */}
      <div className="bg-primary-blue-500 p-2 text-white flex justify-between items-center">
        <div className="flex items-center gap-2">
          {view === "chat" && (
            <button 
              className="p-1 rounded-full hover:bg-primary-blue-400" 
              onClick={backToInbox}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
          )}
        {view === "inbox" ? 
        (<h3 className="font-medium text-s ml-1">
            ข้อความ
        </h3>) : (
        <Link href={`/user/userid`}>
            <h3 className="font-medium text-s ml-1 cursor-pointer">
                {selectedChat?.name}
            </h3>
        </Link>
        
        )}
        </div>
        <button 
          className="p-1 rounded-full hover:bg-primary-blue-400" 
          onClick={onClose}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {view === "inbox" ? (
          // Inbox View
          <div className="p-0">
            {messages.length > 0 ? (
              messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`p-3 flex items-center gap-3 cursor-pointer border-b border-gray-100 hover:bg-gray-500/5 transition-colors relative ${message.unread ? 'bg-primary-blue-400/10' : ''}`}
                  onClick={() => openChat(message.id)}
                >
                  <div className="size-10 bg-gray-300 rounded-full flex-shrink-0 relative">
                    {/* ใช้รูปโปรไฟล์จริงเมื่อมีข้อมูล */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-blue-400 to-primary-blue-600 opacity-20"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="font-medium truncate">{message.name}</p>
                      <span className="text-xs text-gray-500">{message.timestamp}</span>
                    </div>
                    <div className="flex gap-2">
                        <p className="text-sm text-gray-600 truncate">{message.lastMessage}</p>
                        {message.unread && (
                            <div className="size-fit px-2 bg-red-500 rounded-full">
                                <p className="text-xs text-white font-medium">
                                    {/* จำนวนข้อความที่ยังไม่ได้อ่านของแชทนี้ */}
                                    1
                                </p>
                            </div>
                        )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-gray-500">
                ไม่มีข้อความใหม่
              </div>
            )}
          </div>
        ) : (
          // Chat View
          <div className="p-3 flex flex-col gap-1 h-full">
            {chatHistory.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex place-items-end justify-end ${msg.sender === "me" ? "flex-row" : "flex-row-reverse"}`}
              >
                <p className={`text-xs text-gray-500 mb-2 mx-1`}>
                    {msg.timestamp}
                </p>
                <div className={`max-w-[75%] p-2 rounded-2xl mb-2 ${ 
                  msg.sender === "me" 
                    ? "bg-primary-blue-400 text-white rounded-br-none" 
                    : "bg-gray-200 text-gray-800 rounded-tl-none"
                }`}>
                  <p>{msg.message}</p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Input area (only in chat view) */}
      {view === "chat" && (
        <div className="p-2 bg-gray-300/35">
          <div className="flex items-center gap-2">
            <textarea
              className="flex-1 py-1 px-3 border border-gray-300 bg-white rounded-full resize-none focus:outline-none focus:border-primary-blue-400 transition-colors"
              placeholder="พิมพ์ข้อความ..."
              rows={1}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <button 
              className="p-2 bg-primary-blue-500 text-white rounded-xl hover:bg-primary-blue-400 transition-colors"
              onClick={sendMessage}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatWindow