import { randomUUID } from 'node:crypto';

export type ActivityEntityType = 'TASK' | 'COLUMN' | 'BOARD';
export type ActivityAction = 'CREATE' | 'UPDATE' | 'MOVE' | 'DELETE';

export type ActivityRecord = {
  id: string;
  actorId: string;
  boardId: string;
  entityType: ActivityEntityType;
  entityId: string;
  action: ActivityAction;
  diff?: string;
  createdAt: Date;
};

export const activities: ActivityRecord[] = [];

export function addActivity(
  input: Omit<ActivityRecord, 'id' | 'createdAt'> & { createdAt?: Date },
): ActivityRecord {
  const record: ActivityRecord = {
    id: randomUUID(),
    actorId: input.actorId,
    boardId: input.boardId,
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    diff: input.diff,
    createdAt: input.createdAt ?? new Date(),
  };

  activities.push(record);
  return record;
}

