import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, exchangeRatesTable } from "@workspace/db";
import { GetExchangeRateQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

const FALLBACK_USD = 952;
const FALLBACK_EUR = 1045;

async function getActiveRate(currency: string): Promise<number> {
  const [latest] = await db
    .select()
    .from(exchangeRatesTable)
    .where(eq(exchangeRatesTable.currency, currency))
    .orderBy(sql`${exchangeRatesTable.createdAt} DESC`)
    .limit(1);
  if (latest) return parseFloat(latest.rate);
  return currency === "USD" ? FALLBACK_USD : FALLBACK_EUR;
}

router.get("/exchange/rate", async (req, res): Promise<void> => {
  const params = GetExchangeRateQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: "Parâmetros inválidos" });
    return;
  }

  const { currency, amount = 1 } = params.data;
  const ratePerUnit = await getActiveRate(currency);
  const amountKwanza = Math.round(amount * ratePerUnit);

  res.json({
    currency,
    ratePerUnit,
    amount,
    amountKwanza,
    updatedAt: new Date().toISOString(),
  });
});

export default router;
