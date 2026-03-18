import { PubSub } from 'graphql-subscriptions';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import IORedis from 'ioredis';

import { ColumnRecord, TaskRecord } from '../data/mock';

type RealtimeEventName = 'TASK_CREATED' | 'TASK_UPDATED' | 'COLUMN_MOVED';
type RealtimePayloadByEvent = {
  TASK_CREATED: TaskRecord;
  TASK_UPDATED: TaskRecord;
  COLUMN_MOVED: ColumnRecord;
};

function trigger(event: RealtimeEventName, boardId: string): string {
  return `${event}:${boardId}`;
}

function createEngine() {
  const redisUrl = process.env.REDIS_URL?.trim();
  if (!redisUrl) {
    return new PubSub() as unknown as PubSubEngineLike;
  }

  const publisher = new IORedis(redisUrl);
  const subscriber = new IORedis(redisUrl);

  return new RedisPubSub({ publisher, subscriber }) as unknown as PubSubEngineLike;
}

type PubSubEngineLike = {
  publish: (triggerName: string, payload: unknown) => Promise<void>;
  asyncIterator: (triggerName: string) => AsyncIterableIterator<unknown>;
};

const engine: PubSubEngineLike = createEngine();

export const realtimePubSub = {
  publish<E extends RealtimeEventName>(
    event: E,
    boardId: string,
    payload: RealtimePayloadByEvent[E],
  ) {
    return engine.publish(trigger(event, boardId), payload);
  },

  subscribe<E extends RealtimeEventName>(event: E, boardId: string) {
    return engine.asyncIterator(trigger(event, boardId));
  },
};

