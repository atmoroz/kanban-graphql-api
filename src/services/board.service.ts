import { randomUUID } from 'node:crypto';
import {
  boards,
  BoardRecord,
  columns,
  addBoardMember,
  boardMembers,
  findBoardMember,
  isBoardMember,
  statuses,
} from '../data/mock';
import { notFound, validationFailed } from '../lib/errors';
import { paginateArray, PaginationArgs } from '../lib/pagination';
import { BoardRole } from '../graphql/schema/types/board-role';
import { prisma } from '../lib/prisma';
import {
  BoardVisibility as PrismaBoardVisibility,
  Board as PrismaBoard,
} from '@prisma/client';

export type BoardSortBy = 'NAME' | 'CREATED_AT' | 'UPDATED_AT';
export type SortOrder = 'ASC' | 'DESC';
const DEFAULT_STATUSES = [
  { name: 'Todo', order: 1, color: '#6B7280' },
  { name: 'In Progress', order: 2, color: '#3B82F6' },
  { name: 'Done', order: 3, color: '#10B981' },
];

function toBoardRecord(board: PrismaBoard): BoardRecord {
  return {
    id: board.id,
    title: board.title,
    description: board.description ?? undefined,
    visibility: board.visibility as 'PUBLIC' | 'PRIVATE',
    createdAt: board.createdAt,
    updatedAt: board.updatedAt,
  };
}

function isTestRuntime(): boolean {
  return process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
}

function upsertMockBoard(board: BoardRecord): void {
  const existing = boards.find(b => b.id === board.id);
  if (existing) {
    existing.title = board.title;
    existing.description = board.description;
    existing.visibility = board.visibility;
    existing.createdAt = board.createdAt;
    existing.updatedAt = board.updatedAt;
    return;
  }

  boards.push(board);
}

function removeMockBoard(boardId: string): void {
  const boardIndex = boards.findIndex(b => b.id === boardId);
  if (boardIndex >= 0) {
    boards.splice(boardIndex, 1);
  }

  for (let i = columns.length - 1; i >= 0; i--) {
    if (columns[i].boardId === boardId) {
      columns.splice(i, 1);
    }
  }

  for (let i = statuses.length - 1; i >= 0; i--) {
    if (statuses[i].boardId === boardId) {
      statuses.splice(i, 1);
    }
  }

  for (let i = boardMembers.length - 1; i >= 0; i--) {
    if (boardMembers[i].boardId === boardId) {
      boardMembers.splice(i, 1);
    }
  }
}

function upsertDefaultStatusesToMock(boardId: string): void {
  for (let i = statuses.length - 1; i >= 0; i--) {
    if (statuses[i].boardId === boardId) {
      statuses.splice(i, 1);
    }
  }

  DEFAULT_STATUSES.forEach((status, index) => {
    statuses.push({
      id: randomUUID(),
      boardId,
      name: status.name,
      order: index + 1,
      color: status.color,
    });
  });
}

export function getBoardById(id: string): BoardRecord {
  const board = boards.find(b => b.id === id);

  if (!board) {
    notFound('Board');
  }
  return board as unknown as BoardRecord;
}

export function listBoards(
  args: PaginationArgs & {
    sortBy?: BoardSortBy;
    sortOrder?: SortOrder;
    visibility?: 'PUBLIC' | 'PRIVATE';
  },
) {
  let result = boards;

  if (args.visibility) {
    result = result.filter(b => b.visibility === args.visibility);
  }

  result = sortBoards(result, args.sortBy, args.sortOrder);

  return paginateArray(result, args);
}

