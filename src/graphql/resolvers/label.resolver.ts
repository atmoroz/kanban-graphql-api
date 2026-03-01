import { getBoardByIdPersisted } from '../../services/board.service';
import {
  getLabelsByBoardIdPersisted,
  getLabelByIdPersisted,
  createLabelPersisted,
  updateLabelPersisted,
  deleteLabelPersisted,
} from '../../services/label.service';
import { assertBoardPermissionDb } from '../../lib/permissions-db';
import { unauthorized } from '../../lib/errors';
import { GraphQLContext } from '../context';
import { BoardRole } from '../schema/types/board-role';

export const labelResolvers = {
  Query: {
    boardLabels: async (
      _: unknown,
      { boardId }: { boardId: string },
      ctx: GraphQLContext,
    ) => {
      const board = await getBoardByIdPersisted(boardId);

      if (board.visibility !== 'PUBLIC') {
        if (!ctx.currentUser) unauthorized('Authentication required');
        await assertBoardPermissionDb(
          boardId,
          ctx.currentUser.id,
          BoardRole.VIEWER,
        );
      }

      return getLabelsByBoardIdPersisted(boardId);
    },
  },

  Mutation: {
    createLabel: async (
      _: unknown,
      input: { boardId: string; name: string; color?: string },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.currentUser) unauthorized('Authentication required');
      const board = await getBoardByIdPersisted(input.boardId);
      await assertBoardPermissionDb(board.id, ctx.currentUser.id, BoardRole.ADMIN);

      return createLabelPersisted(input);
    },

    updateLabel: async (
      _: unknown,
      { id, ...input }: { id: string; name?: string; color?: string },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.currentUser) unauthorized('Authentication required');
      const label = await getLabelByIdPersisted(id);
      await assertBoardPermissionDb(
        label.boardId,
        ctx.currentUser.id,
        BoardRole.ADMIN,
      );

      return updateLabelPersisted(id, input);
    },

    deleteLabel: async (
      _: unknown,
      { id }: { id: string },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.currentUser) unauthorized('Authentication required');
      const label = await getLabelByIdPersisted(id);
      await assertBoardPermissionDb(
        label.boardId,
        ctx.currentUser.id,
        BoardRole.ADMIN,
      );

      return deleteLabelPersisted(id);
    },
  },
};
