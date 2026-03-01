import { randomUUID } from 'crypto';

export type UserRecord = {
  id: string;
  email: string;
  name?: string;
  passwordHash: string;
  createdAt: Date;
};

export type SafeUser = Pick<UserRecord, 'id' | 'email' | 'name' | 'createdAt'>;

export function toSafeUser(record: UserRecord): SafeUser {
  const { passwordHash: _, ...safe } = record;
  return safe;
}

export const users: UserRecord[] = [];

// helpers
export function findUserByEmail(email: string): UserRecord | undefined {
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id: string): UserRecord | undefined {
  return users.find(u => u.id === id);
}

export function createUser(data: {
  email: string;
  name?: string;
  passwordHash: string;
}): UserRecord {
  const user: UserRecord = {
    id: randomUUID(),
    email: data.email.toLowerCase(),
    name: data.name,
    passwordHash: data.passwordHash,
    createdAt: new Date(),
  };

  users.push(user);
  return user;
}

export function upsertMockUser(data: {
  id: string;
  email: string;
  name?: string | null;
  createdAt: Date;
  passwordHash?: string;
}): UserRecord {
  const existing = findUserById(data.id);
  if (existing) {
    existing.email = data.email.toLowerCase();
    existing.name = data.name ?? undefined;
    existing.createdAt = data.createdAt;
    if (data.passwordHash) {
      existing.passwordHash = data.passwordHash;
    }
    return existing;
  }

  const user: UserRecord = {
    id: data.id,
    email: data.email.toLowerCase(),
    name: data.name ?? undefined,
    createdAt: data.createdAt,
    passwordHash: data.passwordHash ?? '__external__',
  };

  users.push(user);
  return user;
}