export function createBoard(input: {
  title: string;
  description?: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  ownerId?: string;
}) {
  const board: BoardRecord = {
    id: randomUUID(),
    title: input.title,
    visibility: input.visibility,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (input.description !== undefined) {
    board.description = input.description;
  }
  boards.push(board);
  DEFAULT_STATUSES.forEach(status => {
    statuses.push({
      id: randomUUID(),
      boardId: board.id,
      name: status.name,
      order: status.order,
      color: status.color,
    });
  });

  if (input.ownerId) {
    addBoardMember({
      boardId: board.id,
      userId: input.ownerId,
      role: BoardRole.OWNER,
    });
  }

  return board;
}

export function updateBoard(
  id: string,
  input: Partial<Omit<BoardRecord, 'id' | 'createdAt'>>,
): BoardRecord {
  const board = getBoardById(id);

  Object.assign(board, input, {
    updatedAt: new Date(),
  });

  return board;
}

export function deleteBoard(id: string): boolean {
  const index = boards.findIndex(b => b.id === id);
  if (index === -1) notFound('Board');

  boards.splice(index, 1);

  for (let i = columns.length - 1; i >= 0; i--) {
    if (columns[i].boardId === id) {
      columns.splice(i, 1);
    }
  }

  return true;
}

export function sortBoards(
  boards: BoardRecord[],
  sortBy: BoardSortBy = 'CREATED_AT',
  sortOrder: SortOrder = 'ASC',
): BoardRecord[] {
  const direction = sortOrder === 'ASC' ? 1 : -1;

  return [...boards].sort((a, b) => {
    switch (sortBy) {
      case 'NAME':
        return a.title.localeCompare(b.title) * direction;

      case 'UPDATED_AT':
        return (a.updatedAt.getTime() - b.updatedAt.getTime()) * direction;

      case 'CREATED_AT':
      default:
        return (a.createdAt.getTime() - b.createdAt.getTime()) * direction;
    }
  });
}

export function listBoardsForUser(userId?: string) {
  if (!userId) {
    return boards.filter(b => b.visibility === 'PUBLIC');
  }

  return boards.filter(
    b => b.visibility === 'PUBLIC' || isBoardMember(b.id, userId),
  );
}

export async function getBoardByIdPersisted(id: string): Promise<BoardRecord> {
  if (isTestRuntime()) {
    return getBoardById(id);
  }

  const board = await prisma.board.findUnique({
    where: { id },
  });

  if (!board) {
    notFound('Board');
  }

  const mapped = toBoardRecord(board);
  upsertMockBoard(mapped);
  return mapped;
}

export async function listBoardsForUserPersisted(
  userId?: string,
): Promise<BoardRecord[]> {
  if (isTestRuntime()) {
    return listBoardsForUser(userId);
  }

  const boardsFromDb = await prisma.board.findMany({
    where: userId
      ? {
          OR: [
            { visibility: PrismaBoardVisibility.PUBLIC },
            {
              members: {
                some: {
                  userId,
                },
              },
            },
          ],
        }
      : {
          visibility: PrismaBoardVisibility.PUBLIC,
        },
  });

  const mapped = boardsFromDb.map(toBoardRecord);
  mapped.forEach(upsertMockBoard);
  return mapped;
}

export async function createBoardPersisted(input: {
  title: string;
  description?: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  ownerId?: string;
}): Promise<BoardRecord> {
  if (isTestRuntime()) {
    return createBoard(input);
  }

  if (!input.title?.trim()) {
    validationFailed('Board title cannot be empty');
  }

  const board = await prisma.board.create({
    data: {
      title: input.title.trim(),
      description: input.description?.trim() || null,
      visibility: input.visibility as PrismaBoardVisibility,
      ownerId: input.ownerId ?? null,
    },
  });

  if (input.ownerId) {
    await prisma.boardMember.upsert({
      where: {
        boardId_userId: {
          boardId: board.id,
          userId: input.ownerId,
        },
      },
      create: {
        boardId: board.id,
        userId: input.ownerId,
        role: BoardRole.OWNER,
      },
      update: {
        role: BoardRole.OWNER,
      },
    });

    if (!findBoardMember(board.id, input.ownerId)) {
      addBoardMember({
        boardId: board.id,
        userId: input.ownerId,
        role: BoardRole.OWNER,
      });
    }
  }

  await prisma.status.createMany({
    data: DEFAULT_STATUSES.map(status => ({
      boardId: board.id,
      name: status.name,
      order: status.order,
      color: status.color,
    })),
    skipDuplicates: true,
  });

  const mapped = toBoardRecord(board);
  upsertMockBoard(mapped);
  upsertDefaultStatusesToMock(board.id);
  return mapped;
}

export async function updateBoardPersisted(
  id: string,
  input: {
    title?: string;
    description?: string;
    visibility?: 'PUBLIC' | 'PRIVATE';
  },
): Promise<BoardRecord> {
  if (isTestRuntime()) {
    return updateBoard(id, input);
  }

  if (input.title !== undefined && !input.title.trim()) {
    validationFailed('Board title cannot be empty');
  }

  try {
    const board = await prisma.board.update({
      where: { id },
      data: {
        title: input.title?.trim(),
        description:
          input.description !== undefined
            ? input.description.trim() || null
            : undefined,
        visibility: input.visibility as PrismaBoardVisibility | undefined,
      },
    });

    const mapped = toBoardRecord(board);
    upsertMockBoard(mapped);
    return mapped;
  } catch {
    notFound('Board');
  }
}

export async function deleteBoardPersisted(id: string): Promise<boolean> {
  if (isTestRuntime()) {
    return deleteBoard(id);
  }

  try {
    await prisma.board.delete({
      where: { id },
    });
    removeMockBoard(id);
    return true;
  } catch {
    notFound('Board');
  }
}
