import { verifyToken } from '../lib/auth';
import { getCurrentUser } from '../services/auth.service';

type CurrentUser = Awaited<ReturnType<typeof getCurrentUser>>;

export type GraphQLContext = {
  request: Request;
  currentUser: CurrentUser | null;
  authToken: string | null;
};

export async function createContext({
  request,
}: {
  request: Request;
}): Promise<GraphQLContext> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      request,
      currentUser: null,
      authToken: null,
    };
  }

  const token = authHeader.replace('Bearer ', '').trim();

  try {
    const payload = verifyToken(token);
    const user = await getCurrentUser(payload.userId);

    return {
      request,
      currentUser: user,
      authToken: token,
    };
  } catch {
    return {
      request,
      currentUser: null,
      authToken: null,
    };
  }
}
