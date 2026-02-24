import { columns } from '../../data/mock/columns';
import { notFound, unauthorized } from '../../lib/errors';
import { assertBoardPermission } from '../../lib/permissions';
import { getBoardById, SortOrder } from '../../services/board.service';
import { TaskSortBy } from '../../services/task-search.service';
import {
  getTaskById,
  listTasksByColumn,
  createTask,
  updateTask,
  deleteTask,
  moveTask,
} from '../../services/task.service';
import { GraphQLContext } from '../context';
import { BoardRole } from '../schema/types/board-role';

export const taskResolvers = {
  Query: {
    task: (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      const task = getTaskById(id);
      const column = columns.find(c => c.id === task.columnId);
      if (!column) {
        notFound('Column');
      }
      const board = getBoardById(column.boardId);

      if (board.visibility !== 'PUBLIC') {
        if (!ctx.currentUser) {
          unauthorized('Authentication required');
        }

        assertBoardPermission(board.id, ctx.currentUser.id, BoardRole.VIEWER);
      }

      return task;
    },

    tasksByColumn: (
      _: unknown,
      args: {
        columnId: string;
        first?: number;
        after?: string;
        last?: number;
        before?: string;
        sortBy?: TaskSortBy;
        sortOrder?: SortOrder;
      },
      ctx: GraphQLContext,
    ) => {
      const { columnId, ...paginationArgs } = args;

      const column = columns.find(c => c.id === columnId);
      if (!column) {
        notFound('Column');
      }

      const board = getBoardById(column.boardId);

      if (board.visibility !== 'PUBLIC') {
        if (!ctx.currentUser) {
          unauthorized('Authentication required');
        }

        assertBoardPermission(board.id, ctx.currentUser.id, BoardRole.VIEWER);
      }

      return listTasksByColumn(columnId, paginationArgs);
    },
  },

  Mutation: {
    createTask: (
      _: unknown,
      args: {
        columnId: string;
        title: string;
        description?: string;
        priority: 'LOW' | 'MEDIUM' | 'HIGH';
        dueDate?: Date;
        assigneeId?: string | null;
      },
    ) => {
      return createTask(args);
    },
    updateTask: (
      _: unknown,
      args: {
        id: string;
        title?: string;
        description?: string;
        priority?: 'LOW' | 'MEDIUM' | 'HIGH';
        dueDate?: Date;
        assigneeId?: string | null;
      },
    ) => {
      const { id, ...input } = args;
      return updateTask(id, input);
    },

    deleteTask: (_: unknown, args: { id: string }) => {
      return deleteTask(args.id);
    },

    moveTask: (
      _: unknown,
      args: { id: string; columnId: string; position?: number },
    ) => {
      return moveTask(args.id, args.columnId, args.position);
    },
  },
};
