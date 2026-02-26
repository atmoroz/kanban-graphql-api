import { createPubSub } from '@graphql-yoga/subscription';
import { ColumnRecord, TaskRecord } from '../data/mock';

type RealtimeEventMap = {
  TASK_CREATED: [boardId: string, payload: TaskRecord];
  TASK_UPDATED: [boardId: string, payload: TaskRecord];
  COLUMN_MOVED: [boardId: string, payload: ColumnRecord];
};

export const realtimePubSub = createPubSub<RealtimeEventMap>();

