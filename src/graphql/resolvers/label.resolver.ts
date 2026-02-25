import { getBoardById } from '../../services/board.service';
import {
  getLabelsByBoardId,
  getLabelById,
  createLabel,
  updateLabel,
  deleteLabel,
} from '../../services/label.service';
import { assertBoardPermission } from '../../lib/permissions';
import { unauthorized } from '../../lib/errors';
import { GraphQLContext } from '../context';
import { BoardRole } from '../schema/types/board-role';

export const labelResolvers = {
  Query: {
    boardLabels: (
      _: unknown,
      { boardId }: { boardId: string },
      ctx: GraphQLContext,
    ) => {
      const board = getBoardById(boardId);

      if (board.visibility !== 'PUBLIC') {
        if (!ctx.currentUser) unauthorized('Authentication required');
        assertBoardPermission(boardId, ctx.currentUser.id, BoardRole.VIEWER);
      }

      return getLabelsByBoardId(boardId);
    },
  },

  Mutation: {
    createLabel: (
      _: unknown,
      input: { boardId: string; name: string; color?: string },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.currentUser) unauthorized('Authentication required');
      const board = getBoardById(input.boardId);
      assertBoardPermission(board.id, ctx.currentUser.id, BoardRole.ADMIN);

      return createLabel(input);
    },

    updateLabel: (
      _: unknown,
      { id, ...input }: { id: string; name?: string; color?: string },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.currentUser) unauthorized('Authentication required');
      const label = getLabelById(id);
      assertBoardPermission(label.boardId, ctx.currentUser.id, BoardRole.ADMIN);

      return updateLabel(id, input);
    },

    deleteLabel: (
      _: unknown,
      { id }: { id: string },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.currentUser) unauthorized('Authentication required');
      const label = getLabelById(id);
      assertBoardPermission(label.boardId, ctx.currentUser.id, BoardRole.ADMIN);

      return deleteLabel(id);
    },
  },
};
