import { v4 as uuid } from 'uuid';

export type ColumnRecord = {
  id: string;
  boardId: string;
  title: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
};

export const columns: ColumnRecord[] = [];
