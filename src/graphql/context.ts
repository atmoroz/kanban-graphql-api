import { verifyToken } from '../lib/auth';
import { getCurrentUser } from '../services/auth.service';

export type GraphQLContext = {
  request: Request;
  currentUser: ReturnType<typeof getCurrentUser> | null;
};

export function createContext({
  request,
}: {
  request: Request;
}): GraphQLContext {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      request,
      currentUser: null,
    };
  }

  const token = authHeader.replace('Bearer ', '').trim();

  try {
    const payload = verifyToken(token);
    const user = getCurrentUser(payload.userId);

    return {
      request,
      currentUser: user,
    };
  } catch {
    return {
      request,
      currentUser: null,
    };
  }
}
