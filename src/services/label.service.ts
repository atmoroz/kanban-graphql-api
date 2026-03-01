import { randomUUID } from 'node:crypto';
import { labels, LabelRecord, tasks } from '../data/mock';
import { notFound, validationFailed } from '../lib/errors';
import { prisma } from '../lib/prisma';

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

function isTestRuntime(): boolean {
  return process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
}

function upsertMockLabel(label: {
  id: string;
  boardId: string;
  name: string;
  color: string | null;
}): LabelRecord {
  const mapped: LabelRecord = {
    id: label.id,
    boardId: label.boardId,
    name: label.name,
    color: label.color ?? undefined,
  };

  const existing = labels.find(item => item.id === label.id);
  if (existing) {
    existing.boardId = mapped.boardId;
    existing.name = mapped.name;
    existing.color = mapped.color;
    return existing;
  }

  labels.push(mapped);
  return mapped;
}

function replaceMockLabelsForBoard(
  boardId: string,
  boardLabels: {
    id: string;
    boardId: string;
    name: string;
    color: string | null;
  }[],
): void {
  for (let i = labels.length - 1; i >= 0; i--) {
    if (labels[i].boardId === boardId) {
      labels.splice(i, 1);
    }
  }

  boardLabels.forEach(label => {
    labels.push({
      id: label.id,
      boardId: label.boardId,
      name: label.name,
      color: label.color ?? undefined,
    });
  });
}

function removeMockLabel(id: string): void {
  const index = labels.findIndex(label => label.id === id);
  if (index >= 0) {
    labels.splice(index, 1);
  }

  tasks.forEach(task => {
    task.labelIds = task.labelIds.filter(labelId => labelId !== id);
  });
}

export async function getLabelsByBoardIdPersisted(
  boardId: string,
): Promise<LabelRecord[]> {
  if (isTestRuntime()) {
    return getLabelsByBoardId(boardId);
  }

  const boardLabels = await prisma.label.findMany({
    where: { boardId },
    orderBy: { name: 'asc' },
  });

  replaceMockLabelsForBoard(boardId, boardLabels);
  return getLabelsByBoardId(boardId);
}

export async function getLabelByIdPersisted(id: string): Promise<LabelRecord> {
  if (isTestRuntime()) {
    return getLabelById(id);
  }

  const label = await prisma.label.findUnique({
    where: { id },
  });

  if (!label) {
    notFound('Label');
  }

  return upsertMockLabel(label);
}

export async function createLabelPersisted(input: {
  boardId: string;
  name: string;
  color?: string;
}): Promise<LabelRecord> {
  if (isTestRuntime()) {
    return createLabel(input);
  }

  if (!input.name.trim()) {
    validationFailed('Label name cannot be empty');
  }

  const created = await prisma.label.create({
    data: {
      boardId: input.boardId,
      name: input.name.trim(),
      color: input.color,
    },
  });

  return upsertMockLabel(created);
}

export async function updateLabelPersisted(
  id: string,
  input: { name?: string; color?: string },
): Promise<LabelRecord> {
  if (isTestRuntime()) {
    return updateLabel(id, input);
  }

  if (input.name !== undefined && !input.name.trim()) {
    validationFailed('Label name cannot be empty');
  }

  try {
    const updated = await prisma.label.update({
      where: { id },
      data: {
        name: input.name?.trim(),
        color: input.color,
      },
    });

    return upsertMockLabel(updated);
  } catch {
    notFound('Label');
  }
}

export async function deleteLabelPersisted(id: string): Promise<boolean> {
  if (isTestRuntime()) {
    return deleteLabel(id);
  }

  try {
    await prisma.label.delete({
      where: { id },
    });
  } catch {
    notFound('Label');
  }

  removeMockLabel(id);
  return true;
}
