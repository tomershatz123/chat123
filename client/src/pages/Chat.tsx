import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { socket } from '../socket';
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
  const scrollRef = useRef<HTMLDivElement>(null);
  
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

  return (
    <div className="chat-container">
        <div className="sidebar">
        <div className="sidebar-header">
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Messages</h2>
        </div>
        
        <div className="user-list">
            {users.map((u: User) => (
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

            <div className="input-area">
                <div className="input-container">
                <input 
                    className="chat-input"
                    value={newMessage} 
                    onChange={e => setNewMessage(e.target.value)}
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