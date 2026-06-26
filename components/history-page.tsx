"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Phone,
  MessageSquare,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useLocalStorage } from "@/lib/tauri";
import {
  getCountersByDateRange as lsGetRange,
  upsertCounter as lsUpsert,
  deleteCounterByDate as lsDelete,
  type CounterEntry,
} from "@/lib/storage";

const MONTH_NAMES = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

const DAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function formatMonthDate(year: number, month: number): string {
  return `${MONTH_NAMES[month]} ${year}`;
}

function monthStart(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-01`;
}

function monthEnd(year: number, month: number): string {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}

function isToday(year: number, month: number, day: number): boolean {
  const t = new Date();
  return (
    t.getFullYear() === year && t.getMonth() === month && t.getDate() === day
  );
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  const months = [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
  ];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export default function HistoryPageClient() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [entries, setEntries] = useState<CounterEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editCalls, setEditCalls] = useState(0);
  const [editChats, setEditChats] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const localMode = useLocalStorage();

  const entriesByDate = new Map<string, CounterEntry>();
  for (const e of entries) {
    entriesByDate.set(e.date, e);
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const fetchMonth = useCallback(
    async (y: number, m: number) => {
      setLoading(true);
      try {
        const start = monthStart(y, m);
        const end = monthEnd(y, m);

        if (localMode) {
          const data = lsGetRange(start, end);
          setEntries(data);
        } else {
          const res = await fetch(
            `/api/counter?startDate=${start}&endDate=${end}`
          );
          const data: CounterEntry[] = await res.json();
          setEntries(data);
        }
      } catch {
        toast.error("Не удалось загрузить данные");
        setEntries([]);
      } finally {
        setLoading(false);
      }
    },
    [localMode]
  );

  useEffect(() => {
    fetchMonth(year, month);
  }, [year, month, fetchMonth]);

  const prevMonth = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const openEdit = (dateStr: string, entry: CounterEntry) => {
    setSelectedDate(dateStr);
    setEditCalls(entry.calls);
    setEditChats(entry.chats);
  };

  const closeEdit = () => {
    setSelectedDate(null);
    setEditCalls(0);
    setEditChats(0);
  };

  const handleSave = async () => {
    if (!selectedDate) return;
    setIsSaving(true);
    const id = toast.loading("Сохраняем...");

    try {
      if (localMode) {
        lsUpsert(selectedDate, editCalls, editChats);
        toast.success("Сохранено", { id });
        closeEdit();
        await fetchMonth(year, month);
      } else {
        const res = await fetch("/api/counter", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: selectedDate,
            calls: editCalls,
            chats: editChats,
          }),
        });

        if (!res.ok) throw new Error("Ошибка сохранения");

        toast.success("Сохранено", { id });
        closeEdit();
        await fetchMonth(year, month);
      }
    } catch {
      toast.error("Не удалось сохранить", { id });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDate) return;
    setIsSaving(true);
    const id = toast.loading("Удаляем...");

    try {
      if (localMode) {
        lsDelete(selectedDate);
        toast.success("Удалено", { id });
        closeEdit();
        await fetchMonth(year, month);
      } else {
        const res = await fetch(`/api/counter?date=${selectedDate}`, {
          method: "DELETE",
        });

        if (!res.ok) throw new Error("Ошибка удаления");

        toast.success("Удалено", { id });
        closeEdit();
        await fetchMonth(year, month);
      }
    } catch {
      toast.error("Не удалось удалить", { id });
    } finally {
      setIsSaving(false);
    }
  };

  const days: { day: number; entry: CounterEntry | undefined }[] = [];
  for (let i = 0; i < offset; i++) {
    days.push({ day: 0, entry: undefined });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    days.push({ day: d, entry: entriesByDate.get(dateStr) });
  }

  return (
    <div className="min-h-[calc(100vh-9rem)]">
      <section className="px-4 max-[400px]:px-3 pt-16 max-[400px]:pt-10 pb-12 max-[400px]:pb-8 pattern-grid">
        <div className="mx-auto max-w-2xl text-center space-y-5 max-[400px]:space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl max-[400px]:text-2xl font-bold tracking-tight sm:text-5xl md:text-6xl text-balance leading-[1.1]">
            Календарь
            <br />
            <span className="text-primary">звонков и чатов</span>
          </h1>
          <p className="text-lg max-[400px]:text-sm text-muted-foreground/80 max-w-md mx-auto leading-relaxed">
            Просматривай данные за каждый день
          </p>
        </div>
      </section>

      <section className="-mt-6 px-4 max-[400px]:px-3 pb-20">
        <div className="mx-auto max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-both">
          <Card className="card-hover tbank-glow rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 max-[400px]:h-8 max-[400px]:w-8 rounded-xl border-border/50 bg-white/5 hover:bg-white/10"
                  onClick={prevMonth}
                >
                  <ChevronLeft className="h-5 w-5 max-[400px]:h-4 max-[400px]:w-4" />
                </Button>
                <CardTitle className="text-xl max-[400px]:text-sm font-bold text-foreground">
                  {formatMonthDate(year, month)}
                </CardTitle>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 max-[400px]:h-8 max-[400px]:w-8 rounded-xl border-border/50 bg-white/5 hover:bg-white/10"
                  onClick={nextMonth}
                >
                  <ChevronRight className="h-5 w-5 max-[400px]:h-4 max-[400px]:w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-7 gap-1.5 max-sm:gap-1 max-[400px]:gap-0.5 mb-2">
                    {DAY_NAMES.map((name) => (
                      <div
                        key={name}
                        className="text-center text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider py-1"
                      >
                        {name}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1.5 max-sm:gap-1 max-[400px]:gap-0.5">
                    {days.map((d, i) => {
                      if (d.day === 0) {
                        return <div key={`empty-${i}`} />;
                      }
                      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
                      const isTodayDay = isToday(year, month, d.day);
                      return (
                        <div
                          key={dateStr}
                          className={`relative rounded-2xl max-[400px]:rounded-xl border p-2 max-sm:p-1 max-[400px]:p-0.5 max-sm:min-h-[60px] max-[400px]:min-h-[36px] min-h-[72px] transition-all duration-200 ${
                            isTodayDay
                              ? "border-primary/60 bg-primary/5 shadow-sm shadow-primary/10"
                              : d.entry
                                ? "border-border/40 bg-card hover:bg-white/5 cursor-pointer hover:border-border/60"
                                : "border-transparent"
                          }`}
                          onClick={() => {
                            if (d.entry) {
                              openEdit(dateStr, d.entry);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (
                              d.entry &&
                              (e.key === "Enter" || e.key === " ")
                            ) {
                              e.preventDefault();
                              openEdit(dateStr, d.entry);
                            }
                          }}
                          tabIndex={d.entry ? 0 : undefined}
                          role={d.entry ? "button" : undefined}
                          aria-label={
                            d.entry
                              ? `${d.day} число — звонков: ${d.entry.calls}, чатов: ${d.entry.chats}. Нажми для редактирования`
                              : undefined
                          }
                        >
                          <span
                            className={`text-xs max-[400px]:text-[10px] font-semibold ${
                              isTodayDay
                                ? "text-primary"
                                : "text-muted-foreground/60"
                            }`}
                          >
                            {d.day}
                          </span>
                          {d.entry && (
                            <div className="mt-1.5 max-[400px]:mt-0 space-y-1 max-[400px]:space-y-0">
                              <div className="flex items-center gap-1 max-sm:gap-0 text-[11px] max-[400px]:text-[9px] text-muted-foreground/70">
                                <Phone className="h-3 w-3 text-primary max-sm:hidden" />
                                <span className="font-medium">
                                  {d.entry.calls}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 max-sm:gap-0 text-[11px] max-[400px]:text-[9px] text-muted-foreground/70">
                                <MessageSquare className="h-3 w-3 text-primary/70 max-sm:hidden" />
                                <span className="font-medium">
                                  {d.entry.chats}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <Dialog
        open={selectedDate !== null}
        onOpenChange={(open) => {
          if (!open) closeEdit();
        }}
      >
        <DialogContent className="bg-card border-border/50 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              {selectedDate ? formatDateDisplay(selectedDate) : ""}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground/70">
              Измени значения звонков и чатов или удали запись
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-primary shrink-0" />
              <Input
                type="number"
                min={0}
                value={editCalls}
                onChange={(e) =>
                  setEditCalls(Math.max(0, parseInt(e.target.value) || 0))
                }
                disabled={isSaving}
                aria-label="Звонки"
                className="rounded-xl border-border/50 bg-white/5"
              />
            </div>
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-primary/70 shrink-0" />
              <Input
                type="number"
                min={0}
                value={editChats}
                onChange={(e) =>
                  setEditChats(Math.max(0, parseInt(e.target.value) || 0))
                }
                disabled={isSaving}
                aria-label="Чаты"
                className="rounded-xl border-border/50 bg-white/5"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSaving || selectedDate === null}
              className="rounded-xl"
            >
              <Trash2 className="h-4 w-4" />
              Удалить
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all duration-200"
            >
              <Pencil className="h-4 w-4" />
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
