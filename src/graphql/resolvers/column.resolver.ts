import { unauthorized } from '../../lib/errors';
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
    createColumn: (_: unknown, args: { boardId: string; title: string }) => {
      return createColumn(args.boardId, args.title);
    },

    updateColumn: (_: unknown, args: { id: string; title: string }) => {
      return updateColumn(args.id, args.title);
    },

    deleteColumn: (_: unknown, args: { id: string }) => {
      return deleteColumn(args.id);
    },

    moveColumn: (_: unknown, args: { id: string; newPosition: number }) => {
      return moveColumn(args.id, args.newPosition);
    },
  },
};
