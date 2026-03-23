import { notFound, unauthorized } from '../../lib/errors';
import {
  getPendingInvites,
  getPendingInvitesByEmail,
  getPendingInvitesPublic,
  getPendingInvitesByEmailPublic,
  inviteByEmail,
} from '../../services/pending-invite.service';
import { GraphQLContext } from '../context';
import { BoardRole } from '../schema/types/board-role';
import { prisma } from '../../lib/prisma';
import { getBoardByIdPersisted } from '../../services/board.service';

export const pendingInviteResolvers = {
  Query: {
    pendingInvites: (
      _: unknown,
      { boardId }: { boardId: string },
      ctx: GraphQLContext,
    ) => {
      // Для PUBLIC-дошки дозволяємо читання без авторизації.
      return (async () => {
        const board = await getBoardByIdPersisted(boardId);
        if (board.visibility === 'PUBLIC') {
          return getPendingInvitesPublic({ boardId });
        }

        if (!ctx.currentUser) unauthorized('Authentication required');

        return getPendingInvites({
          boardId,
          actorUserId: ctx.currentUser.id,
        });
      })();
    },

    pendingInvitesByEmail: (
      _: unknown,
      { email }: { email: string },
      ctx: GraphQLContext,
    ) => {
      return (async () => {
        // Без авторизації дозволяємо тільки запрошення, які належать PUBLIC дошкам.
        if (!ctx.currentUser) {
          return getPendingInvitesByEmailPublic({ email });
        }

        return getPendingInvitesByEmail({
          email,
          actorUserId: ctx.currentUser.id,
        });
      })();
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
