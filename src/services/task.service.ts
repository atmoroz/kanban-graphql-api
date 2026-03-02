import { randomUUID } from 'node:crypto';

import { tasks, TaskRecord, columns, labels, statuses } from '../data/mock';
import { notFound, validationFailed } from '../lib/errors';
import { paginateArray, PaginationArgs } from '../lib/pagination';
import { TaskPriority } from '../types/task';
import { prisma } from '../lib/prisma';
import { TaskPriority as PrismaTaskPriority } from '@prisma/client';
import { MAX_TASKS_PER_BOARD, assertLimit } from '../lib/limits';

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

  const boardColumnIds = new Set(
    columns.filter(item => item.boardId === column.boardId).map(item => item.id),
  );
  const boardTaskCount = tasks.filter(task => boardColumnIds.has(task.columnId)).length;

  assertLimit(
    boardTaskCount,
    MAX_TASKS_PER_BOARD,
    `Limit reached: maximum ${MAX_TASKS_PER_BOARD} tasks per board`,
  );

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

function isTestRuntime(): boolean {
  return process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
}

function toTaskRecord(task: {
  id: string;
  columnId: string;
  title: string;
  description: string | null;
  priority: PrismaTaskPriority | null;
  dueDate: Date | null;
  assigneeId: string | null;
  position: number;
  statusId: string | null;
  overrideStatusId: string | null;
  createdAt: Date;
  updatedAt: Date;
  taskLabels?: { labelId: string }[];
}): TaskRecord {
  return {
    id: task.id,
    columnId: task.columnId,
    title: task.title,
    description: task.description ?? undefined,
    priority: (task.priority ?? undefined) as TaskPriority | undefined,
    dueDate: task.dueDate ?? undefined,
    assigneeId: task.assigneeId,
    position: task.position,
    statusId: task.statusId,
    overrideStatusId: task.overrideStatusId,
    labelIds: task.taskLabels?.map(label => label.labelId) ?? [],
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

function upsertMockTask(task: TaskRecord): void {
  const existing = tasks.find(t => t.id === task.id);
  if (existing) {
    existing.columnId = task.columnId;
    existing.title = task.title;
    existing.description = task.description;
    existing.priority = task.priority;
    existing.dueDate = task.dueDate;
    existing.assigneeId = task.assigneeId;
    existing.position = task.position;
    existing.statusId = task.statusId;
    existing.overrideStatusId = task.overrideStatusId;
    existing.labelIds = [...task.labelIds];
    existing.createdAt = task.createdAt;
    existing.updatedAt = task.updatedAt;
    return;
  }

  tasks.push(task);
}

function replaceMockTasksForColumn(
  columnId: string,
  columnTasks: TaskRecord[],
): void {
  for (let i = tasks.length - 1; i >= 0; i--) {
    if (tasks[i].columnId === columnId) {
      tasks.splice(i, 1);
    }
  }

  columnTasks.forEach(task => tasks.push(task));
}

function removeMockTaskById(id: string): void {
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) {
    return;
  }

  const { columnId, position } = tasks[index];
  tasks.splice(index, 1);

  tasks
    .filter(t => t.columnId === columnId && t.position > position)
    .forEach(t => {
      t.position--;
    });
}

async function syncColumnTasksFromDb(columnId: string): Promise<void> {
  const columnTasks = await prisma.task.findMany({
    where: { columnId },
    orderBy: { position: 'asc' },
    include: {
      taskLabels: {
        select: { labelId: true },
      },
    },
  });

  replaceMockTasksForColumn(
    columnId,
    columnTasks.map(toTaskRecord),
  );
}

export async function getTaskByIdPersisted(id: string): Promise<TaskRecord> {
  if (isTestRuntime()) {
    return getTaskById(id);
  }

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      taskLabels: {
        select: { labelId: true },
      },
    },
  });

  if (!task) {
    notFound('Task');
  }

  const mapped = toTaskRecord(task);
  upsertMockTask(mapped);
  return mapped;
}

export async function listTasksByColumnPersisted(
  columnId: string,
  args: PaginationArgs,
) {
  if (isTestRuntime()) {
    return listTasksByColumn(columnId, args);
  }

  const column = await prisma.column.findUnique({
    where: { id: columnId },
    select: { id: true },
  });

  if (!column) {
    notFound('Column');
  }

  const columnTasks = await prisma.task.findMany({
    where: { columnId },
    orderBy: { position: 'asc' },
    include: {
      taskLabels: {
        select: { labelId: true },
      },
    },
  });

  const mapped = columnTasks.map(toTaskRecord);
  replaceMockTasksForColumn(columnId, mapped);
  return paginateArray(mapped, args);
}

