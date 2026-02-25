import { unauthorized } from '../../lib/errors';
import { assertBoardPermission } from '../../lib/permissions';
import { getBoardById } from '../../services/board.service';
import { searchTasksByBoard } from '../../services/task-search.service';
import { GraphQLContext } from '../context';
import { BoardRole } from '../schema/types/board-role';

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
      ctx: GraphQLContext,
    ) => {
      const board = getBoardById(args.boardId);

      if (board.visibility !== 'PUBLIC') {
        if (!ctx.currentUser) {
          unauthorized('Authentication required');
        }

        assertBoardPermission(board.id, ctx.currentUser.id, BoardRole.VIEWER);
      }

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
