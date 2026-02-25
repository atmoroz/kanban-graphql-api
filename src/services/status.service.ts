import { statuses } from '../data/mock';
import { notFound } from '../lib/errors';

export function getStatusesByBoardId(boardId: string) {
  return statuses
    .filter(s => s.boardId === boardId)
    .sort((a, b) => a.order - b.order);
}

export function getStatusById(id: string) {
  const status = statuses.find(s => s.id === id);
  if (!status) notFound('Status');
  return status;
}
