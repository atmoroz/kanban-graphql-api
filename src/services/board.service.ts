import { boards, BoardRecord } from '../data/mocks/boards';
import { notFound } from '../lib/errors';
import { paginateArray, PaginationArgs } from '../lib/pagination';
import { v4 as uuid } from 'uuid';

export function getBoardById(id: string): BoardRecord {
  const board = boards.find(b => b.id === id);
  if (!board) {
    notFound('Board');
  }
  return board as unknown as BoardRecord;
}

export function listBoards(
  args: PaginationArgs & { visibility?: 'PUBLIC' | 'PRIVATE' },
) {
  let result = boards;

  if (args.visibility) {
    result = result.filter(b => b.visibility === args.visibility);
  }

  return paginateArray(result, args);
}

export function createBoard(input: {
  title: string;
  description?: string;
  visibility: 'PUBLIC' | 'PRIVATE';
}): BoardRecord {
  const board: BoardRecord = {
    id: uuid(),
    title: input.title,
    description: input.description,
    visibility: input.visibility,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  boards.push(board);
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
  if (index === -1) {
    notFound('Board');
  }

  boards.splice(index, 1);
  return true;
}
