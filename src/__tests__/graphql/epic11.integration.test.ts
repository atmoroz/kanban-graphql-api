import { createYoga } from '@graphql-yoga/node';
import { describe, expect, it } from 'vitest';
import { createUser, findBoardMember } from '../../data/mock';
import { createContext } from '../../graphql/context';
import { schema } from '../../graphql/schema';
import { signToken } from '../../lib/auth';
import { createBoard } from '../../services/board.service';
import { BoardRole } from '../../graphql/schema/types/board-role';
import { createColumn } from '../../services/column.service';

const yoga = createYoga({
  schema,
  graphqlEndpoint: '/graphql',
  context: createContext,
});

async function execute(
  query: string,
  variables?: Record<string, unknown>,
  headers?: Record<string, string>,
) {
  const response = await yoga.fetch('http://localhost/graphql', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(headers ?? {}),
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  return (await response.json()) as {
    data?: Record<string, unknown>;
    errors?: Array<{ extensions?: { code?: string } }>;
  };
}

function authHeaders(userId: string): Record<string, string> {
  return {
    authorization: `Bearer ${signToken({ userId })}`,
  };
}

describe('graphql integration', () => {
  it('returns UNAUTHORIZED for protected mutation without auth', async () => {
    const result = await execute(`
      mutation {
        createBoard(title: "A", visibility: PRIVATE) {
          id
        }
      }
    `);

    expect(result.errors?.[0]?.extensions?.code).toBe('UNAUTHORIZED');
  });

  it('creates pending invite and applies it on register', async () => {
    const owner = createUser({
      email: 'owner@test.dev',
      name: 'Owner',
      passwordHash: 'hash',
    });
    const board = createBoard({
      title: 'Secure Board',
      visibility: 'PRIVATE',
      ownerId: owner.id,
    });

    const inviteResult = await execute(
      `
        mutation Invite($boardId: ID!, $email: String!, $role: BoardRole!) {
          inviteByEmail(boardId: $boardId, email: $email, role: $role) {
            id
            status
            emailSentAt
          }
        }
      `,
      {
        boardId: board.id,
        email: 'joiner@test.dev',
        role: BoardRole.MEMBER,
      },
      {
        ...authHeaders(owner.id),
      },
    );

    expect(inviteResult.errors).toBeUndefined();
    expect(inviteResult.data).toBeDefined();

    const registerResult = await execute(
      `
        mutation Register($email: String!, $password: String!, $name: String) {
          register(email: $email, password: $password, name: $name) {
            user { id email }
            token
          }
        }
      `,
      {
        email: 'joiner@test.dev',
        password: 'secret123',
        name: 'Joiner',
      },
    );

    expect(registerResult.errors).toBeUndefined();
    const userId = (
      registerResult.data as {
        register: { user: { id: string } };
      }
    ).register.user.id;

    expect(findBoardMember(board.id, userId)?.role).toBe(BoardRole.MEMBER);
  });

  it('returns CONFLICT for duplicate registration', async () => {
    await execute(
      `
        mutation Register($email: String!, $password: String!) {
          register(email: $email, password: $password) {
            user { id }
            token
          }
        }
      `,
      {
        email: 'dupe@test.dev',
        password: 'secret123',
      },
    );

    const second = await execute(
      `
        mutation Register($email: String!, $password: String!) {
          register(email: $email, password: $password) {
            user { id }
            token
          }
        }
      `,
      {
        email: 'dupe@test.dev',
        password: 'secret123',
      },
    );

    expect(second.errors?.[0]?.extensions?.code).toBe('CONFLICT');
  });

  it('returns FORBIDDEN when non-admin invites by email', async () => {
    const owner = createUser({
      email: 'owner2@test.dev',
      name: 'Owner',
      passwordHash: 'hash',
    });
    const outsider = createUser({
      email: 'outsider@test.dev',
      name: 'Outsider',
      passwordHash: 'hash',
    });
    const board = createBoard({
      title: 'Private board',
      visibility: 'PRIVATE',
      ownerId: owner.id,
    });

    const result = await execute(
      `
        mutation Invite($boardId: ID!, $email: String!, $role: BoardRole!) {
          inviteByEmail(boardId: $boardId, email: $email, role: $role) {
            id
          }
        }
      `,
      {
        boardId: board.id,
        email: 'new@test.dev',
        role: BoardRole.MEMBER,
      },
      authHeaders(outsider.id),
    );

    expect(result.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');
  });

  it('returns CONFLICT for duplicate pending invite by board+email', async () => {
    const owner = createUser({
      email: 'owner3@test.dev',
      name: 'Owner',
      passwordHash: 'hash',
    });
    const board = createBoard({
      title: 'Private board',
      visibility: 'PRIVATE',
      ownerId: owner.id,
    });

    await execute(
      `
        mutation Invite($boardId: ID!, $email: String!, $role: BoardRole!) {
          inviteByEmail(boardId: $boardId, email: $email, role: $role) {
            id
          }
        }
      `,
      {
        boardId: board.id,
        email: 'dupe-invite@test.dev',
        role: BoardRole.MEMBER,
      },
      authHeaders(owner.id),
    );

    const duplicate = await execute(
      `
        mutation Invite($boardId: ID!, $email: String!, $role: BoardRole!) {
          inviteByEmail(boardId: $boardId, email: $email, role: $role) {
            id
          }
        }
      `,
      {
        boardId: board.id,
        email: 'dupe-invite@test.dev',
        role: BoardRole.MEMBER,
      },
      authHeaders(owner.id),
    );

    expect(duplicate.errors?.[0]?.extensions?.code).toBe('CONFLICT');
  });

  it('returns NOT_FOUND for unknown board id', async () => {
    const result = await execute(`
      query {
        board(id: "missing-board-id") {
          id
        }
      }
    `);

    expect(result.errors?.[0]?.extensions?.code).toBe('NOT_FOUND');
  });

  it('returns VALIDATION_FAILED for empty column title', async () => {
    const owner = createUser({
      email: 'owner4@test.dev',
      name: 'Owner',
      passwordHash: 'hash',
    });
    const board = createBoard({
      title: 'Board with column validation',
      visibility: 'PRIVATE',
      ownerId: owner.id,
    });

    const result = await execute(
      `
        mutation CreateColumn($boardId: ID!, $title: String!) {
          createColumn(boardId: $boardId, title: $title) {
            id
          }
        }
      `,
      {
        boardId: board.id,
        title: '   ',
      },
      authHeaders(owner.id),
    );

    expect(result.errors?.[0]?.extensions?.code).toBe('VALIDATION_FAILED');
  });

  it('returns VALIDATION_FAILED for pagination values above 100', async () => {
    const owner = createUser({
      email: 'owner5@test.dev',
      name: 'Owner',
      passwordHash: 'hash',
    });
    const board = createBoard({
      title: 'Board for pagination',
      visibility: 'PRIVATE',
      ownerId: owner.id,
    });
    const column = createColumn(board.id, 'Todo');

    const result = await execute(
      `
        query TasksByColumn($columnId: ID!, $first: Int) {
          tasksByColumn(columnId: $columnId, first: $first) {
            edges { cursor }
            pageInfo { hasNextPage }
          }
        }
      `,
      {
        columnId: column.id,
        first: 101,
      },
      authHeaders(owner.id),
    );

    expect(result.errors?.[0]?.extensions?.code).toBe('VALIDATION_FAILED');
  });
});
