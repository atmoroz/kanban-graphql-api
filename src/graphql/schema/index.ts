import { createSchema } from 'graphql-yoga';

import { commonTypes } from './types/common';
import { scalarTypes } from './types/scalars';
import { boardTypes } from './types/board';
import { columnTypes } from './types/column';
import { taskTypes } from './types/task';
import { sortTypes } from './types/sort';
import { taskFilterTypes } from './types/task-filters';
import { userTypes } from './types/user';

import { boardQueries } from './queries/boards';
import { columnQueries } from './queries/columns';
import { taskQueries } from './queries/tasks';
import { healthResolvers, healthTypeDefs } from './queries/health';
import { tasksByBoardQuery } from './queries/tasks-by-board';
import { authQueries } from './queries/auth';

import { boardMutations } from './mutations/board';
import { columnMutations } from './mutations/column';
import { taskMutations } from './mutations/task';
import { mutationTypeDefs } from './mutations';
import { authMutations } from './mutations/auth';

import { dateTimeResolver } from '../resolvers/scalars';
import { boardResolvers } from '../resolvers/board.resolver';
import { columnResolvers } from '../resolvers/column.resolver';
import { taskResolvers } from '../resolvers/task.resolver';
import { taskSearchResolvers } from '../resolvers/task-search.resolver';

export const schema = createSchema({
  typeDefs: [
    commonTypes,
    scalarTypes,
    sortTypes,
    taskFilterTypes,
    healthTypeDefs,

    boardTypes,
    boardQueries,
    boardMutations,

    columnTypes,
    columnQueries,
    columnMutations,

    taskTypes,
    taskQueries,
    taskMutations,

    mutationTypeDefs,
    tasksByBoardQuery,

    userTypes,
    authQueries,
    authMutations,
  ],
  resolvers: [
    {
      DateTime: dateTimeResolver,
    },
    healthResolvers,
    boardResolvers,
    columnResolvers,
    taskResolvers,
    taskSearchResolvers,
  ],
});
