import { unauthorized } from '../../lib/errors';
import { paginateArray } from '../../lib/pagination';
import { assertBoardPermission } from '../../lib/permissions';
import {
  getBoardById,
  listBoardsForUser,
  createBoard,
  updateBoard,
  deleteBoard,
  sortBoards,
  BoardSortBy,
} from '../../services/board.service';
import { logActivity } from '../../services/activity.service';
import { GraphQLContext } from '../context';
import { BoardRole } from '../schema/types/board-role';

export const boardResolvers = {
  Query: {
    board: (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      const board = getBoardById(id);

      if (board.visibility !== 'PUBLIC') {
        if (!ctx.currentUser) {
          unauthorized('Authentication required');
        }

        assertBoardPermission(board.id, ctx.currentUser.id, BoardRole.VIEWER);
      }

      return board;
    },

    boards: (
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
      const filtered = listBoardsForUser(ctx.currentUser?.id);

      const sorted = sortBoards(
        filtered,
        args.sortBy as BoardSortBy,
        args.sortOrder,
      );

      return paginateArray(sorted, args);
    },
  },

  Mutation: {
    createBoard: (
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

      const board = createBoard({
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

    updateBoard: (
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

      assertBoardPermission(args.id, ctx.currentUser.id, BoardRole.ADMIN);

      const board = updateBoard(args.id, args);

      logActivity({
        actorId: ctx.currentUser.id,
        boardId: board.id,
        entityType: 'BOARD',
        entityId: board.id,
        action: 'UPDATE',
      });

      return board;
    },

    deleteBoard: (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      if (!ctx.currentUser) {
        unauthorized('Authentication required');
      }

      assertBoardPermission(id, ctx.currentUser.id, BoardRole.OWNER);

      deleteBoard(id);

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
