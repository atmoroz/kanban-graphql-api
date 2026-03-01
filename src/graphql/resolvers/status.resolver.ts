import { getBoardByIdPersisted } from '../../services/board.service';
import {
  getStatusesByBoardIdPersisted,
  getStatusByIdPersisted,
} from '../../services/status.service';
import { assertBoardPermissionDb } from '../../lib/permissions-db';
import { unauthorized } from '../../lib/errors';
import { GraphQLContext } from '../context';
import { BoardRole } from '../schema/types/board-role';

export const statusResolvers = {
  Query: {
    boardStatuses: async (
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

      return getStatusesByBoardIdPersisted(boardId);
    },

    statusById: async (
      _: unknown,
      { id }: { id: string },
      ctx: GraphQLContext,
    ) => {
      const status = await getStatusByIdPersisted(id);
      const board = await getBoardByIdPersisted(status.boardId);

      if (board.visibility !== 'PUBLIC') {
        if (!ctx.currentUser) unauthorized('Authentication required');
        await assertBoardPermissionDb(
          board.id,
          ctx.currentUser.id,
          BoardRole.VIEWER,
        );
      }

      return status;
    },
  },
};
