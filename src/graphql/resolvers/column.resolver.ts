import {
  listColumns,
  createColumn,
  updateColumn,
  deleteColumn,
  moveColumn,
} from '../../services/column.service';

export const columnResolvers = {
  Query: {
    columns: (_: unknown, args: { boardId: string }) => {
      return listColumns(args.boardId);
    },
  },

  Mutation: {
    createColumn: (_: unknown, args: { boardId: string; title: string }) => {
      return createColumn(args.boardId, args.title);
    },

    updateColumn: (_: unknown, args: { id: string; title: string }) => {
      return updateColumn(args.id, args.title);
    },

    deleteColumn: (_: unknown, args: { id: string }) => {
      return deleteColumn(args.id);
    },

    moveColumn: (_: unknown, args: { id: string; newPosition: number }) => {
      return moveColumn(args.id, args.newPosition);
    },
  },
};
