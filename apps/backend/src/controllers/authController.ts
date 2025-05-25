import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose'; // Added mongoose import for Types.ObjectId
import User, { IUser } from '../models/User.model';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
  // process.exit(1); // Consider implications
}

// Helper function to generate JWT
const generateToken = (userId: mongoose.Types.ObjectId | string) => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not available to generate a token.');
  }
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const newUser = new User({ email, password });
    await newUser.save();

    const userToReturn = {
      _id: newUser._id,
      email: newUser.email,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    };

    const token = generateToken(newUser._id);
    res.status(201).json({ user: userToReturn, token });

  } catch (error) {
    console.error('Registration error:', error);
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation Error', errors: error.errors });
    }
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    const userToReturn = {
      _id: user._id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    const token = generateToken(user._id);
    res.status(200).json({ user: userToReturn, token });

  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

// Environment variable reminder:
// JWT_SECRET must be set in your .env file (e.g., JWT_SECRET=yourSuperSecretKey).
// JWT_EXPIRES_IN is optional (e.g., JWT_EXPIRES_IN=1h).
