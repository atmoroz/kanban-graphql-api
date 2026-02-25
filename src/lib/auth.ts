import jwt, { JwtPayload as JwtLibPayload, SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { unauthorized, validationFailed } from './errors';

/* ===== Config ===== */

const JWT_SECRET: string = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }
  return secret;
})();

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '30m';

/* ===== Types ===== */

export type JwtPayload = {
  userId: string;
};

const revokedTokens = new Map<string, number | null>();

/* ===== Passwords ===== */

export async function hashPassword(password: string): Promise<string> {
  if (password.length < 6) {
    validationFailed('Password must be at least 6 characters');
  }
  return bcrypt.hash(password, 10);
}

export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/* ===== JWT ===== */

export function signToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, JWT_SECRET, options);
}

function cleanupRevokedTokens(): void {
  const now = Date.now();

  for (const [token, expiresAt] of revokedTokens.entries()) {
    if (expiresAt !== null && expiresAt <= now) {
      revokedTokens.delete(token);
    }
  }
}

export function revokeToken(token: string): void {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (typeof decoded !== 'object' || decoded === null) {
      unauthorized('Invalid token payload');
    }

    const expiresAt =
      typeof decoded.exp === 'number' ? decoded.exp * 1000 : null;

    revokedTokens.set(token, expiresAt);
  } catch {
    unauthorized('Invalid or expired token');
  }
}

export function verifyToken(token: string): JwtPayload {
  try {
    cleanupRevokedTokens();

    if (revokedTokens.has(token)) {
      unauthorized('Token has been revoked');
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (typeof decoded !== 'object' || decoded === null) {
      unauthorized('Invalid token payload');
    }

    if (!('userId' in decoded)) {
      unauthorized('Invalid token payload');
    }

    return decoded as JwtPayload;
  } catch {
    unauthorized('Invalid or expired token');
  }
}
