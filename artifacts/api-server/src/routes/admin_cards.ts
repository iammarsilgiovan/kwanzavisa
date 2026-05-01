import { Router } from "express";
import { randomUUID } from "crypto";
import { db } from "@workspace/db";
import { cardsTable, cardTransactionsTable, ordersTable, usersTable, kycStatusTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { createCardholder, createCard, fundCard } from "../services/cardProvider";

const router = Router();

router.post("/admin/orders/:id/issue-card", async (req, res) => {
  const { id: orderId } = req.params;
  const { issuedBy } = req.body as { issuedBy?: string };

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
  if (!order) { res.status(404).json({ error: "Pedido não encontrado" }); return; }

  const [user] = await db.select().from(usersTable)
    .where(eq(usersTable.email, order.email.toLowerCase()))
    .limit(1);
  if (!user) { res.status(400).json({ error: "Utilizador não encontrado para este pedido. O cliente tem de ter conta." }); return; }

  const [kycStatus] = await db.select({ status: kycStatusTable.status })
    .from(kycStatusTable).where(eq(kycStatusTable.userId, user.id)).limit(1);
  if (kycStatus?.status !== "approved") {
    res.status(400).json({ error: "KYC do utilizador não está aprovado" });
    return;
  }

  const existing = await db.select({ id: cardsTable.id })
    .from(cardsTable)
    .where(and(eq(cardsTable.orderId, orderId), eq(cardsTable.userId, user.id)))
    .limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Este pedido já tem cartão emitido" });
    return;
  }

  const cardholderId = await createCardholder(user.nome, user.email);
  const providerCard = await createCard(cardholderId);

  const cardId = randomUUID();
  await db.insert(cardsTable).values({
    id: cardId,
    userId: user.id,
    orderId,
    providerCardId: providerCard.providerCardId,
    last4: providerCard.last4,
    expiryMonth: providerCard.expiryMonth,
    expiryYear: providerCard.expiryYear,
    cardNumberEncrypted: providerCard.cardNumber,
    cvvEncrypted: providerCard.cvv,
    cardholderName: user.nome.toUpperCase(),
    status: "active",
    balanceUsd: "0",
    issuedBy: issuedBy ?? "admin",
  });

  res.json({
    ok: true,
    card: { id: cardId, last4: providerCard.last4, expiryMonth: providerCard.expiryMonth, expiryYear: providerCard.expiryYear },
  });
});

router.post("/admin/cards/:id/fund", async (req, res) => {
  const { id } = req.params;
  const { amountUsd, description } = req.body as { amountUsd: number; description?: string };

  if (!amountUsd || amountUsd <= 0) {
    res.status(400).json({ error: "amountUsd inválido" });
    return;
  }

  const [card] = await db.select().from(cardsTable).where(eq(cardsTable.id, id)).limit(1);
  if (!card) { res.status(404).json({ error: "Cartão não encontrado" }); return; }
  if (card.status !== "active") { res.status(400).json({ error: "Cartão não está activo" }); return; }

  if (card.providerCardId) {
    await fundCard(card.providerCardId, amountUsd);
  }

  const newBalance = (parseFloat(card.balanceUsd ?? "0") + amountUsd).toFixed(2);

  await db.update(cardsTable)
    .set({ balanceUsd: newBalance, updatedAt: new Date() })
    .where(eq(cardsTable.id, id));

  await db.insert(cardTransactionsTable).values({
    cardId: id,
    amount: amountUsd.toFixed(2),
    tipo: "fund",
    description: description ?? `Carregamento de ${amountUsd} USD`,
  });

  res.json({ ok: true, newBalance, card: { id, last4: card.last4 } });
});

router.get("/admin/cards", async (_req, res) => {
  const cards = await db.select({
    id: cardsTable.id,
    userId: cardsTable.userId,
    orderId: cardsTable.orderId,
    last4: cardsTable.last4,
    cardholderName: cardsTable.cardholderName,
    status: cardsTable.status,
    balanceUsd: cardsTable.balanceUsd,
    expiryMonth: cardsTable.expiryMonth,
    expiryYear: cardsTable.expiryYear,
    issuedBy: cardsTable.issuedBy,
    createdAt: cardsTable.createdAt,
  }).from(cardsTable).orderBy(cardsTable.createdAt);

  res.json({ cards });
});

export default router;
