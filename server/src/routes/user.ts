import { Router } from 'express';
import prisma from "../db";
import { authenticateToken } from "../middle/authToken";

const router = Router();

router.get('/me', authenticateToken, async (req, res) => {
  // Your middleware should have attached the userId to req.user
  if (!req.userId) {
    return res.status(401).json({ message: "User ID not found in request" });
  }

  try {
    const user = await prisma.user.findUnique({
      // 2. Convert the string userId to a Number for Prisma
      where: { id: Number(req.userId) }, 
      select: { id: true, name: true, email: true }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/users - Fetch all users for the chat contact list
router.get('/', authenticateToken, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        // We exclude the password for security!
      },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
});

export default router;