import { randomUUID } from 'node:crypto';
import { getBoardById } from './board.service';
import { columns, ColumnRecord } from '../data/mock/columns';
import { notFound, validationFailed } from '../lib/errors';

export function listColumns(boardId: string): ColumnRecord[] {
  return columns
    .filter(c => c.boardId === boardId)
    .sort((a, b) => a.position - b.position);
}

export function createColumn(boardId: string, title: string): ColumnRecord {
  if (!boardId) {
    validationFailed('boardId is required');
  }
  getBoardById(boardId);

  if (!title.trim()) {
    validationFailed('Column title cannot be empty');
  }

  const boardColumns = listColumns(boardId);
  const position = boardColumns.length;

  const column: ColumnRecord = {
    id: randomUUID(),
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
  if (!title.trim()) {
    validationFailed('Column title cannot be empty');
  }
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
  if (!column) notFound('Column');

  const boardColumns = listColumns(column.boardId);
  const maxPosition = boardColumns.length - 1;

  if (newPosition < 0 || newPosition > maxPosition) {
    validationFailed('Invalid column position');
  }

  const oldPosition = column.position;

  boardColumns.forEach(c => {
    if (c.id === column.id) return;

    // moving right
    if (
      oldPosition < newPosition &&
      c.position > oldPosition &&
      c.position <= newPosition
    ) {
      c.position--;
    }

    // moving left
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
