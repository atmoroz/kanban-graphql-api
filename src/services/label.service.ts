import { randomUUID } from 'node:crypto';
import { labels, LabelRecord } from '../data/mock/labels';
import { notFound, validationFailed } from '../lib/errors';

export function getLabelsByBoardId(boardId: string): LabelRecord[] {
  return labels.filter(l => l.boardId === boardId);
}

export function getLabelById(id: string): LabelRecord {
  const label = labels.find(l => l.id === id);
  if (!label) notFound('Label');
  return label;
}

export function createLabel(input: {
  boardId: string;
  name: string;
  color?: string;
}): LabelRecord {
  if (!input.name.trim()) {
    validationFailed('Label name cannot be empty');
  }

  const label: LabelRecord = {
    id: randomUUID(),
    boardId: input.boardId,
    name: input.name,
    color: input.color,
  };

  labels.push(label);
  return label;
}

export function updateLabel(
  id: string,
  input: { name?: string; color?: string },
): LabelRecord {
  const label = getLabelById(id);

  if (input.name !== undefined) {
    if (!input.name.trim()) {
      validationFailed('Label name cannot be empty');
    }
    label.name = input.name;
  }

  if (input.color !== undefined) {
    label.color = input.color;
  }

  return label;
}

export function deleteLabel(id: string): boolean {
  const index = labels.findIndex(l => l.id === id);
  if (index === -1) notFound('Label');

  labels.splice(index, 1);
  return true;
}
