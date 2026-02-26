import { columns, tasks } from '../../data/mock';
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
  updateTaskLabels,
  setTaskStatusOverride,
  clearTaskStatusOverride,
} from '../../services/task.service';
import { logActivity } from '../../services/activity.service';
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

      const created = createTask(args);

      logActivity({
        actorId: ctx.currentUser.id,
        boardId: column.boardId,
        entityType: 'TASK',
        entityId: created.id,
        action: 'CREATE',
      });

      return created;
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

      const updated = updateTask(args.id, args);

      logActivity({
        actorId: ctx.currentUser.id,
        boardId: column.boardId,
        entityType: 'TASK',
        entityId: updated.id,
        action: 'UPDATE',
      });

      return updated;
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

      logActivity({
        actorId: ctx.currentUser.id,
        boardId: column.boardId,
        entityType: 'TASK',
        entityId: id,
        action: 'DELETE',
      });

      return true;
    },

    moveTask: (
      _: unknown,
      args: {
        id: string;
        columnId: string;
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

      const targetColumn = columns.find(c => c.id === args.columnId);
      if (!targetColumn) {
        notFound('Column');
      }

      assertBoardPermission(
        targetColumn.boardId,
        ctx.currentUser.id,
        BoardRole.MEMBER,
      );

      const moved = moveTask(args.id, args.columnId, args.position);

      logActivity({
        actorId: ctx.currentUser.id,
        boardId: targetColumn.boardId,
        entityType: 'TASK',
        entityId: moved.id,
        action: 'MOVE',
        diff:
          args.position !== undefined
            ? `columnId:${args.columnId};position:${args.position}`
            : `columnId:${args.columnId}`,
      });

      return moved;
    },
    updateTaskLabels: (
      _: unknown,
      { taskId, labelIds }: { taskId: string; labelIds: string[] },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.currentUser) unauthorized('Authentication required');
      const task = getTaskById(taskId);
      const column = columns.find(c => c.id === task.columnId);
      if (!column) {
        notFound('Column');
      }

      assertBoardPermission(
        column.boardId,
        ctx.currentUser.id,
        BoardRole.MEMBER,
      );

      const updated = updateTaskLabels(taskId, labelIds);

      logActivity({
        actorId: ctx.currentUser.id,
        boardId: column.boardId,
        entityType: 'TASK',
        entityId: updated.id,
        action: 'UPDATE',
        diff: 'labels updated',
      });

      return updated;
    },

    updateTaskStatus: (
      _: unknown,
      { taskId, statusId }: { taskId: string; statusId: string },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.currentUser) unauthorized('Authentication required');
      const task = getTaskById(taskId);

      const column = columns.find(c => c.id === task.columnId);
      if (!column) {
        notFound('Column');
      }

      assertBoardPermission(
        column.boardId,
        ctx.currentUser.id,
        BoardRole.MEMBER,
      );

      const updated = setTaskStatusOverride(taskId, statusId);

      logActivity({
        actorId: ctx.currentUser.id,
        boardId: column.boardId,
        entityType: 'TASK',
        entityId: updated.id,
        action: 'UPDATE',
        diff: `statusId:${statusId}`,
      });

      return updated;
    },

    clearTaskStatusOverride: (
      _: unknown,
      { taskId }: { taskId: string },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.currentUser) unauthorized('Authentication required');
      const task = getTaskById(taskId);

      const column = columns.find(c => c.id === task.columnId);
      if (!column) {
        notFound('Column');
      }

      assertBoardPermission(
        column.boardId,
        ctx.currentUser.id,
        BoardRole.MEMBER,
      );

      const updated = clearTaskStatusOverride(taskId);

      logActivity({
        actorId: ctx.currentUser.id,
        boardId: column.boardId,
        entityType: 'TASK',
        entityId: updated.id,
        action: 'UPDATE',
        diff: 'status override cleared',
      });

      return updated;
    },
  },
};
