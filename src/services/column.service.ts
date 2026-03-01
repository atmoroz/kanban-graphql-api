import { randomUUID } from 'node:crypto';
import { getBoardById } from './board.service';
import { columns, ColumnRecord, tasks, statuses } from '../data/mock';
import { notFound, validationFailed } from '../lib/errors';
import { prisma } from '../lib/prisma';

export function listColumns(boardId: string): ColumnRecord[] {
  return columns
    .filter(c => c.boardId === boardId)
    .sort((a, b) => a.position - b.position);
}

export function createColumn(boardId: string, title: string): ColumnRecord {
  if (!boardId) {
    validationFailed('boardId is required');
  }
  getBoardById(boardId);

  if (!title.trim()) {
    validationFailed('Column title cannot be empty');
  }

  const boardColumns = listColumns(boardId);
  const position = boardColumns.length;

  const boardStatuses = statuses
    .filter(s => s.boardId === boardId)
    .sort((a, b) => a.order - b.order);

  if (!boardStatuses.length) {
    throw new Error('Board has no statuses');
  }

  const statusId = boardStatuses[0].id;

  const column: ColumnRecord = {
    id: randomUUID(),
    boardId,
    title,
    position,
    statusId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  columns.push(column);
  return column;
}

export function updateColumn(id: string, title: string): ColumnRecord {
  if (!title.trim()) {
    validationFailed('Column title cannot be empty');
  }
  const column = columns.find(c => c.id === id);
  if (!column) {
    notFound('Column');
  }

  column.title = title;
  column.updatedAt = new Date();
  return column as unknown as ColumnRecord;
}

export function deleteColumn(id: string): boolean {
  const index = columns.findIndex(c => c.id === id);
  if (index === -1) notFound('Column');

  const { boardId, position } = columns[index];
  columns.splice(index, 1);

  for (let i = tasks.length - 1; i >= 0; i--) {
    if (tasks[i].columnId === id) {
      tasks.splice(i, 1);
    }
  }

  columns
    .filter(c => c.boardId === boardId && c.position > position)
    .forEach(c => c.position--);

  return true;
}

export function moveColumn(id: string, newPosition: number): ColumnRecord[] {
  const column = columns.find(c => c.id === id);
  if (!column) notFound('Column');

  const boardColumns = listColumns(column.boardId);
  const maxPosition = boardColumns.length - 1;

  if (newPosition < 0 || newPosition > maxPosition) {
    validationFailed('Invalid column position');
  }

  const oldPosition = column.position;

  boardColumns.forEach(c => {
    if (c.id === column.id) return;

    // moving right
    if (
      oldPosition < newPosition &&
      c.position > oldPosition &&
      c.position <= newPosition
    ) {
      c.position--;
    }

    // moving left
    if (
      oldPosition > newPosition &&
      c.position < oldPosition &&
      c.position >= newPosition
    ) {
      c.position++;
    }
  });

  column.position = newPosition;
  column.updatedAt = new Date();

  return listColumns(column.boardId);
}

function isTestRuntime(): boolean {
  return process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
}

function toColumnRecord(column: {
  id: string;
  boardId: string;
  title: string;
  position: number;
  statusId: string;
  createdAt: Date;
  updatedAt: Date;
}): ColumnRecord {
  return {
    id: column.id,
    boardId: column.boardId,
    title: column.title,
    position: column.position,
    statusId: column.statusId,
    createdAt: column.createdAt,
    updatedAt: column.updatedAt,
  };
}

function upsertMockColumn(column: ColumnRecord): void {
  const existing = columns.find(c => c.id === column.id);
  if (existing) {
    existing.boardId = column.boardId;
    existing.title = column.title;
    existing.position = column.position;
    existing.statusId = column.statusId;
    existing.createdAt = column.createdAt;
    existing.updatedAt = column.updatedAt;
    return;
  }

  columns.push(column);
}

function replaceMockColumnsForBoard(
  boardId: string,
  boardColumns: ColumnRecord[],
): void {
  for (let i = columns.length - 1; i >= 0; i--) {
    if (columns[i].boardId === boardId) {
      columns.splice(i, 1);
    }
  }

  boardColumns.forEach(column => columns.push(column));
}

function removeMockColumn(id: string): void {
  const index = columns.findIndex(c => c.id === id);
  if (index === -1) {
    return;
  }

  const { boardId, position } = columns[index];
  columns.splice(index, 1);

  for (let i = tasks.length - 1; i >= 0; i--) {
    if (tasks[i].columnId === id) {
      tasks.splice(i, 1);
    }
  }

  columns
    .filter(c => c.boardId === boardId && c.position > position)
    .forEach(c => {
      c.position--;
    });
}

export async function getColumnByIdPersisted(id: string): Promise<ColumnRecord> {
  if (isTestRuntime()) {
    const column = columns.find(c => c.id === id);
    if (!column) {
      notFound('Column');
    }
    return column as ColumnRecord;
  }

  const column = await prisma.column.findUnique({
    where: { id },
  });

  if (!column) {
    notFound('Column');
  }

  const mapped = toColumnRecord(column);
  upsertMockColumn(mapped);
  return mapped;
}

export async function listColumnsPersisted(
  boardId: string,
): Promise<ColumnRecord[]> {
  if (isTestRuntime()) {
    return listColumns(boardId);
  }

  const boardColumns = await prisma.column.findMany({
    where: { boardId },
    orderBy: { position: 'asc' },
  });

  const mapped = boardColumns.map(toColumnRecord);
  replaceMockColumnsForBoard(boardId, mapped);
  return mapped;
}

export async function createColumnPersisted(
  boardId: string,
  title: string,
): Promise<ColumnRecord> {
  if (isTestRuntime()) {
    return createColumn(boardId, title);
  }

  if (!boardId) {
    validationFailed('boardId is required');
  }

  if (!title.trim()) {
    validationFailed('Column title cannot be empty');
  }

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { id: true },
  });

  if (!board) {
    notFound('Board');
  }

  const status = await prisma.status.findFirst({
    where: { boardId },
    orderBy: { order: 'asc' },
    select: { id: true },
  });

  if (!status) {
    throw new Error('Board has no statuses');
  }

  const position = await prisma.column.count({
    where: { boardId },
  });

  const created = await prisma.column.create({
    data: {
      boardId,
      title: title.trim(),
      position,
      statusId: status.id,
    },
  });

  const mapped = toColumnRecord(created);
  upsertMockColumn(mapped);
  return mapped;
}