export async function createTaskPersisted(input: {
  columnId: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: Date;
  assigneeId?: string | null;
}): Promise<TaskRecord> {
  if (isTestRuntime()) {
    return createTask(input);
  }

  if (!input.title.trim()) {
    validationFailed('Task title cannot be empty');
  }

  const column = await prisma.column.findUnique({
    where: { id: input.columnId },
    select: { id: true, boardId: true, statusId: true },
  });

  if (!column) {
    notFound('Column');
  }

  const [position, boardTaskCount] = await Promise.all([
    prisma.task.count({
      where: { columnId: input.columnId },
    }),
    prisma.task.count({
      where: {
        column: {
          boardId: column.boardId,
        },
      },
    }),
  ]);

  assertLimit(
    boardTaskCount,
    MAX_TASKS_PER_BOARD,
    `Limit reached: maximum ${MAX_TASKS_PER_BOARD} tasks per board`,
  );

  const created = await prisma.task.create({
    data: {
      columnId: input.columnId,
      title: input.title.trim(),
      description: input.description,
      priority: input.priority as PrismaTaskPriority | undefined,
      dueDate: input.dueDate,
      assigneeId: input.assigneeId,
      position,
      statusId: column.statusId,
      overrideStatusId: null,
    },
    include: {
      taskLabels: {
        select: { labelId: true },
      },
    },
  });

  const mapped = toTaskRecord(created);
  upsertMockTask(mapped);
  return mapped;
}

export async function updateTaskPersisted(
  id: string,
  input: Partial<
    Omit<TaskRecord, 'id' | 'columnId' | 'position' | 'createdAt'>
  >,
): Promise<TaskRecord> {
  if (isTestRuntime()) {
    return updateTask(id, input);
  }

  if (input.title !== undefined && !input.title.trim()) {
    validationFailed('Task title cannot be empty');
  }

  try {
    const updated = await prisma.task.update({
      where: { id },
      data: {
        title: input.title?.trim(),
        description: input.description,
        priority: input.priority as PrismaTaskPriority | undefined,
        dueDate: input.dueDate,
        assigneeId: input.assigneeId,
        statusId: input.statusId,
        overrideStatusId: input.overrideStatusId,
      },
      include: {
        taskLabels: {
          select: { labelId: true },
        },
      },
    });

    const mapped = toTaskRecord(updated);
    upsertMockTask(mapped);
    return mapped;
  } catch {
    notFound('Task');
  }
}

export async function deleteTaskPersisted(id: string): Promise<boolean> {
  if (isTestRuntime()) {
    return deleteTask(id);
  }

  await prisma.$transaction(async tx => {
    const task = await tx.task.findUnique({
      where: { id },
      select: { id: true, columnId: true, position: true },
    });

    if (!task) {
      notFound('Task');
    }

    await tx.task.delete({
      where: { id },
    });

    await tx.task.updateMany({
      where: {
        columnId: task.columnId,
        position: { gt: task.position },
      },
      data: {
        position: { decrement: 1 },
      },
    });
  });

  removeMockTaskById(id);
  return true;
}

