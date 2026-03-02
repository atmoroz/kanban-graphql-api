import { validationFailed } from './errors';

function parseLimit(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export const MAX_BOARDS_PER_USER = parseLimit(
  process.env.MAX_BOARDS_PER_USER,
  5,
);
export const MAX_COLUMNS_PER_BOARD = parseLimit(
  process.env.MAX_COLUMNS_PER_BOARD,
  20,
);
export const MAX_TASKS_PER_BOARD = parseLimit(process.env.MAX_TASKS_PER_BOARD, 200);
export const MAX_LABELS_PER_BOARD = parseLimit(
  process.env.MAX_LABELS_PER_BOARD,
  50,
);

export function assertLimit(
  current: number,
  max: number,
  message: string,
): void {
  if (current >= max) {
    validationFailed(message, 'LIMIT_EXCEEDED');
  }
}
