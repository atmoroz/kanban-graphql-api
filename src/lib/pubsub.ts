import { createPubSub } from '@graphql-yoga/subscription';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import IORedis from 'ioredis';

import { ColumnRecord, TaskRecord } from '../data/mock';

type RealtimeEventName =
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_DELETED'
  | 'COLUMN_MOVED';
type RealtimePayloadByEvent = {
  TASK_CREATED: TaskRecord;
  TASK_UPDATED: TaskRecord;
  TASK_DELETED: TaskRecord;
  COLUMN_MOVED: ColumnRecord;
};

function trigger(event: RealtimeEventName, boardId: string): string {
  return `${event}:${boardId}`;
}

const redisUrl = process.env.REDIS_URL?.trim();

type RealtimePubSub = {
  publish: (event: RealtimeEventName, boardId: string, payload: unknown) => any;
  subscribe: (
    event: RealtimeEventName,
    boardId: string,
  ) => AsyncIterableIterator<unknown>;
};

let realtimePubSubImpl: RealtimePubSub;

if (!redisUrl) {
  // In-memory implementation for single-instance runtime.
  // @graphql-yoga/subscription provides asyncIterator-compatible interface.
  const inMemory = createPubSub<{
    TASK_CREATED: [boardId: string, payload: TaskRecord];
    TASK_UPDATED: [boardId: string, payload: TaskRecord];
    TASK_DELETED: [boardId: string, payload: TaskRecord];
    COLUMN_MOVED: [boardId: string, payload: ColumnRecord];
  }>();

  realtimePubSubImpl = {
    publish: (event, boardId, payload) => (inMemory as any).publish(event, boardId, payload),
    subscribe: (event, boardId) => (inMemory as any).subscribe(event, boardId),
  };
} else {
  // Redis-backed implementation for multi-instance runtime.
  const publisher = new IORedis(redisUrl);
  const subscriber = new IORedis(redisUrl);
  const redisPubSub = new RedisPubSub({ publisher, subscriber });

  realtimePubSubImpl = {
    publish: (event, boardId, payload) =>
      redisPubSub.publish(trigger(event, boardId), payload as unknown),
    subscribe: (event, boardId) =>
      redisPubSub.asyncIterator(trigger(event, boardId)),
  };
}

export const realtimePubSub = realtimePubSubImpl;

