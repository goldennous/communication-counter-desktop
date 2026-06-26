import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getCounterByDate,
  upsertCounter,
  getCountersByDateRange,
  deleteCounterByDate,
} from "@/lib/models";
import { mockCounters } from "@/lib/mock-data";

const upsertCounterSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  calls: z.number().int().min(0),
  chats: z.number().int().min(0),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const dbAvailable = await isDatabaseAvailable();

  if (startDate && endDate) {
    if (dbAvailable) {
      try {
        const entries = await getCountersByDateRange(startDate, endDate);
        return NextResponse.json(entries);
      } catch (error) {
        console.error("Ошибка получения счетчиков за период:", error);
        return NextResponse.json(
          { error: "Ошибка получения данных из DynamoDB" },
          { status: 500 }
        );
      }
    }

    const filtered = mockCounters.filter(
      (e) => e.date >= startDate && e.date <= endDate
    );
    return NextResponse.json(filtered);
  }

  if (date) {
    if (dbAvailable) {
      try {
        const entry = await getCounterByDate(date);
        return NextResponse.json(entry ?? { date, calls: 0, chats: 0 });
      } catch (error) {
        console.error("Ошибка получения счётчика:", error);
        return NextResponse.json(
          { error: "Ошибка получения данных из DynamoDB" },
          { status: 500 }
        );
      }
    }

    const mock = mockCounters.find((e) => e.date === date);
    return NextResponse.json(mock ?? { date, calls: 0, chats: 0 });
  }

  if (dbAvailable) {
    try {
      const entries = await getCountersByDateRange("2000-01-01", "2099-12-31");
      return NextResponse.json(entries);
    } catch (error) {
      console.error("Ошибка получения всех счетчиков:", error);
      return NextResponse.json(
        { error: "Ошибка получения данных из DynamoDB" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(mockCounters);
}

export async function PUT(request: NextRequest) {
  const dbAvailable = await isDatabaseAvailable();

  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна в статическом режиме" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const parsed = upsertCounterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const entry = await upsertCounter(
      parsed.data.date,
      parsed.data.calls,
      parsed.data.chats
    );

    return NextResponse.json(entry, { status: 200 });
  } catch (error) {
    console.error("Ошибка обновления счётчика:", error);
    return NextResponse.json(
      { error: "Ошибка обновления счётчика" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const dbAvailable = await isDatabaseAvailable();

  if (!date) {
    return NextResponse.json({ error: "Не указана дата" }, { status: 400 });
  }

  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна в статическом режиме" },
      { status: 503 }
    );
  }

  try {
    await deleteCounterByDate(date);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Ошибка удаления счётчика:", error);
    return NextResponse.json(
      { error: "Ошибка удаления счётчика" },
      { status: 500 }
    );
  }
}
