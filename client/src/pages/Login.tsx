import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import './Login.css';

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
    <div className="login-container">
      <div className="login-card">
        <h2>Welcome Back</h2>
        <p>Please enter your details to sign in</p>
        
        <form className="login-form" onSubmit={handleSubmit}>
          <input 
            className="login-input"
            type="email" 
            placeholder="Email Address" 
            required
            onChange={e => setEmail(e.target.value)} 
          />
          <input 
            className="login-input"
            type="password" 
            placeholder="Password" 
            required
            onChange={e => setPassword(e.target.value)} 
          />
          <button className="login-button" type="submit">
            Sign In
          </button>
        </form>

        <div className="register-link">
          Don't have an account? <span>Sign Up</span>
        </div>
      </div>
    </div>
  );
};

export default Login;