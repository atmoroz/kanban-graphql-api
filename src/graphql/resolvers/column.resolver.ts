import { columns } from '../../data/mock/columns';
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

      return createColumn(args.boardId, args.title);
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

      return updateColumn(args.id, args.title ?? '');
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

      return moveColumn(args.id, args.newPosition);
    },
  },
};
