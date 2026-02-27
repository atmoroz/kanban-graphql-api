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
import { statusTypes } from './types/status';
import { labelTypes } from './types/label';
import { activityTypes } from './types/activity';
import { pendingInviteTypes } from './types/pending-invite';

import { boardQueries } from './queries/boards';
import { columnQueries } from './queries/columns';
import { taskQueries } from './queries/tasks';
import { healthResolvers, healthTypeDefs } from './queries/health';
import { tasksByBoardQuery } from './queries/tasks-by-board';
import { authQueries } from './queries/auth';
import { boardMemberQueries } from './queries/board-members';
import { statusQueries } from './queries/status';
import { labelQueries } from './queries/label';
import { activityQueries } from './queries/activity';
import { pendingInviteQueries } from './queries/pending-invites';
import { subscriptionTypeDefs } from './subscriptions';
import { realtimeSubscriptions } from './subscriptions/realtime';

import { boardMutations } from './mutations/board';
import { columnMutations } from './mutations/column';
import { taskMutations } from './mutations/task';
import { mutationTypeDefs } from './mutations';
import { authMutations } from './mutations/auth';
import { boardMemberMutations } from './mutations/board-members';
import { labelMutations } from './mutations/label';
import { pendingInviteMutations } from './mutations/pending-invites';

import { dateTimeResolver } from '../resolvers/scalars';
import { boardResolvers } from '../resolvers/board.resolver';
import { columnResolvers } from '../resolvers/column.resolver';
import { taskResolvers } from '../resolvers/task.resolver';
import { taskSearchResolvers } from '../resolvers/task-search.resolver';
import { authResolvers } from '../resolvers/auth.resolver';
import { GraphQLContext } from '../context';
import { boardMemberResolvers } from '../resolvers/board-member.resolver';
import { statusResolvers } from '../resolvers/status.resolver';
import { labelResolvers } from '../resolvers/label.resolver';
import { activityResolvers } from '../resolvers/activity.resolver';
import { realtimeResolvers } from '../resolvers/realtime.resolver';
import { pendingInviteResolvers } from '../resolvers/pending-invite.resolver';

export const schema = makeExecutableSchema<GraphQLContext>({
  typeDefs: [
    commonTypes,
    scalarTypes,
    sortTypes,
    taskFilterTypes,
    healthTypeDefs,
    subscriptionTypeDefs,

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

    statusTypes,
    statusQueries,

    labelTypes,
    activityTypes,
    pendingInviteTypes,
    labelQueries,
    labelMutations,
    activityQueries,
    pendingInviteQueries,
    pendingInviteMutations,
    realtimeSubscriptions,
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
    boardMemberResolvers,
    statusResolvers,
    labelResolvers,
    activityResolvers,
    realtimeResolvers,
    pendingInviteResolvers,
  ],
});
