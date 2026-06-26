// Мок-данные для статического режима (без БД)
// Используются когда USE_DATABASE=false или БД недоступна

import { Service, CounterEntry } from "./models";

export const mockServices: Service[] = [
  {
    id: "mock-service-1",
    name: "API Gateway",
    description: "Шлюз для микросервисной архитектуры",
    status: "active",
    url: "https://api.example.com",
    createdAt: new Date("2024-01-15").toISOString(),
    updatedAt: new Date("2024-01-15").toISOString(),
  },
  {
    id: "mock-service-2",
    name: "Auth Service",
    description: "Сервис аутентификации и авторизации",
    status: "active",
    url: "https://auth.example.com",
    createdAt: new Date("2024-02-01").toISOString(),
    updatedAt: new Date("2024-02-01").toISOString(),
  },
  {
    id: "mock-service-3",
    name: "ML Pipeline",
    description: "Пайплайн для обработки данных с AI",
    status: "deploying",
    url: undefined,
    createdAt: new Date("2024-03-10").toISOString(),
    updatedAt: new Date("2024-03-10").toISOString(),
  },
];

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().split("T")[0];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate random data for a given year/month
function generateMonthData(year: number, month: number): CounterEntry[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const entries: CounterEntry[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    // Skip some days to make it realistic
    if (Math.random() > 0.65) continue;
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    entries.push({
      date: dateStr,
      calls: randomInt(3, 25),
      chats: randomInt(2, 18),
    });
  }
  return entries;
}

export const mockCounters: CounterEntry[] = [
  ...generateMonthData(2026, 5),
  ...generateMonthData(2026, 4),
  ...generateMonthData(2026, 3),
  { date: todayStr(), calls: 12, chats: 8 },
  { date: daysAgo(1), calls: 10, chats: 6 },
  { date: daysAgo(2), calls: 15, chats: 9 },
  { date: daysAgo(3), calls: 8, chats: 5 },
  { date: daysAgo(4), calls: 14, chats: 7 },
  { date: daysAgo(5), calls: 11, chats: 10 },
  { date: daysAgo(6), calls: 9, chats: 4 },
];
