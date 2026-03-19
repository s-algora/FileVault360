import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { loadConfig } from '@filevault360/config';
import { generateId, isValidEmail } from '@filevault360/shared-utils';
import { getUsersContainer } from '../services/cosmos.service';
import { redisClient, cacheSet, cacheDel } from '../services/redis.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { User } from '@filevault360/shared-types';

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'BadRequest', message: 'Email and password are required', statusCode: 400 });
      return;
    }

    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'BadRequest', message: 'Invalid email format', statusCode: 400 });
      return;
    }

    const config = loadConfig();
    let user: User | null = null;

    try {
      const container = getUsersContainer();
      const querySpec = {
        query: 'SELECT * FROM c WHERE c.email = @email',
        parameters: [{ name: '@email', value: email }],
      };
      const { resources } = await container.items.query<User & { passwordHash: string }>(querySpec).fetchAll();

      if (resources.length === 0) {
        const passwordHash = await bcrypt.hash(password, 10);
        const newUser: User & { passwordHash: string } = {
          id: generateId(),
          email,
          displayName: email.split('@')[0],
          passwordHash,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const { resource } = await container.items.create(newUser);
        if (resource) {
          user = { id: resource.id, email: resource.email, displayName: resource.displayName, createdAt: resource.createdAt, updatedAt: resource.updatedAt };
        }
      } else {
        const dbUser = resources[0];
        const isValid = await bcrypt.compare(password, dbUser.passwordHash);
        if (!isValid) {
          res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials', statusCode: 401 });
          return;
        }
        user = { id: dbUser.id, email: dbUser.email, displayName: dbUser.displayName, createdAt: dbUser.createdAt, updatedAt: dbUser.updatedAt };
      }
    } catch (dbErr) {
      console.warn('Cosmos DB not available, using mock user:', dbErr);
      user = {
        id: generateId(),
        email,
        displayName: email.split('@')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    if (!user) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication failed', statusCode: 401 });
      return;
    }

    const VALID_EXPIRES_IN = /^\d+[smhd]$|^\d+$/;
    const expiresIn = VALID_EXPIRES_IN.test(config.jwtExpiresIn) ? config.jwtExpiresIn : '1h';
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      config.jwtSecret,
      { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] }
    );

    await cacheSet(`session:${user.id}`, user, 3600);

    res.json({
      user,
      tokens: {
        accessToken,
        expiresIn: 3600,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'InternalServerError', message: 'Login failed', statusCode: 500 });
  }
}

export async function logout(req: AuthRequest, res: Response): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.substring(7);

    if (token && req.userId) {
      await redisClient.setex(`blacklist:${token}`, 3600, '1');
      await cacheDel(`session:${req.userId}`);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'InternalServerError', message: 'Logout failed', statusCode: 500 });
  }
}
