export type Expense = {
  id?: string | number;
  description: string;
  date: string;
  cost: number | string;
};

export type TempEdit = { description: string; date: string; cost: string };
export type SortDir = "asc" | "desc";
