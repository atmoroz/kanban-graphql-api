import { unauthorized, notFound } from '../../lib/errors';
import { assertBoardPermissionDb } from '../../lib/permissions-db';
import {
  getBoardIdForTask,
  listBoardActivities,
  listTaskActivities,
} from '../../services/activity.service';
import { getBoardByIdPersisted } from '../../services/board.service';
import { GraphQLContext } from '../context';
import { BoardRole } from '../schema/types/board-role';
import { prisma } from '../../lib/prisma';

export const activityResolvers = {
  Query: {
    taskActivities: async (
      _: unknown,
      args: {
        taskId: string;
        first?: number;
        after?: string;
        last?: number;
        before?: string;
      },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.currentUser) {
        unauthorized('Authentication required');
      }

      const boardId = await getBoardIdForTask(args.taskId);
      await assertBoardPermissionDb(boardId, ctx.currentUser.id, BoardRole.VIEWER);

      const { taskId, ...paginationArgs } = args;
      return listTaskActivities(taskId, paginationArgs);
    },

    boardActivities: async (
      _: unknown,
      args: {
        boardId: string;
        first?: number;
        after?: string;
        last?: number;
        before?: string;
      },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.currentUser) {
        unauthorized('Authentication required');
      }

      await getBoardByIdPersisted(args.boardId);
      await assertBoardPermissionDb(
        args.boardId,
        ctx.currentUser.id,
        BoardRole.VIEWER,
      );

      const { boardId, ...paginationArgs } = args;
      return listBoardActivities(boardId, paginationArgs);
    },
  },

  Activity: {
    actor: async (parent: { actorId: string }) => {
      const user = await prisma.user.findUnique({
        where: {
          id: parent.actorId,
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
