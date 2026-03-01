import { unauthorized } from '../../lib/errors';
import { assertBoardPermissionDb } from '../../lib/permissions-db';
import { realtimePubSub } from '../../lib/pubsub';
import { getBoardByIdPersisted } from '../../services/board.service';
import { GraphQLContext } from '../context';
import { BoardRole } from '../schema/types/board-role';

async function assertSubscribeAccess(
  ctx: GraphQLContext,
  boardId: string,
): Promise<void> {
  if (!ctx.currentUser) {
    unauthorized('Authentication required');
  }

  await getBoardByIdPersisted(boardId);
  await assertBoardPermissionDb(boardId, ctx.currentUser.id, BoardRole.VIEWER);
}

export const realtimeResolvers = {
  Subscription: {
    taskCreated: {
      subscribe: async (
        _: unknown,
        { boardId }: { boardId: string },
        ctx: GraphQLContext,
      ) => {
        await assertSubscribeAccess(ctx, boardId);
        return realtimePubSub.subscribe('TASK_CREATED', boardId);
      },
      resolve: (payload: unknown) => payload,
    },

    taskUpdated: {
      subscribe: async (
        _: unknown,
        { boardId }: { boardId: string },
        ctx: GraphQLContext,
      ) => {
        await assertSubscribeAccess(ctx, boardId);
        return realtimePubSub.subscribe('TASK_UPDATED', boardId);
      },
      resolve: (payload: unknown) => payload,
    },

    columnMoved: {
      subscribe: async (
        _: unknown,
        { boardId }: { boardId: string },
        ctx: GraphQLContext,
      ) => {
        await assertSubscribeAccess(ctx, boardId);
        return realtimePubSub.subscribe('COLUMN_MOVED', boardId);
      },
      resolve: (payload: unknown) => payload,
    },
  },
};
