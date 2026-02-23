// src/graphql/resolvers/task-search.resolver.ts

import { searchTasksByBoard } from '../../services/task-search.service';

export const taskSearchResolvers = {
  Query: {
    tasksByBoard: (
      _: unknown,
      args: {
        boardId: string;
        query?: string;
        statusIds?: string[];
        priority?: ('LOW' | 'MEDIUM' | 'HIGH')[];
        assigneeId?: string;
        dueFilter?: 'OVERDUE' | 'THIS_WEEK' | 'NO_DUE';
        sortBy?:
          | 'CREATED_AT'
          | 'UPDATED_AT'
          | 'DUE_DATE'
          | 'PRIORITY'
          | 'TITLE';
        sortOrder?: 'ASC' | 'DESC';
        first?: number;
        after?: string;
        last?: number;
        before?: string;
      },
    ) => {
      const { first, after, last, before, ...searchArgs } = args;

      return searchTasksByBoard(searchArgs, {
        first,
        after,
        last,
        before,
      });
    },
  },
};
