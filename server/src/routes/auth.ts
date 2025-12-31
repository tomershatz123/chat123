import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../db'; // This is the prisma instance we created earlier
import { generateToken } from '../middle/authToken'

const router = Router();

// Registration Route
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // 1. Check if user already exists
    const userExists = await prisma.user.findUnique({
      where: { email }
    });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 2. Hash the password
    // The number 10 is the "salt rounds" - it determines how secure/slow the hash is.
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Save the user to the database
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword, // Store the HASH, not the plain text!
      }
    });

    // 4. Return success (but don't send the password back!)
    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 2. Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user.id, email)

    // 4. Return token (and user info without password)
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      message: "Login successful",
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;