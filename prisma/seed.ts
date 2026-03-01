import { BoardRole, BoardVisibility, PrismaClient, TaskPriority } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run seed');
}

const pool = new Pool({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const BOARD_TITLE = 'Kanban Dashboard — Демо';
const BOARD_DESCRIPTION =
  'Демонстраційна дошка проекту: від API та авторизації до деплою. Усі етапи розробки в одному місці.';

const statusSeed = [
  { name: 'Беклог', order: 1, color: '#6B7280' },
  { name: 'В роботі', order: 2, color: '#3B82F6' },
  { name: 'На перевірці', order: 3, color: '#F59E0B' },
  { name: 'Готово', order: 4, color: '#10B981' },
] as const;

const labelSeed = [
  { name: 'API', color: '#4F46E5' },
  { name: 'Frontend', color: '#059669' },
  { name: 'Документація', color: '#D97706' },
  { name: 'DevOps', color: '#DC2626' },
  { name: 'Дизайн', color: '#7C3AED' },
  { name: 'Тестування', color: '#0EA5E9' },
] as const;

type ColumnKey = 'Беклог' | 'В роботі' | 'На перевірці' | 'Готово';

type TaskSeed = {
  title: string;
  description: string;
  priority: TaskPriority;
  column: ColumnKey;
  labelNames: string[];
  dueInDays?: number;
};

const taskSeed: TaskSeed[] = [
  {
    title: 'Створити GraphQL API з підписками, авторизацією та пагінацією',
    description:
      'Реалізовано сервер на GraphQL Yoga, JWT, курсорна пагінація та підписки для realtime.',
    priority: TaskPriority.HIGH,
    column: 'Готово',
    labelNames: ['API'],
  },
  {
    title: 'Налаштувати email-запрошення на дошки',
    description:
      'Інвайти по email, PendingInvite, відправка листів і застосування при логіні або реєстрації.',
    priority: TaskPriority.MEDIUM,
    column: 'Готово',
    labelNames: ['API'],
  },
  {
    title: 'Підготувати фронтенд-розробника до роботи з GraphQL API',
    description:
      'Документація по запитах і мутаціях, приклади клієнта Apollo/urql, підключення підписок.',
    priority: TaskPriority.HIGH,
    column: 'В роботі',
    labelNames: ['Frontend', 'Документація'],
    dueInDays: 4,
  },
  {
    title: 'Підключити базу даних через Prisma',
    description:
      'Підключення Neon PostgreSQL, оновлення схеми Prisma, перенесення сервісів з mock на DB.',
    priority: TaskPriority.HIGH,
    column: 'В роботі',
    labelNames: ['API', 'DevOps'],
    dueInDays: 2,
  },
  {
    title: 'Підготувати README та документацію для деплою',
    description:
      'Опис запуску, налаштування .env, тестування, деплой і підтримка епіків.',
    priority: TaskPriority.MEDIUM,
    column: 'В роботі',
    labelNames: ['Документація'],
    dueInDays: 6,
  },
  {
    title: 'Покрити API тестами (юніт + інтеграційні)',
    description:
      'Vitest для сервісів і резолверів, перевірка негативних сценаріїв та edge-cases.',
    priority: TaskPriority.HIGH,
    column: 'На перевірці',
    labelNames: ['API', 'Тестування'],
    dueInDays: 1,
  },
  {
    title: 'Реалізувати realtime-оновлення на клієнті',
    description:
      'Підключити taskCreated/taskUpdated/columnMoved і оновлення UI без перезавантаження сторінки.',
    priority: TaskPriority.MEDIUM,
    column: 'Беклог',
    labelNames: ['Frontend'],
    dueInDays: 10,
  },
  {
    title: 'Задеплоїти застосунок на сервер',
    description:
      'Обрати платформу, налаштувати змінні середовища, зібрати сервіс і перевірити /graphql.',
    priority: TaskPriority.HIGH,
    column: 'Беклог',
    labelNames: ['DevOps'],
    dueInDays: 14,
  },
];

function dueDate(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  await prisma.$transaction(async tx => {
    const demoUser = await tx.user.upsert({
      where: { email: 'demo@kanban.local' },
      update: { name: 'Demo User' },
      create: {
        email: 'demo@kanban.local',
        name: 'Demo User',
        passwordHash: 'seed-demo-hash',
      },
      select: { id: true },
    });

    const existingBoard = await tx.board.findFirst({
      where: { title: BOARD_TITLE },
      select: { id: true },
    });

    if (existingBoard) {
      await tx.board.delete({ where: { id: existingBoard.id } });
    }

    const board = await tx.board.create({
      data: {
        title: BOARD_TITLE,
        description: BOARD_DESCRIPTION,
        visibility: BoardVisibility.PUBLIC,
        ownerId: demoUser.id,
      },
      select: { id: true },
    });

    await tx.boardMember.upsert({
      where: {
        boardId_userId: {
          boardId: board.id,
          userId: demoUser.id,
        },
      },
      update: { role: BoardRole.OWNER },
      create: {
        boardId: board.id,
        userId: demoUser.id,
        role: BoardRole.OWNER,
      },
    });

    for (const status of statusSeed) {
      await tx.status.create({
        data: {
          boardId: board.id,
          name: status.name,
          order: status.order,
          color: status.color,
        },
      });
    }

    const statuses = await tx.status.findMany({
      where: { boardId: board.id },
      orderBy: { order: 'asc' },
      select: { id: true, name: true },
    });

    const statusByName = new Map(statuses.map(status => [status.name, status.id]));

    const columns = [] as { id: string; title: string; statusId: string }[];

    for (const [index, status] of statusSeed.entries()) {
      const statusId = statusByName.get(status.name);
      if (!statusId) {
        throw new Error(`Status not found for column: ${status.name}`);
      }

      const column = await tx.column.create({
        data: {
          boardId: board.id,
          title: status.name,
          position: index,
          statusId,
        },
        select: { id: true, title: true, statusId: true },
      });

      columns.push(column);
    }

    const columnByName = new Map(columns.map(column => [column.title, column]));

    for (const label of labelSeed) {
      await tx.label.create({
        data: {
          boardId: board.id,
          name: label.name,
          color: label.color,
        },
      });
    }

    const labels = await tx.label.findMany({
      where: { boardId: board.id },
      select: { id: true, name: true },
    });

    const labelByName = new Map(labels.map(label => [label.name, label.id]));
    const positionByColumn = new Map<ColumnKey, number>();

    for (const task of taskSeed) {
      const column = columnByName.get(task.column);
      if (!column) {
        throw new Error(`Column not found: ${task.column}`);
      }

      const position = positionByColumn.get(task.column) ?? 0;

      const createdTask = await tx.task.create({
        data: {
          columnId: column.id,
          title: task.title,
          description: task.description,
          priority: task.priority,
          dueDate: task.dueInDays ? dueDate(task.dueInDays) : null,
          assigneeId: null,
          position,
          statusId: column.statusId,
          overrideStatusId: null,
        },
        select: { id: true },
      });

      positionByColumn.set(task.column, position + 1);

      const relationRows = task.labelNames.map(labelName => {
        const labelId = labelByName.get(labelName);
        if (!labelId) {
          throw new Error(`Label not found: ${labelName}`);
        }

        return {
          taskId: createdTask.id,
          labelId,
        };
      });

      if (relationRows.length > 0) {
        await tx.taskLabel.createMany({
          data: relationRows,
        });
      }
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async error => {
    console.error(error);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
