import {
  inviteBoardMember,
  updateBoardMemberRole,
  removeBoardMember,
  getBoardMembers,
} from '../../services/board-member.service';
import { GraphQLContext } from '../context';
import { unauthorized, notFound } from '../../lib/errors';
import { findUserById, toSafeUser } from '../../data/mock/users';

export const boardMemberResolvers = {
  Query: {
    boardMembers: (
      _: unknown,
      { boardId }: { boardId: string },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.currentUser) unauthorized('Authentication required');

      return getBoardMembers({
        boardId,
        actorUserId: ctx.currentUser.id,
      });
    },
  },

  Mutation: {
    inviteBoardMember: (
      _: unknown,
      { boardId, userId, role }: any,
      ctx: GraphQLContext,
    ) => {
      if (!ctx.currentUser) unauthorized('Authentication required');

      return inviteBoardMember({
        boardId,
        actorUserId: ctx.currentUser.id,
        userId,
        role,
      });
    },

    updateBoardMemberRole: (
      _: unknown,
      { boardId, userId, role }: any,
      ctx: GraphQLContext,
    ) => {
      if (!ctx.currentUser) unauthorized('Authentication required');

      return updateBoardMemberRole({
        boardId,
        actorUserId: ctx.currentUser.id,
        userId,
        role,
      });
    },

    removeBoardMember: (
      _: unknown,
      { boardId, userId }: any,
      ctx: GraphQLContext,
    ) => {
      if (!ctx.currentUser) unauthorized('Authentication required');

      return removeBoardMember({
        boardId,
        actorUserId: ctx.currentUser.id,
        userId,
      });
    },
  },

  BoardMember: {
    user: (parent: { userId: string }) => {
      const user = findUserById(parent.userId);
      if (!user) notFound('User');
      return toSafeUser(user);
    },
  },
};
