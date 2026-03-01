import { validationFailed } from './errors';

export type PageInfo = {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
};

export type Edge<T> = {
  node: T;
  cursor: string;
};

export type PaginatedResult<T> = {
  edges: Edge<T>[];
  pageInfo: PageInfo;
};

export function encodeCursor(value: string | number): string {
  return Buffer.from(String(value)).toString('base64');
}

export function decodeCursor(cursor: string): string {
  try {
    if (!/^[A-Za-z0-9+/=]+$/.test(cursor)) {
      validationFailed('Invalid cursor');
    }

    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    const normalizedInput = cursor.replace(/=+$/, '');
    const normalizedRoundtrip = Buffer.from(decoded, 'utf-8')
      .toString('base64')
      .replace(/=+$/, '');

    if (!decoded || normalizedInput !== normalizedRoundtrip) {
      validationFailed('Invalid cursor');
    }

    return decoded;
  } catch {
    validationFailed('Invalid cursor');
  }
}

export type PaginationArgs = {
  first?: number;
  after?: string;
  last?: number;
  before?: string;
};

export function paginateArray<T extends { id: string }>(
  items: T[],
  args: PaginationArgs,
): PaginatedResult<T> {
  const { first, after, last, before } = args;

  if (first && last) {
    validationFailed('Cannot use first and last together');
  }

  if (after && before) {
    validationFailed('Cannot use after and before together');
  }

  if (first !== undefined && first < 0) {
    validationFailed('first must be a non-negative integer');
  }

  if (last !== undefined && last < 0) {
    validationFailed('last must be a non-negative integer');
  }

  if (first !== undefined && first > 100) {
    validationFailed('first cannot exceed 100');
  }

  if (last !== undefined && last > 100) {
    validationFailed('last cannot exceed 100');
  }

  let start = 0;
  let end = items.length;

  if (after) {
    const decoded = decodeCursor(after);
    const index = items.findIndex(i => i.id === decoded);
    if (index >= 0) start = index + 1;
  }

  if (before) {
    const decoded = decodeCursor(before);
    const index = items.findIndex(i => i.id === decoded);
    if (index >= 0) end = index;
  }

  let sliced = items.slice(start, end);

  if (first !== undefined) {
    sliced = sliced.slice(0, first);
  }

  if (last !== undefined) {
    sliced = sliced.slice(-last);
  }

  const edges = sliced.map(item => ({
    node: item,
    cursor: encodeCursor(item.id),
  }));

  if (edges.length === 0) {
    return {
      edges: [],
      pageInfo: {
        hasPreviousPage: start > 0,
        hasNextPage: end < items.length,
        startCursor: null,
        endCursor: null,
      },
    };
  }

  const firstEdgeIndex = items.findIndex(i => i.id === edges[0]?.node.id);
  const lastEdgeIndex = items.findIndex(
    i => i.id === edges[edges.length - 1]?.node.id,
  );

  return {
    edges,
    pageInfo: {
      hasPreviousPage: firstEdgeIndex > 0,
      hasNextPage: lastEdgeIndex < items.length - 1,
      startCursor: edges[0]?.cursor ?? null,
      endCursor: edges[edges.length - 1]?.cursor ?? null,
    },
  };
}
