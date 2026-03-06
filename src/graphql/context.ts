import { parse } from 'cookie';
import { verifyToken } from '../lib/auth';
import { getCurrentUser } from '../services/auth.service';

type CurrentUser = Awaited<ReturnType<typeof getCurrentUser>>;

export type GraphQLContext = {
  request: Request;
  /**
   * Заголовки відповіді, які Yoga відправить клієнту.
   * Використовується для встановлення cookies тощо.
   */
  responseHeaders: Headers;
  currentUser: CurrentUser | null;
  authToken: string | null;
};

export async function createContext({
  request,
  responseHeaders,
}: {
  request: Request;
  responseHeaders: Headers;
}): Promise<GraphQLContext> {
  const cookieHeader = request.headers.get('cookie') ?? '';
  let token: string | null = null;

  if (cookieHeader) {
    const cookies = parse(cookieHeader);
    if (cookies.auth_token) {
      token = cookies.auth_token;
    }
  }

  // Fallback: підтримка старого способу через Authorization header
  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '').trim();
    }
  }

  if (!token) {
    return {
      request,
      responseHeaders,
      currentUser: null,
      authToken: null,
    };
  }

  try {
    const payload = verifyToken(token);
    const user = await getCurrentUser(payload.userId);

    return {
      request,
      responseHeaders,
      currentUser: user,
      authToken: token,
    };
  } catch {
    return {
      request,
      responseHeaders,
      currentUser: null,
      authToken: null,
    };
  }
}
