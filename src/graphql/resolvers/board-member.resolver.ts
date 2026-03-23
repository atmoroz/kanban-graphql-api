import {
  inviteBoardMember,
  updateBoardMemberRole,
  removeBoardMember,
  getBoardMembersAny,
} from '../../services/board-member.service';
import { GraphQLContext } from '../context';
import { unauthorized, notFound } from '../../lib/errors';
import { prisma } from '../../lib/prisma';

export const boardMemberResolvers = {
  Query: {
    boardMembers: async (
      _: unknown,
      { boardId }: { boardId: string },
      _ctx: GraphQLContext,
    ) => {
      return await getBoardMembersAny({ boardId });
    },
  },

  Mutation: {
    inviteBoardMember: async (
      _: unknown,
      { boardId, userId, role }: any,
      ctx: GraphQLContext,
    ) => {
      if (!ctx.currentUser) unauthorized('Authentication required');

      return await inviteBoardMember({
        boardId,
        actorUserId: ctx.currentUser.id,
        userId,
        role,
      });
    },

    updateBoardMemberRole: async (
      _: unknown,
      { boardId, userId, role }: any,
      ctx: GraphQLContext,
    ) => {
      if (!ctx.currentUser) unauthorized('Authentication required');

      return await updateBoardMemberRole({
        boardId,
        actorUserId: ctx.currentUser.id,
        userId,
        role,
      });
    },

    removeBoardMember: async (
      _: unknown,
      { boardId, userId }: any,
      ctx: GraphQLContext,
    ) => {
      if (!ctx.currentUser) unauthorized('Authentication required');

      return await removeBoardMember({
        boardId,
        actorUserId: ctx.currentUser.id,
        userId,
      });
    },
  },

  BoardMember: {
    user: async (parent: { userId: string }) => {
      const user = await prisma.user.findUnique({
        where: {
          id: parent.userId,
        },
      });
      if (!user) notFound('User');
      return {
        id: user.id,
        email: user.email,
        name: user.name ?? undefined,
        createdAt: user.createdAt,
      };
    },
  },
};
