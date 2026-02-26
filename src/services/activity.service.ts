import { activities, addActivity, columns, tasks } from '../data/mock';
import { notFound } from '../lib/errors';
import { paginateArray, PaginationArgs } from '../lib/pagination';
import { getTaskById } from './task.service';
import { ActivityAction, ActivityEntityType } from '../data/mock/activities';

export function logActivity(input: {
  actorId: string;
  boardId: string;
  entityType: ActivityEntityType;
  entityId: string;
  action: ActivityAction;
  diff?: string;
}) {
  return addActivity(input);
}

export function listTaskActivities(taskId: string, args: PaginationArgs) {
  const task = getTaskById(taskId);
  if (!task) {
    notFound('Task');
  }

  const result = activities
    .filter(a => a.entityType === 'TASK' && a.entityId === task.id)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return paginateArray(result, args);
}

export function listBoardActivities(boardId: string, args: PaginationArgs) {
  const result = activities
    .filter(a => a.boardId === boardId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return paginateArray(result, args);
}

export function getBoardIdForTask(taskId: string): string {
  const task = tasks.find(t => t.id === taskId);
  if (!task) {
    notFound('Task');
  }

  const column = columns.find(c => c.id === task.columnId);
  if (!column) {
    notFound('Column');
  }

  return column.boardId;
}
