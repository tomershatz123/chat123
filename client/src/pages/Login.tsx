import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5001/api/auth/login', { email, password });
      const { token, user } = response.data;

      // 1. Store data
      localStorage.setItem('token', token);
      localStorage.setItem('userId', user.id.toString());

      // 2. Setup Socket
      socket.connect();
      socket.emit("join", user.id);

      // 3. Go to chat
      navigate('/chat');
    } catch (err) {
      alert("Login failed! Check your credentials.");
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} /><br/>
        <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} /><br/>
        <button type="submit">Enter Chat</button>
      </form>
    </div>
  );
};

export default Login;