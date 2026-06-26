export interface CounterData {
  calls: number;
  chats: number;
}

export interface CounterTotals {
  week: CounterData & { total: number };
  month: CounterData & { total: number };
}

export const todayStats: CounterData = {
  calls: 12,
  chats: 8,
};

export const weeklyTotals: CounterTotals = {
  week: { calls: 45, chats: 32, total: 77 },
  month: { calls: 180, chats: 120, total: 300 },
};
