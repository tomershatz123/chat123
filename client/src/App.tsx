import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Chat from './pages/Chat';
import { socket } from './socket';
import Register from './pages/Register';

function App() {
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    // If we have a token but socket isn't connected, reconnect it!
    if (token && userId && !socket.connected) {
      socket.connect();
      socket.emit("join", userId);
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;