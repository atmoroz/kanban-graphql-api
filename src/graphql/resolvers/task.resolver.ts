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
        labelIds?: string[];
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

      const { labelIds, ...createInput } = args;

      const created = await createTaskPersisted(createInput);

      const taskWithLabels =
        labelIds && labelIds.length > 0
          ? await updateTaskLabelsPersisted(created.id, labelIds)
          : created;

      await logActivity({
        actorId: ctx.currentUser.id,
        boardId: column.boardId,
        entityType: 'TASK',
        entityId: taskWithLabels.id,
        action: 'CREATE',
      });

      realtimePubSub.publish('TASK_CREATED', column.boardId, taskWithLabels);

      return taskWithLabels;
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

      const changedFields: string[] = [];

      if (args.title !== undefined && args.title !== task.title) {
        changedFields.push('title');
      }
      if (
        args.description !== undefined &&
        args.description !== task.description
      ) {
        changedFields.push('description');
      }
      if (args.priority !== undefined && args.priority !== task.priority) {
        changedFields.push('priority');
      }
      if (
        args.dueDate !== undefined &&
        ((args.dueDate && !task.dueDate) ||
          (!args.dueDate && task.dueDate) ||
          (args.dueDate &&
            task.dueDate &&
            args.dueDate.getTime() !== task.dueDate.getTime()))
      ) {
        changedFields.push('dueDate');
      }
      if (
        args.assigneeId !== undefined &&
        args.assigneeId !== task.assigneeId
      ) {
        changedFields.push('assigneeId');
      }
      if (args.statusId !== undefined && args.statusId !== task.statusId) {
        changedFields.push('statusId');
      }

      await logActivity({
        actorId: ctx.currentUser.id,
        boardId: column.boardId,
        entityType: 'TASK',
        entityId: updated.id,
        action: 'UPDATE',
        diff:
          changedFields.length > 0
            ? `fields: ${changedFields.join(', ')}`
            : undefined,
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
      const targetColumn = await getColumnByIdPersisted(args.columnId);
      const board = await getBoardByIdPersisted(targetColumn.boardId);
      const position = args.position ?? undefined;

      if (board.visibility === 'PUBLIC') {
        const moved = await moveTaskPersisted(
          args.id,
          args.columnId,
          position,
        );

        if (ctx.currentUser) {
          await logActivity({
            actorId: ctx.currentUser.id,
            boardId: board.id,
            entityType: 'TASK',
            entityId: moved.id,
            action: 'MOVE',
            diff:
              position !== undefined
                ? `columnId:${args.columnId};position:${position}`
                : `columnId:${args.columnId}`,
          });
        }

        realtimePubSub.publish('TASK_UPDATED', board.id, moved);
        return moved;
      }

      if (!ctx.currentUser) {
        unauthorized('Authentication required');
      }

      await assertBoardPermissionDb(
        board.id,
        ctx.currentUser.id,
        BoardRole.MEMBER,
      );

      const moved = await moveTaskPersisted(args.id, args.columnId, position);

      await logActivity({
        actorId: ctx.currentUser.id,
        boardId: board.id,
        entityType: 'TASK',
        entityId: moved.id,
        action: 'MOVE',
        diff:
          position !== undefined
            ? `columnId:${args.columnId};position:${position}`
            : `columnId:${args.columnId}`,
      });

      realtimePubSub.publish('TASK_UPDATED', board.id, moved);

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
