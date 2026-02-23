import { createSchema } from 'graphql-yoga';

import { commonTypes } from './types/common';
import { scalarTypes } from './types/scalars';
import { boardTypes } from './types/board';
import { columnTypes } from './types/column';

import { boardQueries } from './queries/boards';
import { columnQueries } from './queries/columns';

import { boardMutations } from './mutations/board';
import { columnMutations } from './mutations/column';

import { healthResolvers, healthTypeDefs } from './queries/health';
import { mutationTypeDefs } from './mutations';
import { dateTimeResolver } from '../resolvers/scalars';
import { boardResolvers } from '../resolvers/board.resolver';
import { columnResolvers } from '../resolvers/column.resolver';

export const schema = createSchema({
  typeDefs: [
    commonTypes,
    scalarTypes,
    boardTypes,
    columnTypes,
    healthTypeDefs,
    boardQueries,
    columnQueries,
    boardMutations,
    columnMutations,
    mutationTypeDefs,
  ],
  resolvers: [
    {
      DateTime: dateTimeResolver,
    },
    healthResolvers,
    boardResolvers,
    columnResolvers,
  ],
});
