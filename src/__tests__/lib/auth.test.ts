import { describe, expect, it } from 'vitest';
import { hashPassword, signToken, verifyToken } from '../../lib/auth';

describe('auth utils', () => {
  it('signs and verifies JWT payload', () => {
    const token = signToken({ userId: 'user-1' });
    const payload = verifyToken(token);

    expect(payload.userId).toBe('user-1');
  });

  it('rejects short passwords', async () => {
    await expect(hashPassword('12345')).rejects.toThrow(
      /at least 6 characters/i,
    );
  });
});

