import { unauthorized } from '../../lib/errors';
import { assertBoardPermissionDb } from '../../lib/permissions-db';
import { getBoardByIdPersisted } from '../../services/board.service';
import { searchTasksByBoardPersisted } from '../../services/task-search.service';
import { GraphQLContext } from '../context';
import { BoardRole } from '../schema/types/board-role';

export const taskSearchResolvers = {
  Query: {
    tasksByBoard: async (
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
      ctx: GraphQLContext,
    ) => {
      const board = await getBoardByIdPersisted(args.boardId);

      if (board.visibility !== 'PUBLIC') {
        if (!ctx.currentUser) {
          unauthorized('Authentication required');
        }

        await assertBoardPermissionDb(
          board.id,
          ctx.currentUser.id,
          BoardRole.VIEWER,
        );
      }

      const { first, after, last, before, ...searchArgs } = args;

      return searchTasksByBoardPersisted(searchArgs, {
        first,
        after,
        last,
        before,
      });
    },
  },
};
