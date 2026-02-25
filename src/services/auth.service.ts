import {
  hashPassword,
  comparePassword,
  signToken,
  revokeToken,
} from '../lib/auth';
import {
  findUserByEmail,
  findUserById,
  createUser,
  toSafeUser,
  type UserRecord,
  type SafeUser,
} from '../data/mock';
import { conflict, unauthorized, notFound } from '../lib/errors';

export type AuthResult = {
  user: SafeUser;
  token: string;
};

/* ===== Register ===== */

export async function registerUser(input: {
  email: string;
  password: string;
  name?: string;
}): Promise<AuthResult> {
  const existing = findUserByEmail(input.email);
  if (existing) {
    conflict('User with this email already exists');
  }

  const passwordHash = await hashPassword(input.password);

  const user = createUser({
    email: input.email,
    name: input.name,
    passwordHash,
  });

  const token = signToken({ userId: user.id });

  return { user: toSafeUser(user), token };
}

/* ===== Login ===== */

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const user = findUserByEmail(input.email);
  if (!user) {
    unauthorized('Invalid email or password');
  }

  const isValid = await comparePassword(input.password, user.passwordHash);

  if (!isValid) {
    unauthorized('Invalid email or password');
  }

  const token = signToken({ userId: user.id });

  return { user: toSafeUser(user), token };
}

/* ===== Me ===== */

export function getCurrentUser(userId: string): SafeUser {
  const user = findUserById(userId);
  if (!user) {
    notFound('User');
  }
  return toSafeUser(user);
}

/* ===== Logout ===== */

export function logoutUser(token: string): boolean {
  revokeToken(token);
  return true;
}
