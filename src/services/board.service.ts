import { randomUUID } from 'node:crypto';
import { boards, BoardRecord } from '../data/mock/boards';
import { notFound, validationFailed } from '../lib/errors';
import { paginateArray, PaginationArgs } from '../lib/pagination';
import { columns } from '../data/mock/columns';
import { BoardRole } from '../graphql/schema/types/board-role';
import { addBoardMember } from '../data/mock/board-members';

export type BoardSortBy = 'NAME' | 'CREATED_AT' | 'UPDATED_AT';
export type SortOrder = 'ASC' | 'DESC';

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

function sortBoards(
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
