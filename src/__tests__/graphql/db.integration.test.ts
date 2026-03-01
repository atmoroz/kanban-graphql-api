import 'dotenv/config';
import { createYoga } from '@graphql-yoga/node';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createContext } from '../../graphql/context';
import { schema } from '../../graphql/schema';
import { prisma } from '../../lib/prisma';

const runDbIntegration =
  process.env.RUN_DB_INTEGRATION_TESTS === 'true' &&
  typeof process.env.DATABASE_URL === 'string' &&
  process.env.DATABASE_URL.length > 0;

const describeDb = runDbIntegration ? describe : describe.skip;

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
    body: JSON.stringify({ query, variables }),
  });

  return (await response.json()) as {
    data?: Record<string, any>;
    errors?: Array<{ message: string; extensions?: { code?: string } }>;
  };
}

function authHeaders(token: string): Record<string, string> {
  return {
    authorization: `Bearer ${token}`,
  };
}

function uniqueEmail(tag: string): string {
  return `${tag}.${Date.now()}.${Math.random().toString(16).slice(2)}@db-int.test`;
}

function uniqueBoardTitle(tag: string): string {
  return `[DB-INT] ${tag} ${Date.now()} ${Math.random().toString(16).slice(2)}`;
}

async function cleanupDbIntegrationData(): Promise<void> {
  await prisma.board.deleteMany({
    where: {
      title: {
        startsWith: '[DB-INT]',
      },
    },
  });

  await prisma.user.deleteMany({
    where: {
      email: {
        endsWith: '@db-int.test',
      },
    },
  });
}

