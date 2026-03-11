import { unauthorized } from '../../lib/errors';
import { paginateArray } from '../../lib/pagination';
import {
  assertBoardPermissionDb,
  getUserBoardRoleDb,
} from '../../lib/permissions-db';
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

type BoardPermissionsGql = {
  moveColumn: boolean;
  moveCard: boolean;
  createColumn: boolean;
  createTask: boolean;
  updateTask: boolean;
  deleteTask: boolean;
  manageLabels: boolean;
  inviteMember: boolean;
  manageBoardMembers: boolean;
};

function permissionsForRole(role: BoardRole | null): BoardPermissionsGql {
  switch (role) {
    case BoardRole.ADMIN:
    case BoardRole.OWNER:
      return {
        moveColumn: true,
        moveCard: true,
        createColumn: true,
        createTask: true,
        updateTask: true,
        deleteTask: true,
        manageLabels: true,
        inviteMember: true,
        manageBoardMembers: true,
      };
    case BoardRole.MEMBER:
      return {
        moveColumn: false,
        moveCard: true,
        createColumn: false,
        createTask: true,
        updateTask: true,
        deleteTask: true,
        manageLabels: false,
        inviteMember: false,
        manageBoardMembers: false,
      };
    case BoardRole.VIEWER:
    default:
      return {
        moveColumn: false,
        moveCard: false,
        createColumn: false,
        createTask: false,
        updateTask: false,
        deleteTask: false,
        manageLabels: false,
        inviteMember: false,
        manageBoardMembers: false,
      };
  }
}

function buildBoardPermissions(args: {
  role: BoardRole | null;
  visibility: 'PUBLIC' | 'PRIVATE';
  isAuthenticated: boolean;
}): BoardPermissionsGql {
  const { role, visibility, isAuthenticated } = args;

  // PUBLIC-дошка: будь-хто може рухати карточки.
  if (visibility === 'PUBLIC') {
    // Гість або залогінений, але не учасник дошки
    if (!isAuthenticated || !role) {
      return {
        moveColumn: false,
        moveCard: true,
        createColumn: false,
        createTask: false,
        updateTask: false,
        deleteTask: false,
        manageLabels: false,
        inviteMember: false,
        manageBoardMembers: false,
      };
    }

    // Учасники дошки: права за роллю + гарантуємо moveCard = true
    const base = permissionsForRole(role);
    return {
      ...base,
      moveCard: true,
    };
  }

  // PRIVATE-дошка
  if (!isAuthenticated) {
    return {
      moveColumn: false,
      moveCard: false,
      createColumn: false,
      createTask: false,
      updateTask: false,
      deleteTask: false,
      manageLabels: false,
      inviteMember: false,
      manageBoardMembers: false,
    };
  }

  return permissionsForRole(role);
}

export const boardResolvers = {
  Query: {
    board: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
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

      await logActivity({
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

      await assertBoardPermissionDb(
        args.id,
        ctx.currentUser.id,
        BoardRole.ADMIN,
      );

      const board = await updateBoardPersisted(args.id, args);

      await logActivity({
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

      await logActivity({
        actorId: ctx.currentUser.id,
        boardId: id,
        entityType: 'BOARD',
        entityId: id,
        action: 'DELETE',
      });

      await deleteBoardPersisted(id);

      return true;
    },
  },

  Board: {
    permissions: async (
      board: { id: string; visibility: 'PUBLIC' | 'PRIVATE' },
      _: unknown,
      ctx: GraphQLContext,
    ): Promise<BoardPermissionsGql> => {
      const isAuthenticated = !!ctx.currentUser;
      let role: BoardRole | null = null;

      if (isAuthenticated) {
        role = await getUserBoardRoleDb(board.id, ctx.currentUser!.id);
      }

      return buildBoardPermissions({
        role,
        visibility: board.visibility,
        isAuthenticated,
      });
    },
  },
};
