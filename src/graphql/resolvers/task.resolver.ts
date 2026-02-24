import { columns } from '../../data/mock/columns';
import { tasks } from '../../data/mock/tasks';
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
import { TaskPriority } from '../../types/task';
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
        priority?: TaskPriority;
        dueDate?: Date;
        assigneeId?: string;
        position?: number;
      },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.currentUser) {
        unauthorized('Authentication required');
      }

      const column = columns.find(c => c.id === args.columnId);
      if (!column) {
        notFound('Column');
      }

      assertBoardPermission(
        column.boardId,
        ctx.currentUser.id,
        BoardRole.MEMBER,
      );

      return createTask(args);
    },
    updateTask: (
      _: unknown,
      args: {
        id: string;
        title?: string;
        description?: string;
        priority?: TaskPriority;
        dueDate?: Date;
        assigneeId?: string;
        statusId?: string;
      },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.currentUser) {
        unauthorized('Authentication required');
      }

      const task = tasks.find(t => t.id === args.id);
      if (!task) {
        notFound('Task');
      }

      const column = columns.find(c => c.id === task.columnId);
      if (!column) {
        notFound('Column');
      }

      assertBoardPermission(
        column.boardId,
        ctx.currentUser.id,
        BoardRole.MEMBER,
      );

      return updateTask(args.id, args);
    },

    deleteTask: (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      if (!ctx.currentUser) {
        unauthorized('Authentication required');
      }

      const task = tasks.find(t => t.id === id);
      if (!task) {
        notFound('Task');
      }

      const column = columns.find(c => c.id === task.columnId);
      if (!column) {
        notFound('Column');
      }

      assertBoardPermission(
        column.boardId,
        ctx.currentUser.id,
        BoardRole.MEMBER,
      );

      deleteTask(id);
      return true;
    },

    moveTask: (
      _: unknown,
      args: {
        id: string;
        targetColumnId: string;
        position?: number;
      },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.currentUser) {
        unauthorized('Authentication required');
      }

      const task = tasks.find(t => t.id === args.id);
      if (!task) {
        notFound('Task');
      }

      const targetColumn = columns.find(c => c.id === args.targetColumnId);
      if (!targetColumn) {
        notFound('Column');
      }

      assertBoardPermission(
        targetColumn.boardId,
        ctx.currentUser.id,
        BoardRole.MEMBER,
      );

      return moveTask(args.id, args.targetColumnId, args.position);
    },
  },
};
