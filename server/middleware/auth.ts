import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import path from 'path';

export interface AuthTokenPayload {
  sub: string;
  email: string;
  name: string;
  role: 'super_admin' | 'editor';
}

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const SECRET_PATH = path.join(DATA_DIR, '.jwt-secret');

function getJwtSecret(): string {
  const envSecret = process.env.JWT_SECRET?.trim();
  if (envSecret && envSecret !== 'REPLACE_WITH_LONG_RANDOM_SECRET') {
    return envSecret;
  }
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (fs.existsSync(SECRET_PATH)) {
    return fs.readFileSync(SECRET_PATH, 'utf-8').trim();
  }
  const generated = crypto.randomBytes(48).toString('hex');
  fs.writeFileSync(SECRET_PATH, generated, 'utf-8');
  return generated;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '24h' });
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  const token = header.slice('Bearer '.length).trim();
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as AuthTokenPayload;
    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({ error: 'Session expired or invalid token.' });
  }
}

export function requireRole(allowedRoles: Array<'super_admin' | 'editor'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: requires role ${allowedRoles.join(' or ')}.`,
      });
    }
    return next();
  };
}
