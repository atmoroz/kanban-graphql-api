import { unauthorized } from '../../lib/errors';
import { assertBoardPermissionDb } from '../../lib/permissions-db';
import { getBoardByIdPersisted } from '../../services/board.service';
import {
  listColumnsPersisted,
  createColumnPersisted,
  updateColumnPersisted,
  deleteColumnPersisted,
  moveColumnPersisted,
  getColumnByIdPersisted,
} from '../../services/column.service';
import { logActivity } from '../../services/activity.service';
import { realtimePubSub } from '../../lib/pubsub';
import { GraphQLContext } from '../context';
import { BoardRole } from '../schema/types/board-role';

export const columnResolvers = {
  Query: {
    columns: async (
      _: unknown,
      { boardId }: { boardId: string },
      ctx: GraphQLContext,
    ) => {
      const board = await getBoardByIdPersisted(boardId);

      if (board.visibility !== 'PUBLIC') {
        if (!ctx.currentUser) {
          unauthorized('Authentication required');
        }

        await assertBoardPermissionDb(
          board.id,
          ctx.currentUser.id,
          BoardRole.VIEWER,
        );
      }

      return listColumnsPersisted(boardId);
    },
  },

  Mutation: {
    createColumn: async (
      _: unknown,
      args: {
        boardId: string;
        title: string;
        position?: number;
      },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.currentUser) {
        unauthorized('Authentication required');
      }

      await assertBoardPermissionDb(
        args.boardId,
        ctx.currentUser.id,
        BoardRole.ADMIN,
      );

      const column = await createColumnPersisted(args.boardId, args.title);

      await logActivity({
        actorId: ctx.currentUser.id,
        boardId: column.boardId,
        entityType: 'COLUMN',
        entityId: column.id,
        action: 'CREATE',
      });

      return column;
    },

    updateColumn: async (
      _: unknown,
      args: {
        id: string;
        title?: string;
        position?: number;
      },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.currentUser) {
        unauthorized('Authentication required');
      }

      const column = await getColumnByIdPersisted(args.id);

      await assertBoardPermissionDb(
        column.boardId,
        ctx.currentUser.id,
        BoardRole.ADMIN,
      );

      const updated = await updateColumnPersisted(args.id, args.title ?? '');

      await logActivity({
        actorId: ctx.currentUser.id,
        boardId: updated.boardId,
        entityType: 'COLUMN',
        entityId: updated.id,
        action: 'UPDATE',
      });

      return updated;
    },

    deleteColumn: async (
      _: unknown,
      { id }: { id: string },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.currentUser) {
        unauthorized('Authentication required');
      }

      const column = await getColumnByIdPersisted(id);

      await assertBoardPermissionDb(
        column.boardId,
        ctx.currentUser.id,
        BoardRole.ADMIN,
      );

      await deleteColumnPersisted(id);

      await logActivity({
        actorId: ctx.currentUser.id,
        boardId: column.boardId,
        entityType: 'COLUMN',
        entityId: column.id,
        action: 'DELETE',
      });

      return true;
    },

    moveColumn: async (
      _: unknown,
      args: {
        id: string;
        newPosition: number;
      },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.currentUser) {
        unauthorized('Authentication required');
      }

      const column = await getColumnByIdPersisted(args.id);

      await assertBoardPermissionDb(
        column.boardId,
        ctx.currentUser.id,
        BoardRole.ADMIN,
      );

      const movedColumns = await moveColumnPersisted(args.id, args.newPosition);

      await logActivity({
        actorId: ctx.currentUser.id,
        boardId: column.boardId,
        entityType: 'COLUMN',
        entityId: column.id,
        action: 'MOVE',
        diff: `newPosition:${args.newPosition}`,
      });

      const movedColumn = movedColumns.find(c => c.id === column.id) ?? column;
      realtimePubSub.publish('COLUMN_MOVED', column.boardId, movedColumn);

      return movedColumns;
    },
  },
};
