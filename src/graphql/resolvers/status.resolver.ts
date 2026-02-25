import { getBoardById } from '../../services/board.service';
import {
  getStatusesByBoardId,
  getStatusById,
} from '../../services/status.service';
import { assertBoardPermission } from '../../lib/permissions';
import { unauthorized } from '../../lib/errors';
import { GraphQLContext } from '../context';
import { BoardRole } from '../schema/types/board-role';

export const statusResolvers = {
  Query: {
    boardStatuses: (
      _: unknown,
      { boardId }: { boardId: string },
      ctx: GraphQLContext,
    ) => {
      const board = getBoardById(boardId);

      if (board.visibility !== 'PUBLIC') {
        if (!ctx.currentUser) unauthorized('Authentication required');
        assertBoardPermission(boardId, ctx.currentUser.id, BoardRole.VIEWER);
      }

      return getStatusesByBoardId(boardId);
    },

    statusById: (
      _: unknown,
      { id }: { id: string },
      ctx: GraphQLContext,
    ) => {
      const status = getStatusById(id);
      const board = getBoardById(status.boardId);

      if (board.visibility !== 'PUBLIC') {
        if (!ctx.currentUser) unauthorized('Authentication required');
        assertBoardPermission(board.id, ctx.currentUser.id, BoardRole.VIEWER);
      }

      return status;
    },
  },
};
