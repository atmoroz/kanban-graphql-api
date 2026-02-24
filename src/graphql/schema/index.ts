import { makeExecutableSchema } from '@graphql-tools/schema';

import { commonTypes } from './types/common';
import { scalarTypes } from './types/scalars';
import { boardTypes } from './types/board';
import { columnTypes } from './types/column';
import { taskTypes } from './types/task';
import { sortTypes } from './types/sort';
import { taskFilterTypes } from './types/task-filters';
import { userTypes } from './types/user';
import { roleTypes } from './types/roles';
import { boardMemberTypes } from './types/board-member';

import { boardQueries } from './queries/boards';
import { columnQueries } from './queries/columns';
import { taskQueries } from './queries/tasks';
import { healthResolvers, healthTypeDefs } from './queries/health';
import { tasksByBoardQuery } from './queries/tasks-by-board';
import { authQueries } from './queries/auth';
import { boardMemberQueries } from './queries/board-members';

import { boardMutations } from './mutations/board';
import { columnMutations } from './mutations/column';
import { taskMutations } from './mutations/task';
import { mutationTypeDefs } from './mutations';
import { authMutations } from './mutations/auth';
import { boardMemberMutations } from './mutations/board-members';

import { dateTimeResolver } from '../resolvers/scalars';
import { boardResolvers } from '../resolvers/board.resolver';
import { columnResolvers } from '../resolvers/column.resolver';
import { taskResolvers } from '../resolvers/task.resolver';
import { taskSearchResolvers } from '../resolvers/task-search.resolver';
import { authResolvers } from '../resolvers/auth.resolver';
import { GraphQLContext } from '../context';

export const schema = makeExecutableSchema<GraphQLContext>({
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

    roleTypes,
    boardMemberTypes,
    boardMemberQueries,
    boardMemberMutations,
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
    authResolvers,
  ],
});
