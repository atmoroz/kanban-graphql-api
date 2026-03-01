import { unauthorized } from '../../lib/errors';
import { assertBoardPermissionDb } from '../../lib/permissions-db';
import { getBoardByIdPersisted, SortOrder } from '../../services/board.service';
import { getColumnByIdPersisted } from '../../services/column.service';
import { TaskSortBy } from '../../services/task-search.service';
import {
  getTaskByIdPersisted,
  listTasksByColumnPersisted,
  createTaskPersisted,
  updateTaskPersisted,
  deleteTaskPersisted,
  moveTaskPersisted,
  updateTaskLabelsPersisted,
  setTaskStatusOverridePersisted,
  clearTaskStatusOverridePersisted,
} from '../../services/task.service';
import { logActivity } from '../../services/activity.service';
import { realtimePubSub } from '../../lib/pubsub';
import { TaskPriority } from '../../types/task';
import { GraphQLContext } from '../context';
import { BoardRole } from '../schema/types/board-role';

export const taskResolvers = {
  Query: {
    task: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      const task = await getTaskByIdPersisted(id);
      const column = await getColumnByIdPersisted(task.columnId);
      const board = await getBoardByIdPersisted(column.boardId);

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

      return task;
    },

    tasksByColumn: async (
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

      const column = await getColumnByIdPersisted(columnId);
      const board = await getBoardByIdPersisted(column.boardId);

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

      return listTasksByColumnPersisted(columnId, paginationArgs);
    },
  },

  Mutation: {
    createTask: async (
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

      const column = await getColumnByIdPersisted(args.columnId);

      await assertBoardPermissionDb(
        column.boardId,
        ctx.currentUser.id,
        BoardRole.MEMBER,
      );

      const created = await createTaskPersisted(args);

      await logActivity({
        actorId: ctx.currentUser.id,
        boardId: column.boardId,
        entityType: 'TASK',
        entityId: created.id,
        action: 'CREATE',
      });

      realtimePubSub.publish('TASK_CREATED', column.boardId, created);

      return created;
    },

    updateTask: async (
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

      const task = await getTaskByIdPersisted(args.id);
      const column = await getColumnByIdPersisted(task.columnId);

      await assertBoardPermissionDb(
        column.boardId,
        ctx.currentUser.id,
        BoardRole.MEMBER,
      );

      const updated = await updateTaskPersisted(args.id, args);

      await logActivity({
        actorId: ctx.currentUser.id,
        boardId: column.boardId,
        entityType: 'TASK',
        entityId: updated.id,
        action: 'UPDATE',
      });

      realtimePubSub.publish('TASK_UPDATED', column.boardId, updated);

      return updated;
    },

    deleteTask: async (
      _: unknown,
      { id }: { id: string },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.currentUser) {
        unauthorized('Authentication required');
      }

      const task = await getTaskByIdPersisted(id);
      const column = await getColumnByIdPersisted(task.columnId);

      await assertBoardPermissionDb(
        column.boardId,
        ctx.currentUser.id,
        BoardRole.MEMBER,
      );

      await deleteTaskPersisted(id);

      await logActivity({
        actorId: ctx.currentUser.id,
        boardId: column.boardId,
        entityType: 'TASK',
        entityId: id,
        action: 'DELETE',
      });

      return true;
    },

    moveTask: async (
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

      const targetColumn = await getColumnByIdPersisted(args.columnId);

      await assertBoardPermissionDb(
        targetColumn.boardId,
        ctx.currentUser.id,
        BoardRole.MEMBER,
      );

      const moved = await moveTaskPersisted(args.id, args.columnId, args.position);

      await logActivity({
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

      realtimePubSub.publish('TASK_UPDATED', targetColumn.boardId, moved);

      return moved;
    },

    updateTaskLabels: async (
      _: unknown,
      { taskId, labelIds }: { taskId: string; labelIds: string[] },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.currentUser) unauthorized('Authentication required');
      const task = await getTaskByIdPersisted(taskId);
      const column = await getColumnByIdPersisted(task.columnId);

      await assertBoardPermissionDb(
        column.boardId,
        ctx.currentUser.id,
        BoardRole.MEMBER,
      );

      const updated = await updateTaskLabelsPersisted(taskId, labelIds);

      await logActivity({
        actorId: ctx.currentUser.id,
        boardId: column.boardId,
        entityType: 'TASK',
        entityId: updated.id,
        action: 'UPDATE',
        diff: 'labels updated',
      });

      realtimePubSub.publish('TASK_UPDATED', column.boardId, updated);

      return updated;
    },

    updateTaskStatus: async (
      _: unknown,
      { taskId, statusId }: { taskId: string; statusId: string },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.currentUser) unauthorized('Authentication required');
      const task = await getTaskByIdPersisted(taskId);

      const column = await getColumnByIdPersisted(task.columnId);

      await assertBoardPermissionDb(
        column.boardId,
        ctx.currentUser.id,
        BoardRole.MEMBER,
      );

      const updated = await setTaskStatusOverridePersisted(taskId, statusId);

      await logActivity({
        actorId: ctx.currentUser.id,
        boardId: column.boardId,
        entityType: 'TASK',
        entityId: updated.id,
        action: 'UPDATE',
        diff: `statusId:${statusId}`,
      });

      realtimePubSub.publish('TASK_UPDATED', column.boardId, updated);

      return updated;
    },

    clearTaskStatusOverride: async (
      _: unknown,
      { taskId }: { taskId: string },
      ctx: GraphQLContext,
    ) => {
      if (!ctx.currentUser) unauthorized('Authentication required');
      const task = await getTaskByIdPersisted(taskId);

      const column = await getColumnByIdPersisted(task.columnId);

      await assertBoardPermissionDb(
        column.boardId,
        ctx.currentUser.id,
        BoardRole.MEMBER,
      );

      const updated = await clearTaskStatusOverridePersisted(taskId);

      await logActivity({
        actorId: ctx.currentUser.id,
        boardId: column.boardId,
        entityType: 'TASK',
        entityId: updated.id,
        action: 'UPDATE',
        diff: 'status override cleared',
      });

      realtimePubSub.publish('TASK_UPDATED', column.boardId, updated);

      return updated;
    },
  },
};
