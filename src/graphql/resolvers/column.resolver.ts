import { columns } from '../../data/mock';
import { notFound, unauthorized } from '../../lib/errors';
import { assertBoardPermission } from '../../lib/permissions';
import { getBoardById } from '../../services/board.service';
import {
  listColumns,
  createColumn,
  updateColumn,
  deleteColumn,
  moveColumn,
} from '../../services/column.service';
import { logActivity } from '../../services/activity.service';
import { GraphQLContext } from '../context';
import { BoardRole } from '../schema/types/board-role';

export const columnResolvers = {
  Query: {
    columns: (
      _: unknown,
      { boardId }: { boardId: string },
      ctx: GraphQLContext,
    ) => {
      const board = getBoardById(boardId);

      if (board.visibility !== 'PUBLIC') {
        if (!ctx.currentUser) {
          unauthorized('Authentication required');
        }

        assertBoardPermission(board.id, ctx.currentUser.id, BoardRole.VIEWER);
      }

      return listColumns(boardId);
    },
  },

  Mutation: {
    createColumn: (
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

      assertBoardPermission(args.boardId, ctx.currentUser.id, BoardRole.ADMIN);

      const column = createColumn(args.boardId, args.title);

      logActivity({
        actorId: ctx.currentUser.id,
        boardId: column.boardId,
        entityType: 'COLUMN',
        entityId: column.id,
        action: 'CREATE',
      });

      return column;
    },

    updateColumn: (
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

      const column = columns.find(c => c.id === args.id);
      if (!column) {
        notFound('Column');
      }

      assertBoardPermission(
        column.boardId,
        ctx.currentUser.id,
        BoardRole.ADMIN,
      );

      const updated = updateColumn(args.id, args.title ?? '');

      logActivity({
        actorId: ctx.currentUser.id,
        boardId: updated.boardId,
        entityType: 'COLUMN',
        entityId: updated.id,
        action: 'UPDATE',
      });

      return updated;
    },

    deleteColumn: (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      if (!ctx.currentUser) {
        unauthorized('Authentication required');
      }

      const column = columns.find(c => c.id === id);
      if (!column) {
        notFound('Column');
      }

      assertBoardPermission(
        column.boardId,
        ctx.currentUser.id,
        BoardRole.ADMIN,
      );

      deleteColumn(id);

      logActivity({
        actorId: ctx.currentUser.id,
        boardId: column.boardId,
        entityType: 'COLUMN',
        entityId: column.id,
        action: 'DELETE',
      });

      return true;
    },

    moveColumn: (
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

      const column = columns.find(c => c.id === args.id);
      if (!column) {
        notFound('Column');
      }

      assertBoardPermission(
        column.boardId,
        ctx.currentUser.id,
        BoardRole.ADMIN,
      );

      const movedColumns = moveColumn(args.id, args.newPosition);

      logActivity({
        actorId: ctx.currentUser.id,
        boardId: column.boardId,
        entityType: 'COLUMN',
        entityId: column.id,
        action: 'MOVE',
        diff: `newPosition:${args.newPosition}`,
      });

      return movedColumns;
    },
  },
};
