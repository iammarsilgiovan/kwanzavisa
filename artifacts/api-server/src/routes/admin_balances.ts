import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, balancesTable, balanceHistoryTable, exchangeRatesTable } from "@workspace/db";
import { AdminUpdateBalanceBody, AdminUpdateBalanceParams } from "@workspace/api-zod";

const router: IRouter = Router();

const ACCOUNTS = [
  { account: "angola_bank", currency: "AOA", label: "Conta Bancária Angola" },
  { account: "airtm_usd", currency: "USD", label: "Conta Airtm" },
  { account: "wise_usd", currency: "USD", label: "Conta Wise (USD)" },
];

function formatDate(date: Date): string {
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const d = date.getDate().toString().padStart(2, "0");
  const m = months[date.getMonth()];
  const y = date.getFullYear();
  const h = date.getHours().toString().padStart(2, "0");
  const min = date.getMinutes().toString().padStart(2, "0");
  return `${d} ${m} ${y}, ${h}:${min}`;
}

async function ensureDefaultBalances(): Promise<void> {
  for (const acct of ACCOUNTS) {
    await db
      .insert(balancesTable)
      .values({ account: acct.account, currency: acct.currency, balance: "0" })
      .onConflictDoNothing();
  }
}

router.get("/admin/balances", async (_req, res): Promise<void> => {
  await ensureDefaultBalances();

  const [balances, history, usdRate] = await Promise.all([
    db.select().from(balancesTable).orderBy(balancesTable.id),
    db.select().from(balanceHistoryTable).orderBy(sql`${balanceHistoryTable.createdAt} DESC`).limit(50),
    db.select().from(exchangeRatesTable).where(eq(exchangeRatesTable.currency, "USD")).orderBy(sql`${exchangeRatesTable.createdAt} DESC`).limit(1),
  ]);

  const activeUsdRate = usdRate[0] ? parseFloat(usdRate[0].rate) : 952;

  let totalKwanza = 0;
  for (const b of balances) {
    const bal = parseFloat(b.balance);
    if (b.currency === "AOA") totalKwanza += bal;
    else if (b.currency === "USD") totalKwanza += bal * activeUsdRate;
  }

  res.json({
    balances: balances.map(b => ({
      account: b.account,
      currency: b.currency,
      balance: parseFloat(b.balance),
      updatedBy: b.updatedBy,
      updatedAt: b.updatedAt.toISOString(),
      formattedDate: formatDate(b.updatedAt),
    })),
    history: history.map(h => ({
      account: h.account,
      currency: h.currency,
      previousBalance: h.previousBalance ? parseFloat(h.previousBalance) : null,
      newBalance: parseFloat(h.newBalance),
      updatedBy: h.updatedBy,
      createdAt: h.createdAt.toISOString(),
      formattedDate: formatDate(h.createdAt),
    })),
    totalKwanza,
  });
});

router.put("/admin/balances/:account", async (req, res): Promise<void> => {
  const rawAccount = Array.isArray(req.params.account) ? req.params.account[0] : req.params.account;
  const paramsResult = AdminUpdateBalanceParams.safeParse({ account: rawAccount });
  if (!paramsResult.success) { res.status(400).json({ error: "Conta inválida" }); return; }
  const bodyResult = AdminUpdateBalanceBody.safeParse(req.body);
  if (!bodyResult.success) { res.status(400).json({ error: "Dados inválidos" }); return; }

  await ensureDefaultBalances();

  const [current] = await db.select().from(balancesTable).where(eq(balancesTable.account, paramsResult.data.account));
  const previousBalance = current ? current.balance : null;

  const [updated] = await db
    .insert(balancesTable)
    .values({ account: paramsResult.data.account, currency: bodyResult.data.currency, balance: bodyResult.data.balance.toString(), updatedBy: bodyResult.data.updatedBy ?? "admin" })
    .onConflictDoUpdate({
      target: balancesTable.account,
      set: { balance: bodyResult.data.balance.toString(), currency: bodyResult.data.currency, updatedBy: bodyResult.data.updatedBy ?? "admin", updatedAt: new Date() },
    })
    .returning();

  await db.insert(balanceHistoryTable).values({
    account: paramsResult.data.account,
    currency: bodyResult.data.currency,
    previousBalance: previousBalance,
    newBalance: bodyResult.data.balance.toString(),
    updatedBy: bodyResult.data.updatedBy ?? "admin",
  });

  res.json({
    account: updated.account,
    currency: updated.currency,
    balance: parseFloat(updated.balance),
    updatedBy: updated.updatedBy,
    updatedAt: updated.updatedAt.toISOString(),
    formattedDate: formatDate(updated.updatedAt),
  });
});

export default router;
