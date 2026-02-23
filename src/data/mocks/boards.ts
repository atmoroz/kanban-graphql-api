import { v4 as uuid } from 'uuid';

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
    id: uuid(),
    title: 'Public board',
    description: 'Demo public board',
    visibility: 'PUBLIC',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: uuid(),
    title: 'Private board',
    visibility: 'PRIVATE',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
