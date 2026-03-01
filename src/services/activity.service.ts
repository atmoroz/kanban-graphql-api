import {
  activities,
  addActivity,
  ActivityAction,
  ActivityEntityType,
  ActivityRecord,
  columns,
} from '../data/mock';
import { notFound } from '../lib/errors';
import { paginateArray, PaginationArgs } from '../lib/pagination';
import { getTaskById } from './task.service';
import { prisma } from '../lib/prisma';

function isTestRuntime(): boolean {
  return process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
}

function toActivityRecord(activity: {
  id: string;
  actorId: string;
  boardId: string;
  entityType: string;
  entityId: string;
  action: string;
  diff: string | null;
  createdAt: Date;
}): ActivityRecord {
  return {
    id: activity.id,
    actorId: activity.actorId,
    boardId: activity.boardId,
    entityType: activity.entityType as ActivityEntityType,
    entityId: activity.entityId,
    action: activity.action as ActivityAction,
    diff: activity.diff ?? undefined,
    createdAt: activity.createdAt,
  };
}

function upsertMockActivity(activity: ActivityRecord): void {
  const existing = activities.find(item => item.id === activity.id);

  if (existing) {
    existing.actorId = activity.actorId;
    existing.boardId = activity.boardId;
    existing.entityType = activity.entityType;
    existing.entityId = activity.entityId;
    existing.action = activity.action;
    existing.diff = activity.diff;
    existing.createdAt = activity.createdAt;
    return;
  }

  activities.push(activity);
}

export async function logActivity(input: {
  actorId: string;
  boardId: string;
  entityType: ActivityEntityType;
  entityId: string;
  action: ActivityAction;
  diff?: string;
}) {
  if (isTestRuntime()) {
    return addActivity(input);
  }

  return prisma.activity
    .create({
      data: {
        actorId: input.actorId,
        boardId: input.boardId,
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        diff: input.diff,
      },
    })
    .then(created => {
      const mapped = toActivityRecord(created);
      upsertMockActivity(mapped);
      return mapped;
    });
}

export async function listTaskActivities(taskId: string, args: PaginationArgs) {
  if (isTestRuntime()) {
    const task = getTaskById(taskId);
    if (!task) {
      notFound('Task');
    }

    const result = activities
      .filter(a => a.entityType === 'TASK' && a.entityId === task.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return paginateArray(result, args);
  }

  return prisma.task
    .findUnique({
      where: {
        id: taskId,
      },
      select: {
        id: true,
      },
    })
    .then(task => {
      if (!task) {
        notFound('Task');
      }

      return prisma.activity.findMany({
        where: {
          entityType: 'TASK',
          entityId: taskId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    })
    .then(result => {
      const mapped = result.map(toActivityRecord);
      mapped.forEach(upsertMockActivity);
      return paginateArray(mapped, args);
    });
}

export async function listBoardActivities(boardId: string, args: PaginationArgs) {
  if (isTestRuntime()) {
    const result = activities
      .filter(a => a.boardId === boardId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return paginateArray(result, args);
  }

  return prisma.activity
    .findMany({
      where: {
        boardId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    .then(result => {
      const mapped = result.map(toActivityRecord);
      mapped.forEach(upsertMockActivity);
      return paginateArray(mapped, args);
    });
}

export async function getBoardIdForTask(taskId: string): Promise<string> {
  if (isTestRuntime()) {
    const task = getTaskById(taskId);
    if (!task) {
      notFound('Task');
    }

    const column = columns.find(item => item.id === task.columnId);

    if (!column) {
      notFound('Column');
    }

    return column.boardId;
  }

  return prisma.task
    .findUnique({
      where: {
        id: taskId,
      },
      select: {
        column: {
          select: {
            boardId: true,
          },
        },
      },
    })
    .then(task => {
      if (!task) {
        notFound('Task');
      }

      return task.column.boardId;
    });
}
