import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { loadConfig } from '@filevault360/config';
import { redisClient } from '../services/redis.service';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized', message: 'No token provided', statusCode: 401 });
      return;
    }

    const token = authHeader.substring(7);
    const config = loadConfig();

    const blacklisted = await redisClient.get(`blacklist:${token}`);
    if (blacklisted) {
      res.status(401).json({ error: 'Unauthorized', message: 'Token has been revoked', statusCode: 401 });
      return;
    }

    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string; email: string };
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid token', statusCode: 401 });
  }
}
