"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Phone,
  MessageSquare,
  TrendingUp,
  CalendarDays,
  Minus,
  Plus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/lib/tauri";
import {
  getCounterByDate as lsGetCounter,
  getCountersByDateRange as lsGetRange,
  upsertCounter as lsUpsert,
  type CounterEntry,
} from "@/lib/storage";

interface CounterData {
  calls: number;
  chats: number;
}

interface DecadeData {
  label: string;
  calls: number;
  chats: number;
  isCurrent: boolean;
}

function todayStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthStart(): string {
  return todayStr().slice(0, 7) + "-01";
}

function getLastDayOfMonth(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return new Date(year, month, 0).getDate();
}

function computeDecades(entries: CounterEntry[]): DecadeData[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  const lastDay = getLastDayOfMonth();

  const ranges: { label: string; start: string; end: string }[] = [
    { label: "1–10", start: `${monthStr}-01`, end: `${monthStr}-10` },
    { label: "11–20", start: `${monthStr}-11`, end: `${monthStr}-20` },
    {
      label: `21–${lastDay}`,
      start: `${monthStr}-21`,
      end: `${monthStr}-${String(lastDay).padStart(2, "0")}`,
    },
  ];

  return ranges.map((range) => {
    const filtered = entries.filter(
      (e) => e.date >= range.start && e.date <= range.end
    );
    const today = todayStr();
    return {
      label: range.label,
      calls: filtered.reduce((s, e) => s + e.calls, 0),
      chats: filtered.reduce((s, e) => s + e.chats, 0),
      isCurrent: today >= range.start && today <= range.end,
    };
  });
}

function getCommColor(total: number): string {
  if (total >= 455) return "text-green-400";
  if (total >= 301) return "text-yellow-400";
  return "text-red-400";
}

function getCallPercentColor(percent: number): string {
  if (percent >= 40) return "text-green-400";
  if (percent >= 30) return "text-yellow-400";
  return "text-red-400";
}

