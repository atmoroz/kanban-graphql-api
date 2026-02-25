export type Status = {
  id: string;
  boardId: string;
  name: string;
  order: number;
  color?: string;
};

export const statuses: Status[] = [];
