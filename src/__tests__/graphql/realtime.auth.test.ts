import { describe, expect, it } from 'vitest';
import { createUser } from '../../data/mock';
import { createBoard } from '../../services/board.service';
import { realtimeResolvers } from '../../graphql/resolvers/realtime.resolver';
import { toSafeUser } from '../../data/mock/users';

describe('realtime subscription access', () => {
  it('rejects subscribe without auth', () => {
    const board = createBoard({
      title: 'Private board',
      visibility: 'PRIVATE',
    });

    const subscribe = () =>
      realtimeResolvers.Subscription.taskCreated.subscribe(
        {},
        { boardId: board.id },
        {
          request: new Request('http://localhost/graphql'),
          currentUser: null,
          authToken: null,
        },
      );

    expect(subscribe).toThrowError(/Authentication required/i);
  });

  it('rejects subscribe for non-member user', () => {
    const owner = createUser({
      email: 'owner-sub@test.dev',
      passwordHash: 'hash',
      name: 'Owner',
    });
    const outsider = createUser({
      email: 'outsider-sub@test.dev',
      passwordHash: 'hash',
      name: 'Outsider',
    });
    const board = createBoard({
      title: 'Private board',
      visibility: 'PRIVATE',
      ownerId: owner.id,
    });

    const subscribe = () =>
      realtimeResolvers.Subscription.taskUpdated.subscribe(
        {},
        { boardId: board.id },
        {
          request: new Request('http://localhost/graphql'),
          currentUser: toSafeUser(outsider),
          authToken: 'test-token',
        },
      );

    expect(subscribe).toThrowError(/Insufficient permissions/i);
  });
});

