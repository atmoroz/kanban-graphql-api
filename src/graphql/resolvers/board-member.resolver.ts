import {
  inviteBoardMember,
  updateBoardMemberRole,
  removeBoardMember,
  getBoardMembers,
  getBoardMembersPublic,
} from '../../services/board-member.service';
import { GraphQLContext } from '../context';
import { unauthorized, notFound } from '../../lib/errors';
import { prisma } from '../../lib/prisma';
import { getBoardByIdPersisted } from '../../services/board.service';

export const boardMemberResolvers = {
  Query: {
    boardMembers: async (
      _: unknown,
      { boardId }: { boardId: string },
      ctx: GraphQLContext,
    ) => {
      const board = await getBoardByIdPersisted(boardId);

      // PUBLIC-дошка: читаємо членів без авторизації.
      if (board.visibility === 'PUBLIC') {
        return await getBoardMembersPublic({ boardId });
      }

      // PRIVATE-дошка: потрібна авторизація.
      if (!ctx.currentUser) unauthorized('Authentication required');

      return await getBoardMembers({
        boardId,
        actorUserId: ctx.currentUser.id,
      });
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
