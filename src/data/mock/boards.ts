import { randomUUID } from 'node:crypto';

export type BoardRecord = {
  id: string;
  title: string;
  description?: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  createdAt: Date;
  updatedAt: Date;
};

export const boards: BoardRecord[] = [
  {
    id: randomUUID(),
    title: 'Public board',
    description: 'Demo public board',
    visibility: 'PUBLIC',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: randomUUID(),
    title: 'Private board',
    visibility: 'PRIVATE',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
