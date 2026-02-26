import { findUserById, toSafeUser } from '../../data/mock';
import { unauthorized, notFound } from '../../lib/errors';
import { assertBoardPermission } from '../../lib/permissions';
import {
  getBoardIdForTask,
  listBoardActivities,
  listTaskActivities,
} from '../../services/activity.service';
import { getBoardById } from '../../services/board.service';
import { GraphQLContext } from '../context';
import { BoardRole } from '../schema/types/board-role';

export const activityResolvers = {
  Query: {
    taskActivities: (
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

      const boardId = getBoardIdForTask(args.taskId);
      assertBoardPermission(boardId, ctx.currentUser.id, BoardRole.VIEWER);

      const { taskId, ...paginationArgs } = args;
      return listTaskActivities(taskId, paginationArgs);
    },

    boardActivities: (
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

      getBoardById(args.boardId);
      assertBoardPermission(args.boardId, ctx.currentUser.id, BoardRole.VIEWER);

      const { boardId, ...paginationArgs } = args;
      return listBoardActivities(boardId, paginationArgs);
    },
  },

  Activity: {
    actor: (parent: { actorId: string }) => {
      const user = findUserById(parent.actorId);
      if (!user) {
        notFound('User');
      }

      return toSafeUser(user);
    },
  },
};
