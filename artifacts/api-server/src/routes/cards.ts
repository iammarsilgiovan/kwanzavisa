import { Router } from "express";
import { db } from "@workspace/db";
import { cardsTable, cardTransactionsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import { blockCard, unblockCard } from "../services/cardProvider";

const router = Router();

router.get("/cards", requireAuth, async (req: AuthRequest, res) => {
  const cards = await db.select({
    id: cardsTable.id,
    last4: cardsTable.last4,
    expiryMonth: cardsTable.expiryMonth,
    expiryYear: cardsTable.expiryYear,
    cardholderName: cardsTable.cardholderName,
    status: cardsTable.status,
    balanceUsd: cardsTable.balanceUsd,
    createdAt: cardsTable.createdAt,
  }).from(cardsTable).where(eq(cardsTable.userId, req.userId!)).orderBy(desc(cardsTable.createdAt));

  res.json({ cards });
});

router.get("/cards/:id", requireAuth, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const [card] = await db.select().from(cardsTable)
    .where(eq(cardsTable.id, id))
    .limit(1);

  if (!card || card.userId !== req.userId!) {
    res.status(404).json({ error: "Cartão não encontrado" });
    return;
  }

  const txns = await db.select().from(cardTransactionsTable)
    .where(eq(cardTransactionsTable.cardId, id))
    .orderBy(desc(cardTransactionsTable.createdAt))
    .limit(20);

  res.json({
    card: {
      ...card,
      transactions: txns,
    },
  });
});

router.post("/cards/:id/toggle-block", requireAuth, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const [card] = await db.select().from(cardsTable).where(eq(cardsTable.id, id)).limit(1);

  if (!card || card.userId !== req.userId!) {
    res.status(404).json({ error: "Cartão não encontrado" });
    return;
  }
  if (card.status === "cancelled") {
    res.status(400).json({ error: "Cartão cancelado não pode ser alterado" });
    return;
  }

  const newStatus = card.status === "active" ? "blocked" : "active";

  if (card.providerCardId) {
    if (newStatus === "blocked") {
      await blockCard(card.providerCardId);
    } else {
      await unblockCard(card.providerCardId);
    }
  }

  await db.update(cardsTable)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(cardsTable.id, id));

  await db.insert(cardTransactionsTable).values({
    cardId: id,
    amount: "0",
    tipo: newStatus === "blocked" ? "block" : "unblock",
    description: newStatus === "blocked" ? "Cartão bloqueado" : "Cartão desbloqueado",
  });

  res.json({ ok: true, status: newStatus });
});

export default router;
