import { describe, expect, it } from 'vitest';
import { boards, statuses } from '../../data/mock';
import { createBoard, listBoardsForUser } from '../../services/board.service';

describe('board service', () => {
  it('creates default statuses for new board', () => {
    const board = createBoard({
      title: 'Board with defaults',
      visibility: 'PRIVATE',
    });

    const boardStatuses = statuses.filter(s => s.boardId === board.id);
    expect(boardStatuses.length).toBeGreaterThan(0);
  });

  it('returns only public boards for anonymous user', () => {
    createBoard({
      title: 'Public board test',
      visibility: 'PUBLIC',
    });
    createBoard({
      title: 'Private board test',
      visibility: 'PRIVATE',
    });

    const result = listBoardsForUser();
    expect(result.every(board => board.visibility === 'PUBLIC')).toBe(true);
    expect(result.length).toBeLessThanOrEqual(boards.length);
  });
});

