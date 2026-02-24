import { registerUser, loginUser } from '../../services/auth.service';
import { GraphQLContext } from '../context';

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
    ) => {
      return registerUser(args);
    },

    login: async (
      _: unknown,
      args: {
        email: string;
        password: string;
      },
    ) => {
      return loginUser(args);
    },
  },
};
