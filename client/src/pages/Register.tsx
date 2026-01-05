import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css'; // Reuse the same CSS for consistency

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. Send registration data to your backend
      await axios.post('http://localhost:5001/api/auth/register', { 
        name, 
        email, 
        password 
      });
      
      alert("Registration successful! Please login.");
      
      // 2. Redirect to login page
      navigate('/login');
    } catch (err: any) {
      alert(err.response?.data?.message || "Registration failed.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Create Account</h2>
        <p>Join the conversation today</p>
        
        <form className="login-form" onSubmit={handleSubmit}>
          <input 
            className="login-input"
            type="text" 
            placeholder="Full Name" 
            required
            onChange={e => setName(e.target.value)} 
          />
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
            Sign Up
          </button>
        </form>

        <div className="register-link">
          Already have an account? <Link to="/login"><span>Sign In</span></Link>
        </div>
      </div>
    </div>
  );
};

export default Register;