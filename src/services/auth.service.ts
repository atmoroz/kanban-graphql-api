import {
  hashPassword,
  comparePassword,
  signToken,
  revokeToken,
} from '../lib/auth';
import {
  createUser,
  findUserByEmail,
  findUserById,
  toSafeUser,
  upsertMockUser,
  type SafeUser,
} from '../data/mock/users';
import { conflict, unauthorized, notFound } from '../lib/errors';
import { acceptPendingInvitesForUser } from './pending-invite.service';
import { prisma } from '../lib/prisma';

export type AuthResult = {
  user: SafeUser;
  token: string;
};

function toSafeUserFromDb(user: {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
}): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name ?? undefined,
    createdAt: user.createdAt,
  };
}

function isTestRuntime(): boolean {
  return process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
}

/* ===== Register ===== */

export async function registerUser(input: {
  email: string;
  password: string;
  name?: string;
}): Promise<AuthResult> {
  if (isTestRuntime()) {
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

    acceptPendingInvitesForUser({
      userId: user.id,
      email: user.email,
    });

    return { user: toSafeUser(user), token };
  }

  const normalizedEmail = input.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (existing) {
    conflict('User with this email already exists');
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name: input.name ?? null,
      passwordHash,
    },
  });

  // Transition period: keep mock user map in sync for services not migrated to DB yet.
  upsertMockUser({
    id: user.id,
    email: user.email,
    name: input.name,
    passwordHash,
    createdAt: user.createdAt,
  });

  const token = signToken({ userId: user.id });
  acceptPendingInvitesForUser({
    userId: user.id,
    email: user.email,
  });

  return { user: toSafeUserFromDb(user), token };
}

/* ===== Login ===== */

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  if (isTestRuntime()) {
    const user = findUserByEmail(input.email);
    if (!user) {
      unauthorized('Invalid email or password');
    }

    const isValid = await comparePassword(input.password, user.passwordHash);
    if (!isValid) {
      unauthorized('Invalid email or password');
    }

    const token = signToken({ userId: user.id });
    acceptPendingInvitesForUser({
      userId: user.id,
      email: user.email,
    });

    return { user: toSafeUser(user), token };
  }

  const normalizedEmail = input.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (!user) {
    unauthorized('Invalid email or password');
  }

  const isValid = await comparePassword(input.password, user.passwordHash);

  if (!isValid) {
    unauthorized('Invalid email or password');
  }

  // Transition period: keep mock user map in sync for services not migrated to DB yet.
  upsertMockUser({
    id: user.id,
    email: user.email,
    name: user.name,
    passwordHash: user.passwordHash,
    createdAt: user.createdAt,
  });

  const token = signToken({ userId: user.id });
  acceptPendingInvitesForUser({
    userId: user.id,
    email: user.email,
  });

  return { user: toSafeUserFromDb(user), token };
}

/* ===== Me ===== */

export async function getCurrentUser(userId: string): Promise<SafeUser> {
  if (isTestRuntime()) {
    const user = findUserById(userId);
    if (!user) {
      notFound('User');
    }
    return toSafeUser(user);
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    notFound('User');
  }

  upsertMockUser({
    id: user.id,
    email: user.email,
    name: user.name,
    passwordHash: user.passwordHash,
    createdAt: user.createdAt,
  });

  return toSafeUserFromDb(user);
}

/* ===== Logout ===== */

export function logoutUser(token: string): boolean {
  revokeToken(token);
  return true;
}
