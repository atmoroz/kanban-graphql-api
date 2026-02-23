import {
  getBoardById,
  listBoards,
  createBoard,
  updateBoard,
  deleteBoard,
} from '../../services/board.service';

export const boardResolvers = {
  Query: {
    board: (_: unknown, args: { id: string }) => {
      return getBoardById(args.id);
    },

    boards: (
      _: unknown,
      args: {
        sortBy?: 'NAME' | 'CREATED_AT' | 'UPDATED_AT';
        sortOrder?: 'ASC' | 'DESC';
        visibility?: 'PUBLIC' | 'PRIVATE';
        first?: number;
        after?: string;
        last?: number;
        before?: string;
      },
    ) => {
      return listBoards(args);
    },
  },

  Mutation: {
    createBoard: (
      _: unknown,
      args: {
        title: string;
        description?: string;
        visibility: 'PUBLIC' | 'PRIVATE';
      },
    ) => {
      return createBoard(args);
    },

    updateBoard: (
      _: unknown,
      args: {
        id: string;
        title?: string;
        description?: string;
        visibility?: 'PUBLIC' | 'PRIVATE';
      },
    ) => {
      const { id, ...input } = args;
      return updateBoard(id, input);
    },

    deleteBoard: (_: unknown, args: { id: string }) => {
      return deleteBoard(args.id);
    },
  },
};
