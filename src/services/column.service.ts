import { columns, ColumnRecord } from '../data/mocks/columns';
import { notFound } from '../lib/errors';
import { v4 as uuid } from 'uuid';

export function listColumns(boardId: string): ColumnRecord[] {
  return columns
    .filter(c => c.boardId === boardId)
    .sort((a, b) => a.position - b.position);
}

export function createColumn(boardId: string, title: string): ColumnRecord {
  const boardColumns = listColumns(boardId);
  const position = boardColumns.length;

  const column: ColumnRecord = {
    id: uuid(),
    boardId,
    title,
    position,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  columns.push(column);
  return column;
}

export function updateColumn(id: string, title: string): ColumnRecord {
  const column = columns.find(c => c.id === id);
  if (!column) {
    notFound('Column');
  }

  column.title = title;
  column.updatedAt = new Date();
  return column as unknown as ColumnRecord;
}

export function deleteColumn(id: string): boolean {
  const index = columns.findIndex(c => c.id === id);
  if (index === -1) {
    notFound('Column');
  }

  const { boardId, position } = columns[index];
  columns.splice(index, 1);

  columns
    .filter(c => c.boardId === boardId && c.position > position)
    .forEach(c => c.position--);

  return true;
}

export function moveColumn(id: string, newPosition: number): ColumnRecord[] {
  const column = columns.find(c => c.id === id);
  if (!column) {
    notFound('Column');
  }

  const boardColumns = listColumns(column.boardId);

  const oldPosition = column.position;

  boardColumns.forEach(c => {
    if (c.id === id) return;

    if (
      oldPosition < newPosition &&
      c.position > oldPosition &&
      c.position <= newPosition
    ) {
      c.position--;
    }

    if (
      oldPosition > newPosition &&
      c.position < oldPosition &&
      c.position >= newPosition
    ) {
      c.position++;
    }
  });

  column.position = newPosition;
  column.updatedAt = new Date();

  return listColumns(column.boardId);
}
