import {
  getTaskById,
  listTasksByColumn,
  createTask,
  updateTask,
  deleteTask,
  moveTask,
} from '../../services/task.service';

export const taskResolvers = {
  Query: {
    task: (_: unknown, args: { id: string }) => {
      return getTaskById(args.id);
    },

    tasksByColumn: (
      _: unknown,
      args: {
        columnId: string;
        first?: number;
        after?: string;
        last?: number;
        before?: string;
      },
    ) => {
      const { columnId, ...pagination } = args;
      return listTasksByColumn(columnId, pagination);
    },
  },

  Mutation: {
    createTask: (
      _: unknown,
      args: {
        columnId: string;
        title: string;
        description?: string;
        priority: 'LOW' | 'MEDIUM' | 'HIGH';
        dueDate?: Date;
        assigneeId?: string | null;
      },
    ) => {
      return createTask(args);
    },
    updateTask: (
      _: unknown,
      args: {
        id: string;
        title?: string;
        description?: string;
        priority?: 'LOW' | 'MEDIUM' | 'HIGH';
        dueDate?: Date;
        assigneeId?: string | null;
      },
    ) => {
      const { id, ...input } = args;
      return updateTask(id, input);
    },

    deleteTask: (_: unknown, args: { id: string }) => {
      return deleteTask(args.id);
    },

    moveTask: (
      _: unknown,
      args: {
        id: string;
        columnId: string;
        position: number;
      },
    ) => {
      return moveTask(args.id, args.columnId, args.position);
    },
  },
};
