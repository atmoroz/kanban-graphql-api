import { notFound, unauthorized } from '../../lib/errors';
import {
  getPendingInvitesAny,
  getPendingInvitesByEmailAny,
  inviteByEmail,
} from '../../services/pending-invite.service';
import { GraphQLContext } from '../context';
import { BoardRole } from '../schema/types/board-role';
import { prisma } from '../../lib/prisma';

export const pendingInviteResolvers = {
  Query: {
    pendingInvites: (
      _: unknown,
      { boardId }: { boardId: string },
      _ctx: GraphQLContext,
    ) => {
      return getPendingInvitesAny({ boardId });
    },

    pendingInvitesByEmail: (
      _: unknown,
      { email }: { email: string },
      _ctx: GraphQLContext,
    ) => {
      return getPendingInvitesByEmailAny({ email });
    },
  },

  Mutation: {
    inviteByEmail: async (
      _: unknown,
      {
        boardId,
        email,
        role,
      }: {
        boardId: string;
        email: string;
        role: BoardRole;
      },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.currentUser) {
        unauthorized('Authentication required');
      }

      return inviteByEmail({
        boardId,
        email,
        role,
        invitedByUserId: ctx.currentUser.id,
      });
    },
  },

  PendingInvite: {
    invitedBy: async (parent: { invitedByUserId: string }) => {
      const user = await prisma.user.findUnique({
        where: {
          id: parent.invitedByUserId,
        },
      });

      if (!user) {
        notFound('User');
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name ?? undefined,
        createdAt: user.createdAt,
      };
    },
  },
};
