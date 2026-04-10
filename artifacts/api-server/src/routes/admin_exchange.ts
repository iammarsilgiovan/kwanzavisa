import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, exchangeRatesTable } from "@workspace/db";
import { AdminSetExchangeRateBody } from "@workspace/api-zod";

const router: IRouter = Router();

function formatDate(date: Date): string {
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const d = date.getDate().toString().padStart(2, "0");
  const m = months[date.getMonth()];
  const y = date.getFullYear();
  const h = date.getHours().toString().padStart(2, "0");
  const min = date.getMinutes().toString().padStart(2, "0");
  return `${d} ${m} ${y}, ${h}:${min}`;
}

function mapRate(r: typeof exchangeRatesTable.$inferSelect) {
  return {
    id: r.id,
    currency: r.currency,
    rate: parseFloat(r.rate),
    previousRate: r.previousRate ? parseFloat(r.previousRate) : null,
    changedBy: r.changedBy,
    createdAt: r.createdAt.toISOString(),
    formattedDate: formatDate(r.createdAt),
  };
}

router.get("/admin/exchange-rates", async (_req, res): Promise<void> => {
  const [latestUsd, latestEur, history] = await Promise.all([
    db.select().from(exchangeRatesTable).where(eq(exchangeRatesTable.currency, "USD")).orderBy(sql`${exchangeRatesTable.createdAt} DESC`).limit(1),
    db.select().from(exchangeRatesTable).where(eq(exchangeRatesTable.currency, "EUR")).orderBy(sql`${exchangeRatesTable.createdAt} DESC`).limit(1),
    db.select().from(exchangeRatesTable).orderBy(sql`${exchangeRatesTable.createdAt} DESC`).limit(50),
  ]);

  const lastEntry = history[0];

  res.json({
    activeUsd: latestUsd[0] ? parseFloat(latestUsd[0].rate) : null,
    activeEur: latestEur[0] ? parseFloat(latestEur[0].rate) : null,
    lastUpdated: lastEntry ? lastEntry.createdAt.toISOString() : null,
    lastUpdatedBy: lastEntry ? lastEntry.changedBy : null,
    history: history.map(mapRate),
  });
});

router.put("/admin/exchange-rates", async (req, res): Promise<void> => {
  const parsed = AdminSetExchangeRateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos" });
    return;
  }

  const { currency, rate, changedBy = "admin" } = parsed.data;

  const [prev] = await db
    .select()
    .from(exchangeRatesTable)
    .where(eq(exchangeRatesTable.currency, currency))
    .orderBy(sql`${exchangeRatesTable.createdAt} DESC`)
    .limit(1);

  const [newRate] = await db
    .insert(exchangeRatesTable)
    .values({
      currency,
      rate: rate.toString(),
      previousRate: prev ? prev.rate : null,
      changedBy,
    })
    .returning();

  res.json(mapRate(newRate));
});

export default router;
