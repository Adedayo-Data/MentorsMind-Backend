import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const LAST_ACTIVE_DEBOUNCE_MS = 60 * 1000; // 1 minute

// In-memory debounce map: userId -> last update timestamp
const lastActiveDebounce = new Map<string, number>();

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please provide a valid Bearer token.',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify the JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; role: string };

    req.user = {
      userId: decoded.sub,
      role: decoded.role,
    };

    // Debounced last_active_at update — max once per minute per user
    const userId = decoded.sub;
    const now = Date.now();
    const lastUpdate = lastActiveDebounce.get(userId) ?? 0;

    if (now - lastUpdate >= LAST_ACTIVE_DEBOUNCE_MS) {
      lastActiveDebounce.set(userId, now);

      // Fire-and-forget: update last_active_at for all active sessions of this user
      pool_updateLastActive(userId).catch((err) =>
        logger.error('Failed to update session last_active_at', { userId, error: err.message }),
      );
    }

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: 'Token expired.',
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid token.',
    });
  }
};

/**
 * Update last_active_at for all active sessions belonging to a user.
 * Runs at most once per minute per user (enforced by in-memory debounce above
 * and by the SQL condition in the service).
 */
async function pool_updateLastActive(userId: string): Promise<void> {
  const pool = (await import('../config/database')).default;
  await pool.query(
    `UPDATE user_sessions
     SET last_active_at = NOW()
     WHERE user_id = $1
       AND revoked_at IS NULL
       AND expires_at > NOW()
       AND last_active_at < NOW() - INTERVAL '1 minute'`,
    [userId],
  );
}

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Insufficient permissions.',
      });
    }
    next();
  };
};
