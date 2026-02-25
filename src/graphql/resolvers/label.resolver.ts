import { getBoardById } from '../../services/board.service';
import {
  getLabelsByBoardId,
  getLabelById,
  createLabel,
  updateLabel,
  deleteLabel,
} from '../../services/label.service';
import { assertBoardPermission } from '../../lib/permissions';
import { BoardRole } from '../schema/types/board-role';

export const labelResolvers = {
  Query: {
    boardLabels: (
      _: unknown,
      { boardId }: { boardId: string },
      { currentUser }: any,
    ) => {
      const board = getBoardById(boardId);

      if (board.visibility !== 'PUBLIC') {
        assertBoardPermission(boardId, currentUser, BoardRole.VIEWER);
      }

      return getLabelsByBoardId(boardId);
    },
  },

  Mutation: {
    createLabel: (
      _: unknown,
      input: { boardId: string; name: string; color?: string },
      { currentUser }: any,
    ) => {
      const board = getBoardById(input.boardId);
      assertBoardPermission(board.id, currentUser, BoardRole.ADMIN);

      return createLabel(input);
    },

    updateLabel: (
      _: unknown,
      { id, ...input }: { id: string; name?: string; color?: string },
      { currentUser }: any,
    ) => {
      const label = getLabelById(id);
      assertBoardPermission(label.boardId, currentUser, BoardRole.ADMIN);

      return updateLabel(id, input);
    },

    deleteLabel: (_: unknown, { id }: { id: string }, { currentUser }: any) => {
      const label = getLabelById(id);
      assertBoardPermission(label.boardId, currentUser, BoardRole.ADMIN);

      return deleteLabel(id);
    },
  },
};
