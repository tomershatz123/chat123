import { Router } from 'express';
import { authenticateToken } from '../middle/authToken.js';
import prisma from '../db.js';

const router = Router();

// POST /api/messages - Send a message
router.post('/', authenticateToken, async (req, res) => {
  const { text, recipientId } = req.body;
  const senderId = req.userId; // Taken from the "flat" middleware property

  if (!text || !recipientId) {
    return res.status(400).json({ message: "Content and recipientId are required" });
  }

  try {
    const newMessage = await prisma.message.create({
      data: {
        text: text,
        // Ensure receiverId is a number if your schema uses Int
        recipientId: Number(recipientId),
        senderId: Number(senderId),
      },
      // Optional: include sender info so the frontend knows who sent it immediately
      include: {
        sender: {
          select: { name: true }
        }
      }
    });

    const io = req.app.get('io');
    const room = recipientId.toString()
    console.log(`Attempting to emit message to room: ${room}`);
    const clients = io.sockets.adapter.rooms.get(room);
    console.log(`Number of clients in room ${room}:`, clients ? clients.size : 0);

    io.to(room).emit('receive_message', newMessage);

    res.status(201).json(newMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to send message" });
  }
});

// GET /api/messages/:userId - Fetch conversation between current user and another user
router.get('/:otherUserId', authenticateToken, async (req, res) => {
  const { otherUserId } = req.params;
  const currentUserId = req.userId; // Your ID from the token

  if (!currentUserId) return res.sendStatus(401);

  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          // Case 1: I sent it to them
          {
            senderId: Number(currentUserId),
            recipientId: Number(otherUserId),
          },
          // Case 2: They sent it to me
          {
            senderId: Number(otherUserId),
            recipientId: Number(currentUserId),
          },
        ],
      },
      orderBy: {
        createdAt: 'asc', // Show oldest messages first at the top
      },
    });

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not fetch conversation" });
  }
});

export default router;