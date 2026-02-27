import { describe, expect, it } from 'vitest';
import { encodeCursor, paginateArray } from '../../lib/pagination';

type TestNode = { id: string; name: string };

const nodes: TestNode[] = [
  { id: '1', name: 'One' },
  { id: '2', name: 'Two' },
  { id: '3', name: 'Three' },
];

describe('pagination', () => {
  it('returns first N edges with page info', () => {
    const result = paginateArray(nodes, { first: 2 });

    expect(result.edges).toHaveLength(2);
    expect(result.edges.map(edge => edge.node.id)).toEqual(['1', '2']);
    expect(result.pageInfo.hasPreviousPage).toBe(false);
    expect(result.pageInfo.hasNextPage).toBe(true);
  });

  it('throws VALIDATION_FAILED when first and last are used together', () => {
    expect(() => paginateArray(nodes, { first: 1, last: 1 })).toThrowError(
      /Cannot use first and last together/i,
    );
  });

  it('throws VALIDATION_FAILED for invalid cursor', () => {
    expect(() => paginateArray(nodes, { after: 'not-base64%%' })).toThrowError(
      /Invalid cursor/i,
    );
  });

  it('throws VALIDATION_FAILED for negative/too-large limits', () => {
    expect(() => paginateArray(nodes, { first: -1 })).toThrowError(
      /non-negative/i,
    );
    expect(() => paginateArray(nodes, { first: 101 })).toThrowError(
      /cannot exceed 100/i,
    );
  });

  it('supports after cursor for forward paging', () => {
    const after = encodeCursor('1');
    const result = paginateArray(nodes, { after, first: 2 });

    expect(result.edges.map(edge => edge.node.id)).toEqual(['2', '3']);
  });
});
