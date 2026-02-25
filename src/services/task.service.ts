import { randomUUID } from 'node:crypto';

import { tasks, TaskRecord, columns, labels, statuses } from '../data/mock';
import { notFound, validationFailed } from '../lib/errors';
import { paginateArray, PaginationArgs } from '../lib/pagination';
import { TaskPriority } from '../types/task';

export function getTaskById(id: string): TaskRecord {
  const task = tasks.find(b => b.id === id);
  if (!task) {
    notFound('Task');
  }
  return task;
}

function listTasksInColumn(columnId: string): TaskRecord[] {
  return tasks
    .filter(t => t.columnId === columnId)
    .sort((a, b) => a.position - b.position);
}

export function listTasksByColumn(columnId: string, args: PaginationArgs) {
  const columnExists = columns.some(c => c.id === columnId);
  if (!columnExists) notFound('Column');

  const columnTasks = listTasksInColumn(columnId);
  return paginateArray(columnTasks, args);
}

export function createTask(input: {
  columnId: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: Date;
  assigneeId?: string | null;
}): TaskRecord {
  if (!input.title.trim()) {
    validationFailed('Task title cannot be empty');
  }

  const column = columns.find(c => c.id === input.columnId);
  if (!column) notFound('Column');

  const statusId = column.statusId;

  const position = listTasksInColumn(input.columnId).length;

  const task: TaskRecord = {
    id: randomUUID(),
    columnId: input.columnId,
    title: input.title,
    position,
    statusId,
    overrideStatusId: null,
    labelIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (input.description !== undefined) {
    task.description = input.description;
  }

  if (input.priority !== undefined) {
    task.priority = input.priority;
  }

  if (input.dueDate !== undefined) {
    task.dueDate = input.dueDate;
  }

  if (input.assigneeId !== undefined) {
    task.assigneeId = input.assigneeId;
  }

  tasks.push(task);
  return task;
}

export function updateTask(
  id: string,
  input: Partial<
    Omit<TaskRecord, 'id' | 'columnId' | 'position' | 'createdAt'>
  >,
): TaskRecord {
  const task = getTaskById(id);

  if (input.title !== undefined && !input.title.trim()) {
    validationFailed('Task title cannot be empty');
  }

  Object.assign(task, input, {
    updatedAt: new Date(),
  });

  return task;
}

export function deleteTask(id: string): boolean {
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) notFound('Task');

  const { columnId, position } = tasks[index];
  tasks.splice(index, 1);

  tasks
    .filter(t => t.columnId === columnId && t.position > position)
    .forEach(t => t.position--);

  return true;
}

export function moveTask(
  id: string,
  targetColumnId: string,
  position?: number,
): TaskRecord {
  const task = getTaskById(id);

  const targetColumn = columns.find(c => c.id === targetColumnId);
  if (!targetColumn) notFound('Column');

  const sourceColumnId = task.columnId;

  const sourceTasks = listTasksInColumn(sourceColumnId);
  const targetTasks =
    sourceColumnId === targetColumnId
      ? sourceTasks
      : listTasksInColumn(targetColumnId);

  const newPosition = position !== undefined ? position : targetTasks.length;

  const maxPosition =
    targetTasks.length - (sourceColumnId === targetColumnId ? 1 : 0);

  if (newPosition < 0 || newPosition > maxPosition) {
    validationFailed('Invalid task position');
  }

  if (sourceColumnId === targetColumnId) {
    const oldPosition = task.position;

    if (oldPosition !== newPosition) {
      targetTasks.forEach(t => {
        if (t.id === task.id) return;

        if (
          oldPosition < newPosition &&
          t.position > oldPosition &&
          t.position <= newPosition
        ) {
          t.position--;
        }

        if (
          oldPosition > newPosition &&
          t.position < oldPosition &&
          t.position >= newPosition
        ) {
          t.position++;
        }
      });

      task.position = newPosition;
    }
  } else {
    sourceTasks
      .filter(t => t.position > task.position)
      .forEach(t => t.position--);

    targetTasks
      .filter(t => t.position >= newPosition)
      .forEach(t => t.position++);

    task.columnId = targetColumnId;
    task.position = newPosition;
    if (task.overrideStatusId == null) {
      task.statusId = targetColumn.statusId;
    }
  }

  task.updatedAt = new Date();
  return task;
}

export function updateTaskLabels(taskId: string, labelIds: string[]) {
  const task = getTaskById(taskId);

  const taskLabels = labels.filter(l => labelIds.includes(l.id));

  if (taskLabels.length !== labelIds.length) {
    validationFailed('One or more labels not found');
  }

  const boardId = taskLabels[0]?.boardId;
  if (boardId && taskLabels.some(l => l.boardId !== boardId)) {
    validationFailed('Labels must belong to the same board');
  }

  task.labelIds = labelIds;
  task.updatedAt = new Date();

  return task;
}

export function setTaskStatusOverride(taskId: string, statusId: string) {
  const task = getTaskById(taskId);

  const column = columns.find(c => c.id === task.columnId);
  if (!column) {
    throw new Error('Column not found');
  }

  const status = statuses.find(s => s.id === statusId);
  if (!status) {
    notFound('Status');
  }

  if (status.boardId !== column.boardId) {
    validationFailed('Status does not belong to the same board');
  }

  task.overrideStatusId = statusId;
  task.statusId = statusId;
  task.updatedAt = new Date();

  return task;
}

export function clearTaskStatusOverride(taskId: string) {
  const task = getTaskById(taskId);

  const column = columns.find(c => c.id === task.columnId);
  if (!column) {
    throw new Error('Column not found');
  }

  task.overrideStatusId = null;
  task.statusId = column.statusId;
  task.updatedAt = new Date();

  return task;
}
