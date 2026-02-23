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
    return Buffer.from(cursor, 'base64').toString('utf-8');
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
