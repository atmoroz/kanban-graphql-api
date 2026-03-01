import { describe, expect, it } from 'vitest';
import { activities, createUser } from '../../data/mock';
import { createBoard } from '../../services/board.service';
import { createColumn } from '../../services/column.service';
import { createTask } from '../../services/task.service';
import { listBoardActivities, listTaskActivities, logActivity } from '../../services/activity.service';

describe('activity service', () => {
  it('logs activity and returns by board', async () => {
    const owner = createUser({
      email: 'owner-activity@test.dev',
      passwordHash: 'hash',
      name: 'Owner',
    });
    const board = createBoard({
      title: 'Activity board',
      visibility: 'PRIVATE',
      ownerId: owner.id,
    });

    const record = await logActivity({
      actorId: owner.id,
      boardId: board.id,
      entityType: 'BOARD',
      entityId: board.id,
      action: 'CREATE',
    });

    expect(record.id).toBeTruthy();
    expect(activities).toHaveLength(1);

    const paged = await listBoardActivities(board.id, { first: 10 });
    expect(paged.edges).toHaveLength(1);
    expect(paged.edges[0]?.node.entityType).toBe('BOARD');
  });

  it('filters task activities by task id', async () => {
    const owner = createUser({
      email: 'owner-task-activity@test.dev',
      passwordHash: 'hash',
      name: 'Owner',
    });
    const board = createBoard({
      title: 'Task activity board',
      visibility: 'PRIVATE',
      ownerId: owner.id,
    });
    const column = createColumn(board.id, 'Todo');
    const task = createTask({
      columnId: column.id,
      title: 'Task',
      priority: 'HIGH',
    });

    await logActivity({
      actorId: owner.id,
      boardId: board.id,
      entityType: 'TASK',
      entityId: task.id,
      action: 'UPDATE',
    });
    await logActivity({
      actorId: owner.id,
      boardId: board.id,
      entityType: 'TASK',
      entityId: 'another-task-id',
      action: 'UPDATE',
    });

    const paged = await listTaskActivities(task.id, { first: 10 });
    expect(paged.edges).toHaveLength(1);
    expect(paged.edges[0]?.node.entityId).toBe(task.id);
  });
});
