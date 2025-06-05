import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';
import { supabase } from '../config/db.js';

// Mock authentication middleware for development
// In production, this should be replaced with proper JWT validation
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      // For development, if no auth header is provided, mock a user ID
      if (process.env.NODE_ENV === 'development') {
        req.headers['user-id'] = 'development-user-id';
        return next();
      }
      return next(new AppError('Authorization header is required', 401));
    }

    // Check if authorization header has the Bearer format
    if (!authHeader.startsWith('Bearer ')) {
      return next(new AppError('Invalid authorization format. Use Bearer token', 401));
    }

    // Extract the token
    const token = authHeader.split(' ')[1];

    // Verify the token with Supabase
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return next(new AppError('Invalid or expired token', 401));
    }

    // Add user ID to the request headers
    req.headers['user-id'] = data.user.id;

    next();
  } catch (error) {
    next(new AppError('Authentication failed', 401));
  }
};

// Optional: Create a development-only middleware that bypasses authentication
export const devAuthMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  req.headers['user-id'] = 'development-user-id';
  next();
};
