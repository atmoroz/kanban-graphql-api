import { describe, expect, it } from 'vitest';
import { createUser } from '../../data/mock';
import { createBoard } from '../../services/board.service';
import { createColumn } from '../../services/column.service';
import { createTask } from '../../services/task.service';
import { createLabel } from '../../services/label.service';
import {
  MAX_BOARDS_PER_USER,
  MAX_COLUMNS_PER_BOARD,
  MAX_TASKS_PER_BOARD,
  MAX_LABELS_PER_BOARD,
} from '../../lib/limits';

function expectLimitExceeded(action: () => unknown, messagePart: string): void {
  try {
    action();
    throw new Error('Expected limit error, but action succeeded');
  } catch (error: any) {
    expect(error?.extensions?.code).toBe('VALIDATION_FAILED');
    expect(error?.extensions?.reason).toBe('LIMIT_EXCEEDED');
    expect(String(error?.message ?? '')).toContain(messagePart);
  }
}

describe('restrictions limits', () => {
  it('enforces MAX_BOARDS_PER_USER on createBoard', () => {
    const owner = createUser({
      email: 'owner-limit@test.dev',
      passwordHash: 'hash',
    });

    for (let i = 0; i < MAX_BOARDS_PER_USER; i++) {
      createBoard({
        title: `Board ${i + 1}`,
        visibility: 'PRIVATE',
        ownerId: owner.id,
      });
    }

    expectLimitExceeded(
      () =>
        createBoard({
          title: 'Board overflow',
          visibility: 'PRIVATE',
          ownerId: owner.id,
        }),
      `maximum ${MAX_BOARDS_PER_USER} boards per user`,
    );
  });

  it('enforces MAX_COLUMNS_PER_BOARD on createColumn', () => {
    const owner = createUser({
      email: 'owner-columns-limit@test.dev',
      passwordHash: 'hash',
    });

    const board = createBoard({
      title: 'Columns board',
      visibility: 'PRIVATE',
      ownerId: owner.id,
    });

    for (let i = 0; i < MAX_COLUMNS_PER_BOARD; i++) {
      createColumn(board.id, `Column ${i + 1}`);
    }

    expectLimitExceeded(
      () => createColumn(board.id, 'Column overflow'),
      `maximum ${MAX_COLUMNS_PER_BOARD} columns per board`,
    );
  });

  it('enforces MAX_TASKS_PER_BOARD on createTask', () => {
    const owner = createUser({
      email: 'owner-tasks-limit@test.dev',
      passwordHash: 'hash',
    });

    const board = createBoard({
      title: 'Tasks board',
      visibility: 'PRIVATE',
      ownerId: owner.id,
    });

    const column = createColumn(board.id, 'Todo');

    for (let i = 0; i < MAX_TASKS_PER_BOARD; i++) {
      createTask({
        columnId: column.id,
        title: `Task ${i + 1}`,
      });
    }

    expectLimitExceeded(
      () =>
        createTask({
          columnId: column.id,
          title: 'Task overflow',
        }),
      `maximum ${MAX_TASKS_PER_BOARD} tasks per board`,
    );
  });

  it('enforces MAX_LABELS_PER_BOARD on createLabel', () => {
    const owner = createUser({
      email: 'owner-labels-limit@test.dev',
      passwordHash: 'hash',
    });

    const board = createBoard({
      title: 'Labels board',
      visibility: 'PRIVATE',
      ownerId: owner.id,
    });

    for (let i = 0; i < MAX_LABELS_PER_BOARD; i++) {
      createLabel({
        boardId: board.id,
        name: `Label ${i + 1}`,
      });
    }

    expectLimitExceeded(
      () =>
        createLabel({
          boardId: board.id,
          name: 'Label overflow',
        }),
      `maximum ${MAX_LABELS_PER_BOARD} labels per board`,
    );
  });
});
