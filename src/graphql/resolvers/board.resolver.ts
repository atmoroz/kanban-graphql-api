import { unauthorized } from '../../lib/errors';
import { paginateArray } from '../../lib/pagination';
import { assertBoardPermissionDb } from '../../lib/permissions-db';
import {
  getBoardByIdPersisted,
  listBoardsForUserPersisted,
  createBoardPersisted,
  updateBoardPersisted,
  deleteBoardPersisted,
  sortBoards,
  BoardSortBy,
} from '../../services/board.service';
import { logActivity } from '../../services/activity.service';
import { GraphQLContext } from '../context';
import { BoardRole } from '../schema/types/board-role';

export const boardResolvers = {
  Query: {
    board: async (
      _: unknown,
      { id }: { id: string },
      ctx: GraphQLContext,
    ) => {
      const board = await getBoardByIdPersisted(id);

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

      return board;
    },

    boards: async (
      _: unknown,
      args: {
        first?: number;
        after?: string;
        last?: number;
        before?: string;
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
      },
      ctx: GraphQLContext,
    ) => {
      const filtered = await listBoardsForUserPersisted(ctx.currentUser?.id);

      const sorted = sortBoards(
        filtered,
        args.sortBy as BoardSortBy,
        args.sortOrder,
      );

      return paginateArray(sorted, args);
    },
  },

  Mutation: {
    createBoard: async (
      _: unknown,
      args: {
        title: string;
        description?: string;
        visibility: 'PUBLIC' | 'PRIVATE';
      },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.currentUser) {
        unauthorized('Authentication required');
      }

      const board = await createBoardPersisted({
        ...args,
        ownerId: ctx.currentUser.id,
      });

      logActivity({
        actorId: ctx.currentUser.id,
        boardId: board.id,
        entityType: 'BOARD',
        entityId: board.id,
        action: 'CREATE',
      });

      return board;
    },

    updateBoard: async (
      _: unknown,
      args: {
        id: string;
        title?: string;
        description?: string;
        visibility?: 'PUBLIC' | 'PRIVATE';
      },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.currentUser) {
        unauthorized('Authentication required');
      }

      await assertBoardPermissionDb(args.id, ctx.currentUser.id, BoardRole.ADMIN);

      const board = await updateBoardPersisted(args.id, args);

      logActivity({
        actorId: ctx.currentUser.id,
        boardId: board.id,
        entityType: 'BOARD',
        entityId: board.id,
        action: 'UPDATE',
      });

      return board;
    },

    deleteBoard: async (
      _: unknown,
      { id }: { id: string },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.currentUser) {
        unauthorized('Authentication required');
      }

      await assertBoardPermissionDb(id, ctx.currentUser.id, BoardRole.OWNER);

      await deleteBoardPersisted(id);

      logActivity({
        actorId: ctx.currentUser.id,
        boardId: id,
        entityType: 'BOARD',
        entityId: id,
        action: 'DELETE',
      });

      return true;
    },
  },
};
