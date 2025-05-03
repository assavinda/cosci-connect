'use client';

import Link from "next/link";
import React, { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import Loading from "../common/Loading";

interface ChatMessage {
  id: string;
  sender: 'me' | 'other';
  content: string;
  timestamp: string;
  isRead: boolean;
}

interface ChatContact {
  userId: string;
  name: string;
  profileImageUrl: string | null;
  lastMessage: string;
  timestamp: string; 
  unreadCount: number;
}

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId?: string;
  recipientName?: string;
  initialView?: 'inbox' | 'chat';
}

function ChatWindow({ 
  isOpen, 
  onClose, 
  recipientId, 
  recipientName,
  initialView = 'inbox' 
}: ChatWindowProps) {
  const { data: session, status } = useSession();
  const [view, setView] = useState<'inbox' | 'chat'>(initialView);
  const [selectedChat, setSelectedChat] = useState<ChatContact | null>(null);
  const [chatList, setChatList] = useState<ChatContact[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  
  // โหลดรายการแชททั้งหมดเมื่อเปิดหน้าต่าง
  useEffect(() => {
    if (isOpen && status === 'authenticated') {
      if (initialView === 'inbox') {
        fetchChatList();
      } else if (initialView === 'chat' && recipientId) {
        // เปิดแชทกับผู้รับที่ระบุโดยตรง
        fetchMessages(recipientId, recipientName);
      }
    }
  }, [isOpen, status, initialView, recipientId, recipientName]);

  // ดึงรายการแชททั้งหมด
  const fetchChatList = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/messages');
      setChatList(response.data.chatList || []);
    } catch (err) {
      console.error('Error fetching chat list:', err);
      setError('ไม่สามารถโหลดรายการแชทได้');
    } finally {
      setLoading(false);
    }
  };

  // ดึงข้อความในแชทกับผู้ใช้ที่กำหนด
  const fetchMessages = async (userId: string, userName?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`/api/messages?userId=${userId}`);
      
      setMessages(response.data.messages || []);
      
      if (response.data.otherUser) {
        setSelectedChat({
          userId: response.data.otherUser.id,
          name: response.data.otherUser.name,
          profileImageUrl: response.data.otherUser.profileImageUrl,
          lastMessage: response.data.messages.length > 0 ? 
            response.data.messages[response.data.messages.length - 1].content : '',
          timestamp: response.data.messages.length > 0 ? 
            response.data.messages[response.data.messages.length - 1].timestamp : new Date().toISOString(),
          unreadCount: 0
        });
      } else if (userId && userName) {
        // ใช้ข้อมูลที่ส่งมาจาก props ในกรณีที่ไม่มีข้อมูลจาก API
        setSelectedChat({
          userId: userId,
          name: userName,
          profileImageUrl: null,
          lastMessage: '',
          timestamp: new Date().toISOString(),
          unreadCount: 0
        });
      }
      
      setView('chat');
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('ไม่สามารถโหลดข้อความแชทได้');
    } finally {
      setLoading(false);
    }
  };

  // ส่งข้อความใหม่
  const sendMessage = async () => {
    if (newMessage.trim() === "" || !selectedChat) return;
    
    try {
      const response = await axios.post('/api/messages', {
        receiverId: selectedChat.userId,
        content: newMessage
      });
      
      if (response.data.success) {
        // เพิ่มข้อความใหม่ลงในรายการข้อความ
        setMessages([...messages, response.data.message]);
        
        // อัปเดตข้อความล่าสุดในรายการแชท
        updateChatListWithNewMessage(selectedChat.userId, newMessage);
        
        // ล้างฟอร์ม
        setNewMessage("");
      }
    } catch (err) {
      console.error('Error sending message:', err);
      alert('ไม่สามารถส่งข้อความได้ กรุณาลองใหม่อีกครั้ง');
    }
  };
  
  // อัปเดตรายการแชทเมื่อมีข้อความใหม่
  const updateChatListWithNewMessage = (userId: string, content: string) => {
    setChatList(prevList => {
      // ค้นหาแชทที่ต้องการอัปเดต
      const existingChatIndex = prevList.findIndex(chat => chat.userId === userId);
      
      if (existingChatIndex >= 0) {
        // สร้างรายการแชทใหม่โดยอัปเดตข้อความล่าสุด
        const updatedList = [...prevList];
        updatedList[existingChatIndex] = {
          ...updatedList[existingChatIndex],
          lastMessage: content,
          timestamp: new Date().toISOString(),
          unreadCount: 0 // เป็นข้อความที่เราส่งเอง จึงไม่มีการแจ้งเตือน
        };
        
        // ย้ายแชทนี้ไปด้านบนสุด
        const chat = updatedList.splice(existingChatIndex, 1)[0];
        return [chat, ...updatedList];
      } else {
        // ถ้าไม่มีแชทนี้ในรายการ ให้สร้างใหม่
        if (selectedChat) {
          const newChat = {
            ...selectedChat,
            lastMessage: content,
            timestamp: new Date().toISOString(),
            unreadCount: 0
          };
          return [newChat, ...prevList];
        }
      }
      
      return prevList;
    });
  };

  // เลื่อนไปยังข้อความล่าสุดเมื่อมีข้อความใหม่
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // จัดการกับการกดปุ่ม Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // จัดการกับการคลิกนอกหน้าต่างแชทเพื่อปิด
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatWindowRef.current && !chatWindowRef.current.contains(event.target as Node)) {
        // ตรวจสอบว่าคลิกที่ปุ่ม "ส่งข้อความ" หรือไม่
        const isSendMessageButton = (event.target as Element).closest('button[aria-label="ส่งข้อความ"]');
        if (!isSendMessageButton && isOpen) {
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
  const openChat = (chat: ChatContact) => {
    setSelectedChat(chat);
    fetchMessages(chat.userId);
    setView("chat");
  };

  // กลับไปหน้า inbox
  const backToInbox = () => {
    setView("inbox");
    setSelectedChat(null);
    fetchChatList(); // รีเฟรชรายการแชท
  };

  // ฟอร์แมตวันที่เวลาให้อ่านง่าย
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // ถ้าเป็นวันนี้ ให้แสดงเวลาเท่านั้น
      if (date >= today) {
        return format(date, 'HH:mm', { locale: th });
      } 
      // ถ้าเป็นเมื่อวาน ให้แสดง "เมื่อวาน"
      else if (date >= yesterday) {
        return 'เมื่อวาน';
      } 
      // นอกจากนั้น ให้แสดงวันที่
      else {
        return format(date, 'dd/MM/yyyy', { locale: th });
      }
    } catch (error) {
      return "ไม่ระบุเวลา";
    }
  };

  // ถ้ายังไม่ได้เข้าสู่ระบบ ให้แสดงข้อความและซ่อนหน้าต่างแชท
  if (status === 'unauthenticated') {
    onClose();
    return null;
  }

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
          {view === "inbox" ? (
            <h3 className="font-medium text-s ml-1">
              ข้อความ
            </h3>
          ) : (
            <Link href={`/user/${selectedChat?.userId ? (selectedChat.userId) : ''}`}>
              <h3 className="font-medium text-s ml-1 cursor-pointer">
                {selectedChat?.name || recipientName || "ข้อความ"}
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
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loading size="medium" color="primary" />
            <p className="mt-2 text-gray-500 text-sm">กำลังโหลดข้อความ...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <p className="text-red-500 text-center">{error}</p>
            <button 
              className="mt-2 text-primary-blue-500 hover:underline"
              onClick={() => view === 'inbox' ? fetchChatList() : fetchMessages(selectedChat?.userId || recipientId || '')}
            >
              ลองใหม่
            </button>
          </div>
        ) : view === "inbox" ? (
          // Inbox View
          <div className="p-0">
            {chatList.length > 0 ? (
              chatList.map((chat) => (
                <div 
                  key={chat.userId} 
                  className={`p-3 flex items-center gap-3 cursor-pointer border-b border-gray-100 hover:bg-gray-500/5 transition-colors relative ${chat.unreadCount > 0 ? 'bg-primary-blue-400/10' : ''}`}
                  onClick={() => openChat(chat)}
                >
                  <div className="size-10 bg-gray-300 rounded-full flex-shrink-0 relative overflow-hidden">
                    {chat.profileImageUrl ? (
                      <img 
                        src={chat.profileImageUrl} 
                        alt={chat.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-blue-400 to-primary-blue-600 flex items-center justify-center text-white font-medium">
                        {chat.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="font-medium truncate">{chat.name}</p>
                      <span className="text-xs text-gray-500">{formatTime(chat.timestamp)}</span>
                    </div>
                    <div className="flex gap-2">
                      <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                      {chat.unreadCount > 0 && (
                        <div className="size-fit px-2 bg-red-500 rounded-full">
                          <p className="text-xs text-white font-medium">
                            {chat.unreadCount}
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
            {messages.length > 0 ? (
              messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex place-items-end ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
                >
                  {msg.sender === "other" && (
                    <p className={`text-xs text-gray-500 mb-2 mx-1`}>
                      {formatTime(msg.timestamp)}
                    </p>
                  )}
                  <div className={`max-w-[75%] p-2 rounded-2xl mb-2 ${ 
                    msg.sender === "me" 
                      ? "bg-primary-blue-400 text-white rounded-br-none" 
                      : "bg-gray-200 text-gray-800 rounded-bl-none"
                  }`}>
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                  {msg.sender === "me" && (
                    <p className={`text-xs text-gray-500 mb-2 mx-1`}>
                      {formatTime(msg.timestamp)}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <p>ยังไม่มีข้อความ เริ่มส่งข้อความกันเถอะ</p>
              </div>
            )}
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
              className="p-2 bg-primary-blue-500 text-white rounded-xl hover:bg-primary-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={sendMessage}
              disabled={!newMessage.trim() || !selectedChat}
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
export default ChatWindow;