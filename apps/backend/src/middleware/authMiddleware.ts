import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User.model'; // Assuming IUser is exported from User.model
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// Extend Express Request type to include 'user'
declare global {
  namespace Express {
    interface Request {
      user?: Omit<IUser, 'password' | 'comparePassword'>; // User object without password and methods
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      if (!JWT_SECRET) {
        console.error('JWT_SECRET is not defined. Cannot verify token.');
        return res.status(500).json({ message: 'Server configuration error: JWT secret missing' });
      }

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;

      if (!decoded.id) {
        return res.status(401).json({ message: 'Not authorized, token payload invalid' });
      }

      // Get user from the token, excluding password
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      req.user = user; // Attach user to request object
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      // Handle specific JWT errors
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Not authorized, token failed verification' });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Not authorized, token expired' });
      }
      // Generic error for other cases
      return res.status(401).json({ message: 'Not authorized, token issue' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};
