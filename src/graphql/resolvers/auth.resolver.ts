import { unauthorized } from '../../lib/errors';
import {
  registerUser,
  loginUser,
  logoutUser,
} from '../../services/auth.service';
import { GraphQLContext } from '../context';
import { serialize } from 'cookie';

function setAuthCookie(headers: Headers, token: string | null): void {
  const cookie = serialize('auth_token', token ?? '', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    // При null/очищенні — видалити cookie негайно.
    maxAge: token ? undefined : 0,
  });

  headers.append('Set-Cookie', cookie);
}

export const authResolvers = {
  Query: {
    me: (_: unknown, __: unknown, ctx: GraphQLContext) => {
      return ctx.currentUser;
    },
  },

  Mutation: {
    register: async (
      _: unknown,
      args: {
        email: string;
        password: string;
        name?: string;
      },
      ctx: GraphQLContext,
    ) => {
      const result = await registerUser(args);
      setAuthCookie(ctx.responseHeaders, result.token);
      return result;
    },

    login: async (
      _: unknown,
      args: {
        email: string;
        password: string;
      },
      ctx: GraphQLContext,
    ) => {
      const result = await loginUser(args);
      setAuthCookie(ctx.responseHeaders, result.token);
      return result;
    },

    logout: (_: unknown, __: unknown, ctx: GraphQLContext) => {
      if (!ctx.currentUser || !ctx.authToken) {
        unauthorized('Authentication required');
      }

      const success = logoutUser(ctx.authToken);
      // Очистити cookie у браузері
      setAuthCookie(ctx.responseHeaders, null);
      return success;
    },
  },
};