export async function moveTaskPersisted(
  id: string,
  targetColumnId: string,
  position?: number,
): Promise<TaskRecord> {
  if (isTestRuntime()) {
    return moveTask(id, targetColumnId, position);
  }

  const result = await prisma.$transaction(async tx => {
    const task = await tx.task.findUnique({
      where: { id },
      select: {
        id: true,
        columnId: true,
        position: true,
        overrideStatusId: true,
      },
    });

    if (!task) {
      notFound('Task');
    }

    const targetColumn = await tx.column.findUnique({
      where: { id: targetColumnId },
      select: {
        id: true,
        statusId: true,
      },
    });

    if (!targetColumn) {
      notFound('Column');
    }

    const sourceColumnId = task.columnId;

    const sourceTasks = await tx.task.findMany({
      where: { columnId: sourceColumnId },
      orderBy: { position: 'asc' },
      select: { id: true },
    });

    const targetTasks =
      sourceColumnId === targetColumnId
        ? sourceTasks
        : await tx.task.findMany({
            where: { columnId: targetColumnId },
            orderBy: { position: 'asc' },
            select: { id: true },
          });

    const newPosition = position !== undefined ? position : targetTasks.length;

    const maxPosition =
      targetTasks.length - (sourceColumnId === targetColumnId ? 1 : 0);

    if (newPosition < 0 || newPosition > maxPosition) {
      validationFailed('Invalid task position');
    }

    if (sourceColumnId === targetColumnId) {
      const oldPosition = task.position;

      if (oldPosition < newPosition) {
        await tx.task.updateMany({
          where: {
            columnId: sourceColumnId,
            position: {
              gt: oldPosition,
              lte: newPosition,
            },
          },
          data: {
            position: { decrement: 1 },
          },
        });
      }

      if (oldPosition > newPosition) {
        await tx.task.updateMany({
          where: {
            columnId: sourceColumnId,
            position: {
              lt: oldPosition,
              gte: newPosition,
            },
          },
          data: {
            position: { increment: 1 },
          },
        });
      }

      if (oldPosition !== newPosition) {
        await tx.task.update({
          where: { id },
          data: {
            position: newPosition,
          },
        });
      }
    } else {
      await tx.task.updateMany({
        where: {
          columnId: sourceColumnId,
          position: {
            gt: task.position,
          },
        },
        data: {
          position: { decrement: 1 },
        },
      });

      await tx.task.updateMany({
        where: {
          columnId: targetColumnId,
          position: {
            gte: newPosition,
          },
        },
        data: {
          position: { increment: 1 },
        },
      });

      await tx.task.update({
        where: { id },
        data: {
          columnId: targetColumnId,
          position: newPosition,
          statusId:
            task.overrideStatusId == null ? targetColumn.statusId : undefined,
        },
      });
    }

    const updated = await tx.task.findUnique({
      where: { id },
      include: {
        taskLabels: {
          select: { labelId: true },
        },
      },
    });

    if (!updated) {
      notFound('Task');
    }

    return {
      sourceColumnId,
      targetColumnId,
      task: toTaskRecord(updated),
    };
  });

  await syncColumnTasksFromDb(result.sourceColumnId);
  if (result.sourceColumnId !== result.targetColumnId) {
    await syncColumnTasksFromDb(result.targetColumnId);
  }

  upsertMockTask(result.task);
  return result.task;
}

export async function updateTaskLabelsPersisted(
  taskId: string,
  labelIds: string[],
): Promise<TaskRecord> {
  if (isTestRuntime()) {
    return updateTaskLabels(taskId, labelIds);
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      column: {
        select: {
          boardId: true,
        },
      },
    },
  });

  if (!task) {
    notFound('Task');
  }

  const taskLabels = await prisma.label.findMany({
    where: {
      id: {
        in: labelIds,
      },
    },
    select: {
      id: true,
      boardId: true,
    },
  });

  if (taskLabels.length !== labelIds.length) {
    validationFailed('One or more labels not found');
  }

  const boardId = taskLabels[0]?.boardId;
  if (boardId && taskLabels.some(label => label.boardId !== boardId)) {
    validationFailed('Labels must belong to the same board');
  }

  await prisma.$transaction(async tx => {
    await tx.taskLabel.deleteMany({
      where: { taskId },
    });

    if (labelIds.length > 0) {
      await tx.taskLabel.createMany({
        data: labelIds.map(labelId => ({
          taskId,
          labelId,
        })),
      });
    }
  });

  return getTaskByIdPersisted(taskId);
}

export async function setTaskStatusOverridePersisted(
  taskId: string,
  statusId: string,
): Promise<TaskRecord> {
  if (isTestRuntime()) {
    return setTaskStatusOverride(taskId, statusId);
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      column: {
        select: {
          boardId: true,
        },
      },
    },
  });

  if (!task) {
    notFound('Task');
  }

  const status = await prisma.status.findUnique({
    where: { id: statusId },
    select: {
      id: true,
      boardId: true,
    },
  });

  if (!status) {
    notFound('Status');
  }

  if (status.boardId !== task.column.boardId) {
    validationFailed('Status does not belong to the same board');
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      overrideStatusId: statusId,
      statusId,
    },
    include: {
      taskLabels: {
        select: { labelId: true },
      },
    },
  });

  const mapped = toTaskRecord(updated);
  upsertMockTask(mapped);
  return mapped;
}

export async function clearTaskStatusOverridePersisted(
  taskId: string,
): Promise<TaskRecord> {
  if (isTestRuntime()) {
    return clearTaskStatusOverride(taskId);
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      column: {
        select: {
          statusId: true,
        },
      },
    },
  });

  if (!task) {
    notFound('Task');
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      overrideStatusId: null,
      statusId: task.column.statusId,
    },
    include: {
      taskLabels: {
        select: { labelId: true },
      },
    },
  });

  const mapped = toTaskRecord(updated);
  upsertMockTask(mapped);
  return mapped;
}
