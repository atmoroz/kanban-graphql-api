import { createSchema } from 'graphql-yoga';

import { commonTypes } from './types/common';
import { healthTypeDefs, healthResolvers } from './queries/health';
import { mutationTypeDefs, mutationResolvers } from './mutations';

export const schema = createSchema({
  typeDefs: [commonTypes, healthTypeDefs, mutationTypeDefs],
  resolvers: [healthResolvers, mutationResolvers],
});