export default function CounterPage() {
  const [counts, setCounts] = useState<CounterData>({ calls: 0, chats: 0 });
  const [monthEntries, setMonthEntries] = useState<CounterEntry[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState<CounterData>({
    calls: 0,
    chats: 0,
  });
  const [loading, setLoading] = useState(true);

  const today = todayStr();
  const localMode = useLocalStorage();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      if (localMode) {
        const todayData = lsGetCounter(today) ?? {
          date: today,
          calls: 0,
          chats: 0,
        };
        const monthData = lsGetRange(getMonthStart(), today);

        setCounts({ calls: todayData.calls, chats: todayData.chats });
        setMonthEntries(monthData);
        setMonthlyTotal({
          calls: monthData.reduce((s, e) => s + e.calls, 0),
          chats: monthData.reduce((s, e) => s + e.chats, 0),
        });
      } else {
        const [todayRes, monthRes] = await Promise.all([
          fetch(`/api/counter?date=${today}`),
          fetch(`/api/counter?startDate=${getMonthStart()}&endDate=${today}`),
        ]);

        const todayData: CounterEntry = await todayRes.json();
        const monthData: CounterEntry[] = await monthRes.json();

        setCounts({ calls: todayData.calls, chats: todayData.chats });
        setMonthEntries(monthData);
        setMonthlyTotal({
          calls: monthData.reduce((s, e) => s + e.calls, 0),
          chats: monthData.reduce((s, e) => s + e.chats, 0),
        });
      }
    } catch {
      toast.error("Не удалось загрузить данные");
    } finally {
      setLoading(false);
    }
  }, [today, localMode]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const refreshMonthData = useCallback(async () => {
    try {
      if (localMode) {
        const monthData = lsGetRange(getMonthStart(), today);
        setMonthEntries(monthData);
        setMonthlyTotal({
          calls: monthData.reduce((s, e) => s + e.calls, 0),
          chats: monthData.reduce((s, e) => s + e.chats, 0),
        });
      } else {
        const monthRes = await fetch(
          `/api/counter?startDate=${getMonthStart()}&endDate=${today}`
        );
        const monthData: CounterEntry[] = await monthRes.json();
        setMonthEntries(monthData);
        setMonthlyTotal({
          calls: monthData.reduce((s, e) => s + e.calls, 0),
          chats: monthData.reduce((s, e) => s + e.chats, 0),
        });
      }
    } catch {
      toast.error("Не удалось загрузить данные");
    }
  }, [today, localMode]);

  const updateCounter = useCallback(
    async (field: "calls" | "chats", delta: number) => {
      const newValue = Math.max(0, counts[field] + delta);
      if (newValue === counts[field]) return;

      setCounts((prev) => ({ ...prev, [field]: newValue }));

      try {
        if (localMode) {
          lsUpsert(
            today,
            field === "calls" ? newValue : counts.calls,
            field === "chats" ? newValue : counts.chats
          );
          await refreshMonthData();
        } else {
          const updated = { ...counts, [field]: newValue };
          const res = await fetch("/api/counter", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date: today, ...updated }),
          });

          if (!res.ok) throw new Error("Ошибка сохранения");

          await refreshMonthData();
        }
      } catch {
        setCounts((prev) => ({ ...prev, [field]: counts[field] }));
      }
    },
    [counts, today, refreshMonthData, localMode]
  );

  const decades = computeDecades(monthEntries);
  const totalComms = monthlyTotal.calls + monthlyTotal.chats;
  const callPercent =
    totalComms > 0 ? (monthlyTotal.calls / totalComms) * 100 : 0;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-9rem)]">
      <section className="px-4 max-[400px]:px-3 pt-16 max-[400px]:pt-10 pb-12 max-[400px]:pb-8 pattern-grid">
        <div className="mx-auto max-w-2xl text-center space-y-5 max-[400px]:space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl max-[400px]:text-2xl font-bold tracking-tight sm:text-5xl md:text-6xl text-balance leading-[1.1]">
            Учёт звонков
            <br />
            <span className="text-primary">и чатов</span>
          </h1>
          <p className="text-lg max-[400px]:text-sm text-muted-foreground/80 max-w-md mx-auto leading-relaxed">
            Нажми + или &mdash; чтобы изменить значения за сегодня
          </p>
        </div>
      </section>

      <section className="-mt-6 px-4 max-[400px]:px-3 pb-12">
        <div className="mx-auto max-w-2xl space-y-5 max-[400px]:space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-both">
          <h2 className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-[0.15em] px-1">
            Сегодня
          </h2>
          <div className="grid gap-4 max-[400px]:gap-3 sm:grid-cols-2">
            <Card className="card-hover tbank-glow rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm max-[400px]:[&_[data-slot=card-content]]:px-3 max-[400px]:[&_[data-slot=card-header]]:px-3">
              <CardHeader>
                <div className="flex items-center gap-3 max-sm:gap-2 max-[400px]:gap-1.5">
                  <div className="flex h-12 w-12 max-sm:h-10 max-sm:w-10 max-[400px]:h-9 max-[400px]:w-9 items-center justify-center rounded-2xl bg-primary/10">
                    <Phone className="h-6 w-6 max-[400px]:h-5 max-[400px]:w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-semibold max-sm:text-base max-[400px]:text-sm">
                    Звонки
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-5xl font-bold tracking-tight text-foreground max-sm:text-4xl">
                  {counts.calls}
                </p>
                <div className="mt-5 max-[400px]:mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 max-[400px]:h-10 max-[400px]:w-10 rounded-2xl border-border/50 bg-white/5 hover:bg-white/10"
                    onClick={() => updateCounter("calls", -1)}
                    disabled={counts.calls === 0}
                  >
                    <Minus className="h-5 w-5 max-[400px]:h-4 max-[400px]:w-4" />
                  </Button>
                  <Button
                    size="icon"
                    className="h-11 w-11 max-[400px]:h-10 max-[400px]:w-10 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all duration-200"
                    onClick={() => updateCounter("calls", 1)}
                  >
                    <Plus className="h-5 w-5 max-[400px]:h-4 max-[400px]:w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover tbank-glow rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm max-[400px]:[&_[data-slot=card-content]]:px-3 max-[400px]:[&_[data-slot=card-header]]:px-3">
              <CardHeader>
                <div className="flex items-center gap-3 max-sm:gap-2 max-[400px]:gap-1.5">
                  <div className="flex h-12 w-12 max-sm:h-10 max-sm:w-10 max-[400px]:h-9 max-[400px]:w-9 items-center justify-center rounded-2xl bg-primary/10">
                    <MessageSquare className="h-6 w-6 max-[400px]:h-5 max-[400px]:w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-semibold max-sm:text-base max-[400px]:text-sm">
                    Чаты
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-5xl font-bold tracking-tight text-foreground max-sm:text-4xl">
                  {counts.chats}
                </p>
                <div className="mt-5 max-[400px]:mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 max-[400px]:h-10 max-[400px]:w-10 rounded-2xl border-border/50 bg-white/5 hover:bg-white/10"
                    onClick={() => updateCounter("chats", -1)}
                    disabled={counts.chats === 0}
                  >
                    <Minus className="h-5 w-5 max-[400px]:h-4 max-[400px]:w-4" />
                  </Button>
                  <Button
                    size="icon"
                    className="h-11 w-11 max-[400px]:h-10 max-[400px]:w-10 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all duration-200"
                    onClick={() => updateCounter("chats", 1)}
                  >
                    <Plus className="h-5 w-5 max-[400px]:h-4 max-[400px]:w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="px-4 max-[400px]:px-3 pb-20 max-[400px]:hidden">
        <div className="mx-auto max-w-2xl space-y-5 max-[400px]:space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
          <h2 className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-[0.15em] px-1">
            Итоги
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="card-hover tbank-glow rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3 max-sm:gap-2">
                  <div className="flex h-12 w-12 max-sm:h-10 max-sm:w-10 items-center justify-center rounded-2xl bg-primary/10">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-semibold max-sm:text-base">
                    Декады
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  {decades.map((d) => (
                    <div
                      key={d.label}
                      className={`flex justify-between items-center pl-3 ${
                        d.isCurrent
                          ? "border-l-2 border-primary/70"
                          : "border-l-2 border-transparent"
                      }`}
                    >
                      <dt className="text-muted-foreground/70 flex items-center gap-2">
                        {d.isCurrent && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        )}
                        <span>{d.label}</span>
                      </dt>
                      <dd
                        className={`text-lg font-bold ${getCommColor(d.calls + d.chats)}`}
                      >
                        {d.calls + d.chats}
                      </dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>

            <Card className="card-hover tbank-glow rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3 max-sm:gap-2">
                  <div className="flex h-12 w-12 max-sm:h-10 max-sm:w-10 items-center justify-center rounded-2xl bg-primary/10">
                    <CalendarDays className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-semibold max-sm:text-base">
                    Месяц
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  <div className="flex justify-between items-center">
                    <dt className="text-muted-foreground/70">Звонки</dt>
                    <dd className="text-lg font-semibold">
                      {monthlyTotal.calls}
                    </dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-muted-foreground/70">Чаты</dt>
                    <dd className="text-lg font-semibold">
                      {monthlyTotal.chats}
                    </dd>
                  </div>
                  <div className="flex justify-between items-center border-t border-border/40 pt-3">
                    <dt className="font-medium text-foreground/80">Всего</dt>
                    <dd className="text-xl font-bold text-primary">
                      {totalComms}
                    </dd>
                  </div>
                  <div className="flex justify-between items-center border-t border-border/40 pt-3">
                    <dt className="font-medium text-foreground/80">Звонки %</dt>
                    <dd
                      className={`text-xl font-bold ${getCallPercentColor(callPercent)}`}
                    >
                      {callPercent.toFixed(1)}%
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
