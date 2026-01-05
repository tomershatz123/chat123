import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { socket } from '../socket';
import { useNavigate } from 'react-router-dom';
import './Chat.css';

interface User {
  id: number;
  name: string;
  email: string;
}

interface Message {
  id?: number;
  text: string;
  senderId: number;
  recipientId: number;
  createdAt?: string;
}

const Chat = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  
  const myId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');

  // Fetch all users on load
  useEffect(() => {
    axios.get('http://localhost:5001/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setUsers(res.data));
  }, []);

  // Listen for incoming real-time messages
  useEffect(() => {
    socket.on("receive_message", (message) => {
      // Only add to screen if the message is from the person we are currently chatting with
      if (message.senderId === selectedUser?.id || message.senderId === Number(myId)) {
        setMessages((prev) => [...prev, message]);
      }
    });

    return () => { socket.off("receive_message"); };
  }, [selectedUser]);

  useEffect(() => {
    if (selectedUser) {
        axios.get(`http://localhost:5001/api/messages/${selectedUser.id}`, {
        headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
            setMessages(res.data);
        })
        .catch(err => console.error("Could not fetch history", err));
    }
    }, [selectedUser]);

  useEffect(() => {
    socket.on("user_typing", ({ senderId }) => {
      if (senderId === selectedUser?.id) {
        setIsOtherUserTyping(true);
      }
    });

    socket.on("user_stop_typing", ({ senderId }) => {
      if (senderId === selectedUser?.id) {
        setIsOtherUserTyping(false);
      }
    });

    return () => {
      socket.off("user_typing");
      socket.off("user_stop_typing");
    };
  }, [selectedUser]); 

  const sendMessage = async () => {
    if (!newMessage || !selectedUser) return;

    const res = await axios.post('http://localhost:5001/api/messages', 
      { text: newMessage, recipientId: selectedUser.id },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Add our own message to the UI immediately
    setMessages((prev) => [...prev, res.data]);
    setNewMessage('');
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    // 1. Tell the server we are typing
    socket.emit("typing", { 
      senderId: Number(myId), 
      receiverId: selectedUser?.id 
    });

    // 2. Clear the previous timer if it exists
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // 3. Start a new timer. If the user doesn't type for 1.5 seconds, send 'stop_typing'
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", { 
        senderId: Number(myId), 
        receiverId: selectedUser?.id 
      });
    }, 1500);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    socket.disconnect();
    navigate('/login');
  };

  return (
    <div className="chat-container">
        <div className="sidebar">
            <div className="sidebar-header">
                <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Messages</h2>
            </div>
            
            <div className="user-list">
                {users.
                  filter((u: User) => u.id !== Number(myId))
                  .sort((a, b) => a.name.localeCompare(b.name)) // Adds alphabetical sorting
                  .map((u: User) => (
                    <div 
                        key={u.id} 
                        onClick={() => setSelectedUser(u)} 
                        className={`user-item ${selectedUser?.id === u.id ? 'active' : ''}`}
                    >
                        <div className="user-name">{u.name}</div>
                        <div className="user-email">{u.email}</div>
                    </div>
                ))}
            </div>
            <div style={{ padding: '20px', borderTop: '1px solid #34495e' }}>
                <button 
                    onClick={handleLogout}
                    className="logout-button">
                    Logout
                </button>
            </div>
        </div>

        <div className="chat-main">
        {selectedUser ? (
            <>
            <div className="chat-header">
                <div className="avatar">{selectedUser.name[0]}</div>
                <h3 style={{ margin: 0 }}>{selectedUser.name}</h3>
            </div>

            <div className="messages-list">
                {messages.map((m, i) => {
                const isMe = m.senderId === Number(myId);
                return (
                    <div key={i} className={`message-wrapper ${isMe ? 'message-me' : 'message-them'}`}>
                    {m.text}
                    </div>
                );
                })}
                <div ref={scrollRef} />
            </div>

            {isOtherUserTyping && (
              <div style={{ padding: '0 20px', fontSize: '0.8rem', color: '#7f8c8d', fontStyle: 'italic' }}>
                {selectedUser?.name} is typing...
              </div>
            )}
            <div className="input-area">
                <div className="input-container">
                <input 
                  className="chat-input"
                  value={newMessage} 
                  onChange={handleInputChange} 
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                />
                <button className="send-button" onClick={sendMessage}>
                    Send
                </button>
                </div>
            </div>
            </>
        ) : (
            <div className="empty-chat">
            <h3>Select a contact to start chatting</h3>
            </div>
        )}
        </div>
    </div>
    );
}

export default Chat;