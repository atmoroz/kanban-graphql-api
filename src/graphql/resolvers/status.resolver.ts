import { getBoardById } from '../../services/board.service';
import {
  getStatusesByBoardId,
  getStatusById,
} from '../../services/status.service';
import { assertBoardPermission } from '../../lib/permissions';
import { BoardRole } from '../schema/types/board-role';

export const statusResolvers = {
  Query: {
    boardStatuses: (
      _: unknown,
      { boardId }: { boardId: string },
      { currentUser }: any,
    ) => {
      const board = getBoardById(boardId);

      if (board.visibility !== 'PUBLIC') {
        assertBoardPermission(boardId, currentUser, BoardRole.VIEWER);
      }

      return getStatusesByBoardId(boardId);
    },

    statusById: (_: unknown, { id }: { id: string }, { currentUser }: any) => {
      const status = getStatusById(id);
      const board = getBoardById(status.boardId);

      if (board.visibility !== 'PUBLIC') {
        assertBoardPermission(board.id, currentUser, BoardRole.VIEWER);
      }

      return status;
    },
  },
};
