export interface CounterEntry {
  date: string;
  calls: number;
  chats: number;
}

const STORAGE_KEY = "t-counter-entries";

function loadAll(): CounterEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CounterEntry[]) : [];
  } catch {
    return [];
  }
}

function saveAll(entries: CounterEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (e) {
    console.error("Failed to save to localStorage:", e);
  }
}

export function getCounterByDate(date: string): CounterEntry | null {
  const entries = loadAll();
  return entries.find((e) => e.date === date) ?? null;
}

export function upsertCounter(
  date: string,
  calls: number,
  chats: number
): CounterEntry {
  const entries = loadAll();
  const idx = entries.findIndex((e) => e.date === date);
  const entry: CounterEntry = { date, calls, chats };
  if (idx >= 0) {
    entries[idx] = entry;
  } else {
    entries.push(entry);
  }
  saveAll(entries);
  return entry;
}

export function deleteCounterByDate(date: string): void {
  const entries = loadAll().filter((e) => e.date !== date);
  saveAll(entries);
}

export function getCountersByDateRange(
  startDate: string,
  endDate: string
): CounterEntry[] {
  return loadAll().filter((e) => e.date >= startDate && e.date <= endDate);
}

export function getAllCounters(): CounterEntry[] {
  return loadAll();
}
