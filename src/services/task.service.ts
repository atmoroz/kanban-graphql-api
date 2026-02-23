import { randomUUID } from 'node:crypto';

import { tasks, TaskRecord } from '../data/mock/tasks';
import { columns } from '../data/mock/columns';
import { notFound, validationFailed } from '../lib/errors';
import { paginateArray, PaginationArgs } from '../lib/pagination';

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
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: Date;
  assigneeId?: string | null;
}): TaskRecord {
  if (!input.title.trim()) {
    validationFailed('Task title cannot be empty');
  }

  const columnExists = columns.some(c => c.id === input.columnId);
  if (!columnExists) notFound('Column');

  const position = listTasksInColumn(input.columnId).length;

  const task: TaskRecord = {
    id: randomUUID(),
    columnId: input.columnId,
    title: input.title,
    description: input.description,
    priority: input.priority,
    dueDate: input.dueDate,
    assigneeId: input.assigneeId ?? null,
    position,
    statusId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

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
  newPosition: number,
): TaskRecord {
  const task = getTaskById(id);

  const sourceColumnId = task.columnId;
  const sourceTasks = listTasksInColumn(sourceColumnId);
  const targetTasks = listTasksInColumn(targetColumnId);

  if (newPosition < 0 || newPosition > targetTasks.length) {
    validationFailed('Invalid task position');
  }

  sourceTasks
    .filter(t => t.position > task.position)
    .forEach(t => t.position--);

  targetTasks.filter(t => t.position >= newPosition).forEach(t => t.position++);

  task.columnId = targetColumnId;
  task.position = newPosition;
  task.updatedAt = new Date();

  return task;
}
