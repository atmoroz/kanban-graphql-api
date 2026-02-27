import { beforeEach } from 'vitest';
import { resetInMemoryState } from './helpers/reset-mocks';

process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '30m';
process.env.EMAIL_PROVIDER = process.env.EMAIL_PROVIDER ?? 'stub';

beforeEach(() => {
  resetInMemoryState();
});

