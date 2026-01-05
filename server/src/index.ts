import 'dotenv/config';
import express from 'express';
import authRoutes from './routes/auth';
import cors from 'cors';
import { authenticateToken } from './middle/authToken';
import userRoutes from './routes/user';
import messageRoutes from './routes/message.js';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

app.use(authenticateToken);

app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173", // Your Vite frontend URL
    methods: ["GET", "POST"]
  }
});

app.set('io', io);

// 3. Socket.io Logic
io.on("connection", (socket) => {
  console.log("A user connected!")
  // 1. Listen for a 'join' event when the user logs in
  socket.on("join", (userId: string) => {
    const room = String(userId);
    socket.join(room);
    console.log(`Socket ${socket.id} joined room: ${room}`);
  });

  socket.on("typing", ({ senderId, receiverId }) => {
    // Tell the receiver that this specific sender is typing
    socket.to(String(receiverId)).emit("user_typing", { senderId });
  });

  socket.on("stop_typing", ({ senderId, receiverId }) => {
    // Tell the receiver to hide the "typing" indicator
    socket.to(String(receiverId)).emit("user_stop_typing", { senderId });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const port = process.env.PORT || 5001
httpServer.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

app.listen(port, () => console.log(`Server running on port ${port}`));