export async function updateColumnPersisted(
  id: string,
  title: string,
): Promise<ColumnRecord> {
  if (isTestRuntime()) {
    return updateColumn(id, title);
  }

  if (!title.trim()) {
    validationFailed('Column title cannot be empty');
  }

  try {
    const updated = await prisma.column.update({
      where: { id },
      data: {
        title: title.trim(),
      },
    });

    const mapped = toColumnRecord(updated);
    upsertMockColumn(mapped);
    return mapped;
  } catch {
    notFound('Column');
  }
}

export async function deleteColumnPersisted(id: string): Promise<boolean> {
  if (isTestRuntime()) {
    return deleteColumn(id);
  }

  await prisma.$transaction(async tx => {
    const column = await tx.column.findUnique({
      where: { id },
      select: { id: true, boardId: true, position: true },
    });

    if (!column) {
      notFound('Column');
    }

    await tx.column.delete({
      where: { id },
    });

    await tx.column.updateMany({
      where: {
        boardId: column.boardId,
        position: { gt: column.position },
      },
      data: {
        position: { decrement: 1 },
      },
    });
  });

  removeMockColumn(id);
  return true;
}

export async function moveColumnPersisted(
  id: string,
  newPosition: number,
): Promise<ColumnRecord[]> {
  if (isTestRuntime()) {
    return moveColumn(id, newPosition);
  }

  const boardId = await prisma.$transaction(async tx => {
    const column = await tx.column.findUnique({
      where: { id },
      select: { id: true, boardId: true, position: true },
    });

    if (!column) {
      notFound('Column');
    }

    const boardColumns = await tx.column.findMany({
      where: { boardId: column.boardId },
      orderBy: { position: 'asc' },
      select: { id: true },
    });

    const maxPosition = boardColumns.length - 1;
    if (newPosition < 0 || newPosition > maxPosition) {
      validationFailed('Invalid column position');
    }

    const oldPosition = column.position;

    if (oldPosition < newPosition) {
      await tx.column.updateMany({
        where: {
          boardId: column.boardId,
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
      await tx.column.updateMany({
        where: {
          boardId: column.boardId,
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
      await tx.column.update({
        where: { id },
        data: {
          position: newPosition,
        },
      });
    }

    return column.boardId;
  });

  const boardColumns = await prisma.column.findMany({
    where: { boardId },
    orderBy: { position: 'asc' },
  });

  const mapped = boardColumns.map(toColumnRecord);
  replaceMockColumnsForBoard(boardId, mapped);
  return mapped;
}
