import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { socket } from '../socket';

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
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <div style={{ width: '200px', borderRight: '1px solid #ccc' }}>
        <h3>Contacts</h3>
        {users.map((u: any) => (
          <div key={u.id} onClick={() => setSelectedUser(u)} style={{ cursor: 'pointer', padding: '10px', background: selectedUser?.id === u.id ? '#eee' : 'none' }}>
            {u.name}
          </div>
        ))}
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, padding: '20px' }}>
        {selectedUser ? (
          <>
            <h3>Chat with {selectedUser.name}</h3>
            <div style={{ height: '300px', overflowY: 'scroll', border: '1px solid #ddd', marginBottom: '10px' }}>
              {messages.map((m: any, i) => (
                <div key={i} style={{ textAlign: m.senderId === Number(myId) ? 'right' : 'left' }}>
                  <p style={{ display: 'inline-block', padding: '5px 10px', borderRadius: '10px', background: m.senderId === Number(myId) ? '#007bff' : '#eee', color: m.senderId === Number(myId) ? 'white' : 'black' }}>
                    {m.text}
                  </p>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
            <input value={newMessage} onChange={e => setNewMessage(e.target.value)} />
            <button onClick={sendMessage}>Send</button>
          </>
        ) : <p>Select a user to start chatting</p>}
      </div>
    </div>
  );
};

export default Chat;