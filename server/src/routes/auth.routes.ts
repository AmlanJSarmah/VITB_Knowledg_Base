import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../lib/db.js";
import { generateToken } from "../lib/jwt.js";
import { registerSchema, loginSchema } from "../schemas/auth.schema.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

export const authRouter = Router();

// POST /api/auth/register
authRouter.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { username, password, name, email, registrationNumber } = parseResult.data;

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      res.status(409).json({ message: "Username is already taken" });
      return;
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });
      if (existingEmail) {
        res.status(409).json({ message: "Email is already registered" });
        return;
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in database
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        email,
        registrationNumber,
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        registrationNumber: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const token = generateToken({
      userId: newUser.id,
      username: newUser.username,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: newUser,
      token,
    });
  } catch (error) {
    console.error("Error in /register:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/auth/login
authRouter.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { username, password } = parseResult.data;

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      res.status(401).json({ message: "Invalid username or password" });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: "Invalid username or password" });
      return;
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      username: user.username,
    });

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        registrationNumber: user.registrationNumber,
      },
      token,
    });
  } catch (error) {
    console.error("Error in /login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/auth/me (Protected route)
authRouter.get(
  "/me",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          registrationNumber: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      res.status(200).json({ user });
    } catch (error) {
      console.error("Error in /me:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);
