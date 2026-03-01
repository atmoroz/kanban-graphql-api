import { statuses } from '../data/mock';
import { notFound } from '../lib/errors';
import { prisma } from '../lib/prisma';

export function getStatusesByBoardId(boardId: string) {
  return statuses
    .filter(s => s.boardId === boardId)
    .sort((a, b) => a.order - b.order);
}

export function getStatusById(id: string) {
  const status = statuses.find(s => s.id === id);
  if (!status) notFound('Status');
  return status;
}

function isTestRuntime(): boolean {
  return process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
}

function replaceMockStatusesForBoard(
  boardId: string,
  boardStatuses: {
    id: string;
    boardId: string;
    name: string;
    order: number;
    color: string | null;
  }[],
): void {
  for (let i = statuses.length - 1; i >= 0; i--) {
    if (statuses[i].boardId === boardId) {
      statuses.splice(i, 1);
    }
  }

  boardStatuses.forEach(status => {
    statuses.push({
      id: status.id,
      boardId: status.boardId,
      name: status.name,
      order: status.order,
      color: status.color ?? undefined,
    });
  });
}

function upsertMockStatus(status: {
  id: string;
  boardId: string;
  name: string;
  order: number;
  color: string | null;
}): void {
  const existing = statuses.find(s => s.id === status.id);
  if (existing) {
    existing.boardId = status.boardId;
    existing.name = status.name;
    existing.order = status.order;
    existing.color = status.color ?? undefined;
    return;
  }

  statuses.push({
    id: status.id,
    boardId: status.boardId,
    name: status.name,
    order: status.order,
    color: status.color ?? undefined,
  });
}

export async function getStatusesByBoardIdPersisted(boardId: string) {
  if (isTestRuntime()) {
    return getStatusesByBoardId(boardId);
  }

  const boardStatuses = await prisma.status.findMany({
    where: { boardId },
    orderBy: { order: 'asc' },
  });

  replaceMockStatusesForBoard(boardId, boardStatuses);
  return getStatusesByBoardId(boardId);
}

export async function getStatusByIdPersisted(id: string) {
  if (isTestRuntime()) {
    return getStatusById(id);
  }

  const status = await prisma.status.findUnique({
    where: { id },
  });

  if (!status) {
    notFound('Status');
  }

  upsertMockStatus(status);
  return getStatusById(id);
}
