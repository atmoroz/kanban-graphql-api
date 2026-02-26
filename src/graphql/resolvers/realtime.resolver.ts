import { unauthorized } from '../../lib/errors';
import { assertBoardPermission } from '../../lib/permissions';
import { realtimePubSub } from '../../lib/pubsub';
import { getBoardById } from '../../services/board.service';
import { GraphQLContext } from '../context';
import { BoardRole } from '../schema/types/board-role';

function assertSubscribeAccess(ctx: GraphQLContext, boardId: string): void {
  if (!ctx.currentUser) {
    unauthorized('Authentication required');
  }

  getBoardById(boardId);
  assertBoardPermission(boardId, ctx.currentUser.id, BoardRole.VIEWER);
}

export const realtimeResolvers = {
  Subscription: {
    taskCreated: {
      subscribe: (
        _: unknown,
        { boardId }: { boardId: string },
        ctx: GraphQLContext,
      ) => {
        assertSubscribeAccess(ctx, boardId);
        return realtimePubSub.subscribe('TASK_CREATED', boardId);
      },
      resolve: (payload: unknown) => payload,
    },

    taskUpdated: {
      subscribe: (
        _: unknown,
        { boardId }: { boardId: string },
        ctx: GraphQLContext,
      ) => {
        assertSubscribeAccess(ctx, boardId);
        return realtimePubSub.subscribe('TASK_UPDATED', boardId);
      },
      resolve: (payload: unknown) => payload,
    },

    columnMoved: {
      subscribe: (
        _: unknown,
        { boardId }: { boardId: string },
        ctx: GraphQLContext,
      ) => {
        assertSubscribeAccess(ctx, boardId);
        return realtimePubSub.subscribe('COLUMN_MOVED', boardId);
      },
      resolve: (payload: unknown) => payload,
    },
  },
};