describeDb('graphql integration (real DB)', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalVitest = process.env.VITEST;

  beforeAll(async () => {
    process.env.NODE_ENV = 'development';
    process.env.VITEST = 'false';
    await cleanupDbIntegrationData();
  });

  afterAll(async () => {
    await cleanupDbIntegrationData();
    process.env.NODE_ENV = originalNodeEnv;
    process.env.VITEST = originalVitest;
  });

  beforeEach(async () => {
    await cleanupDbIntegrationData();
  });

  it('auth flow: register -> login -> me', async () => {
    const email = uniqueEmail('auth');

    const register = await execute(
      `
        mutation Register($email: String!, $password: String!, $name: String) {
          register(email: $email, password: $password, name: $name) {
            token
            user { id email name }
          }
        }
      `,
      {
        email,
        password: 'secret123',
        name: 'DB Integration User',
      },
    );

    expect(register.errors).toBeUndefined();

    const login = await execute(
      `
        mutation Login($email: String!, $password: String!) {
          login(email: $email, password: $password) {
            token
            user { id email }
          }
        }
      `,
      {
        email,
        password: 'secret123',
      },
    );

    expect(login.errors).toBeUndefined();

    const token = login.data?.login?.token as string;
    expect(token).toBeTruthy();

    const me = await execute(
      `
        query {
          me {
            id
            email
            name
          }
        }
      `,
      undefined,
      authHeaders(token),
    );

    expect(me.errors).toBeUndefined();
    expect(me.data?.me?.email).toBe(email);
  });

  it('createBoard -> listBoards', async () => {
    const email = uniqueEmail('boards');

    const register = await execute(
      `
        mutation Register($email: String!, $password: String!) {
          register(email: $email, password: $password) {
            token
          }
        }
      `,
      {
        email,
        password: 'secret123',
      },
    );

    const token = register.data?.register?.token as string;

    const title = uniqueBoardTitle('Board flow');

    const createBoard = await execute(
      `
        mutation CreateBoard($title: String!, $visibility: BoardVisibility!) {
          createBoard(title: $title, visibility: $visibility) {
            id
            title
            visibility
          }
        }
      `,
      {
        title,
        visibility: 'PRIVATE',
      },
      authHeaders(token),
    );

    expect(createBoard.errors).toBeUndefined();
    const boardId = createBoard.data?.createBoard?.id as string;

    const boards = await execute(
      `
        query Boards($first: Int) {
          boards(first: $first) {
            edges {
              node {
                id
                title
                visibility
              }
            }
          }
        }
      `,
      { first: 20 },
      authHeaders(token),
    );

    expect(boards.errors).toBeUndefined();

    const boardNodes = (boards.data?.boards?.edges ?? []).map(
      (edge: any) => edge.node,
    );

    expect(boardNodes.some((b: any) => b.id === boardId)).toBe(true);
  });

  it('createColumn -> createTask -> moveTask', async () => {
    const email = uniqueEmail('task-flow');

    const register = await execute(
      `
        mutation Register($email: String!, $password: String!) {
          register(email: $email, password: $password) {
            token
          }
        }
      `,
      {
        email,
        password: 'secret123',
      },
    );

    const token = register.data?.register?.token as string;

    const createBoard = await execute(
      `
        mutation CreateBoard($title: String!, $visibility: BoardVisibility!) {
          createBoard(title: $title, visibility: $visibility) {
            id
          }
        }
      `,
      {
        title: uniqueBoardTitle('Task move flow'),
        visibility: 'PRIVATE',
      },
      authHeaders(token),
    );

    const boardId = createBoard.data?.createBoard?.id as string;

    const createColA = await execute(
      `
        mutation CreateColumn($boardId: ID!, $title: String!) {
          createColumn(boardId: $boardId, title: $title) {
            id
            statusId
          }
        }
      `,
      {
        boardId,
        title: 'Todo',
      },
      authHeaders(token),
    );

    const createColB = await execute(
      `
        mutation CreateColumn($boardId: ID!, $title: String!) {
          createColumn(boardId: $boardId, title: $title) {
            id
            statusId
          }
        }
      `,
      {
        boardId,
        title: 'Done',
      },
      authHeaders(token),
    );

    const columnAId = createColA.data?.createColumn?.id as string;
    const columnBId = createColB.data?.createColumn?.id as string;
    const columnBStatusId = createColB.data?.createColumn?.statusId as string;

    const createTask = await execute(
      `
        mutation CreateTask(
          $columnId: ID!
          $title: String!
          $priority: TaskPriority!
        ) {
          createTask(columnId: $columnId, title: $title, priority: $priority) {
            id
            columnId
            position
            statusId
          }
        }
      `,
      {
        columnId: columnAId,
        title: 'DB integration task',
        priority: 'HIGH',
      },
      authHeaders(token),
    );

    expect(createTask.errors).toBeUndefined();
    const taskId = createTask.data?.createTask?.id as string;

    const moveTask = await execute(
      `
        mutation MoveTask($id: ID!, $columnId: ID!, $position: Int) {
          moveTask(id: $id, columnId: $columnId, position: $position) {
            id
            columnId
            position
            statusId
          }
        }
      `,
      {
        id: taskId,
        columnId: columnBId,
        position: 0,
      },
      authHeaders(token),
    );

    expect(moveTask.errors).toBeUndefined();
    expect(moveTask.data?.moveTask?.columnId).toBe(columnBId);
    expect(moveTask.data?.moveTask?.position).toBe(0);
    expect(moveTask.data?.moveTask?.statusId).toBe(columnBStatusId);
  });

  it('permissions: VIEWER cannot write', async () => {
    const ownerEmail = uniqueEmail('owner');
    const viewerEmail = uniqueEmail('viewer');

    const ownerRegister = await execute(
      `
        mutation Register($email: String!, $password: String!) {
          register(email: $email, password: $password) {
            token
            user { id }
          }
        }
      `,
      {
        email: ownerEmail,
        password: 'secret123',
      },
    );

    const ownerToken = ownerRegister.data?.register?.token as string;

    const viewerRegister = await execute(
      `
        mutation Register($email: String!, $password: String!) {
          register(email: $email, password: $password) {
            token
            user { id }
          }
        }
      `,
      {
        email: viewerEmail,
        password: 'secret123',
      },
    );

    const viewerToken = viewerRegister.data?.register?.token as string;
    const viewerUserId = viewerRegister.data?.register?.user?.id as string;

    const createBoard = await execute(
      `
        mutation CreateBoard($title: String!, $visibility: BoardVisibility!) {
          createBoard(title: $title, visibility: $visibility) {
            id
          }
        }
      `,
      {
        title: uniqueBoardTitle('Viewer permission'),
        visibility: 'PRIVATE',
      },
      authHeaders(ownerToken),
    );

    const boardId = createBoard.data?.createBoard?.id as string;

    const inviteViewer = await execute(
      `
        mutation Invite($boardId: ID!, $userId: ID!, $role: BoardRole!) {
          inviteBoardMember(boardId: $boardId, userId: $userId, role: $role) {
            boardId
            userId
            role
          }
        }
      `,
      {
        boardId,
        userId: viewerUserId,
        role: 'VIEWER',
      },
      authHeaders(ownerToken),
    );

    expect(inviteViewer.errors).toBeUndefined();

    const viewerCreateColumn = await execute(
      `
        mutation CreateColumn($boardId: ID!, $title: String!) {
          createColumn(boardId: $boardId, title: $title) {
            id
          }
        }
      `,
      {
        boardId,
        title: 'Viewer cannot create this',
      },
      authHeaders(viewerToken),
    );

    expect(viewerCreateColumn.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');
  });
});
