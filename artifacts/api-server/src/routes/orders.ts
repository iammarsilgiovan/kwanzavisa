import { Router, type IRouter } from "express";
import { eq, or, ilike, sql, count, countDistinct, and, gte, lte } from "drizzle-orm";
import { db, ordersTable, orderSequenceTable, orderNotesTable, orderStatusHistoryTable, orderCostsTable } from "@workspace/db";
import {
  CreateOrderBody,
  LookupOrdersQueryParams,
  GetOrderParams,
  AdminListOrdersQueryParams,
  AdminUpdateOrderStatusBody,
  AdminUpdateOrderStatusParams,
  AdminUpdateOrderNoteBody,
  AdminUpdateOrderNoteParams,
  AdminUpdateOrderCostBody,
  AdminUpdateOrderCostParams,
  AdminGetOrderDetailParams,
} from "@workspace/api-zod";

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

function mapOrder(order: typeof ordersTable.$inferSelect) {
  return {
    id: order.id,
    name: order.name,
    email: order.email,
    whatsapp: order.whatsapp,
    service: order.service,
    platform: order.platform ?? null,
    amountUsd: order.amountUsd ? parseFloat(order.amountUsd) : null,
    amountEur: order.amountEur ? parseFloat(order.amountEur) : null,
    amountKwanza: order.amountKwanza ? parseFloat(order.amountKwanza) : null,
    currency: order.currency ?? null,
    description: order.description ?? null,
    destinationCountry: order.destinationCountry ?? null,
    recipientName: order.recipientName ?? null,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    formattedDate: formatDate(order.createdAt),
  };
}

async function generateOrderId(): Promise<{ id: string; sequenceNumber: number }> {
  const year = new Date().getFullYear();
  const result = await db.transaction(async (tx) => {
    const [existing] = await tx.select().from(orderSequenceTable).where(eq(orderSequenceTable.year, year));
    if (existing) {
      const newNumber = existing.lastNumber + 1;
      await tx.update(orderSequenceTable).set({ lastNumber: newNumber }).where(eq(orderSequenceTable.year, year));
      return { sequenceNumber: newNumber };
    } else {
      await tx.insert(orderSequenceTable).values({ year, lastNumber: 1 });
      return { sequenceNumber: 1 };
    }
  });
  const padded = result.sequenceNumber.toString().padStart(4, "0");
  return { id: `KV-${year}-${padded}`, sequenceNumber: result.sequenceNumber };
}

async function getActiveRate(currency: string): Promise<number> {
  const { exchangeRatesTable } = await import("@workspace/db");
  const [latest] = await db
    .select()
    .from(exchangeRatesTable)
    .where(eq(exchangeRatesTable.currency, currency))
    .orderBy(sql`${exchangeRatesTable.createdAt} DESC`)
    .limit(1);
  if (latest) return parseFloat(latest.rate);
  return currency === "USD" ? 952 : 1045;
}

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos", message: parsed.error.message });
    return;
  }
  const data = parsed.data;
  const { id, sequenceNumber } = await generateOrderId();

  let amountUsd: string | undefined;
  let amountKwanza: string | undefined;

  if (data.amount && data.currency) {
    const rate = await getActiveRate(data.currency);
    amountUsd = data.amount.toString();
    amountKwanza = (data.amount * rate).toFixed(2);
  }

  const [order] = await db.insert(ordersTable).values({
    id,
    sequenceNumber,
    name: data.name,
    email: data.email,
    whatsapp: data.whatsapp,
    service: data.service,
    platform: data.platform ?? null,
    amountUsd: amountUsd ?? null,
    amountEur: null,
    amountKwanza: amountKwanza ?? null,
    currency: data.currency ?? null,
    description: data.description ?? null,
    destinationCountry: data.destinationCountry ?? null,
    recipientName: data.recipientName ?? null,
    message: data.message ?? null,
  }).returning();

  await db.insert(orderStatusHistoryTable).values({
    orderId: id,
    fromStatus: null,
    toStatus: "pendente",
    changedBy: "sistema",
  });

  const mapped = mapOrder(order);

  res.status(201).json(mapped);
});

// POST /orders/:id/comprovativo — upload proof of payment (base64 JSON)
router.post("/orders/:id/comprovativo", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { base64Data, fileName, mimeType } = req.body as {
    base64Data?: string;
    fileName?: string;
    mimeType?: string;
  };

  if (!base64Data) {
    res.status(400).json({ error: "base64Data é obrigatório" });
    return;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, rawId));
  if (!order) {
    res.status(404).json({ error: "Pedido não encontrado" });
    return;
  }

  // Store comprovativo note + change status to comprovativo_enviado
  const noteText = `__comprovativo__:${fileName ?? "comprovativo"}:${mimeType ?? "application/octet-stream"}:${base64Data}`;
  await db.insert(orderNotesTable).values({
    orderId: rawId,
    note: noteText,
    changedBy: "cliente",
  });

  await db.update(ordersTable)
    .set({ status: "comprovativo_enviado" })
    .where(eq(ordersTable.id, rawId));

  await db.insert(orderStatusHistoryTable).values({
    orderId: rawId,
    fromStatus: order.status,
    toStatus: "comprovativo_enviado",
    changedBy: "cliente",
  });

  res.json({ ok: true, status: "comprovativo_enviado" });
});

router.get("/orders/lookup", async (req, res): Promise<void> => {
  const params = LookupOrdersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: "Parâmetro 'contact' obrigatório" });
    return;
  }
  const contact = params.data.contact.trim();
  const orders = await db
    .select()
    .from(ordersTable)
    .where(or(ilike(ordersTable.email, contact), ilike(ordersTable.whatsapp, contact)))
    .orderBy(sql`${ordersTable.createdAt} DESC`);

  const completedOrders = orders.filter(o => o.status === "concluido");
  const totalSpentKwanza = completedOrders.reduce((sum, o) => sum + (o.amountKwanza ? parseFloat(o.amountKwanza) : 0), 0);
  const name = orders.length > 0 ? orders[0].name : "";

  res.json({ name, orders: orders.map(mapOrder), totalSpentKwanza });
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, raw));
  if (!order) { res.status(404).json({ error: "Pedido não encontrado" }); return; }
  res.json(mapOrder(order));
});

router.get("/admin/orders", async (req, res): Promise<void> => {
  const params = AdminListOrdersQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: "Parâmetros inválidos" }); return; }

  const { status, service, search, dateFrom, dateTo, page = 1, limit = 20 } = params.data;
  const offset = (page - 1) * limit;

  const conditions: ReturnType<typeof eq>[] = [];
  if (status) conditions.push(eq(ordersTable.status, status));
  if (service) conditions.push(eq(ordersTable.service, service));
  if (dateFrom) conditions.push(gte(ordersTable.createdAt, new Date(dateFrom)));
  if (dateTo) {
    const end = new Date(dateTo);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(ordersTable.createdAt, end));
  }

  let searchCondition: ReturnType<typeof or> | undefined;
  if (search) {
    searchCondition = or(
      ilike(ordersTable.id, `%${search}%`),
      ilike(ordersTable.name, `%${search}%`),
      ilike(ordersTable.email, `%${search}%`),
      ilike(ordersTable.whatsapp, `%${search}%`)
    );
  }

  const baseCondition = conditions.length > 0 ? and(...conditions) : undefined;
  const finalCondition = baseCondition && searchCondition
    ? and(baseCondition, searchCondition)
    : baseCondition || searchCondition;

  const ordersQuery = db.select().from(ordersTable).orderBy(sql`${ordersTable.createdAt} DESC`).limit(limit).offset(offset);
  const countQuery = db.select({ count: count() }).from(ordersTable);

  const [ordersResult, countResult] = await Promise.all([
    finalCondition ? ordersQuery.where(finalCondition) : ordersQuery,
    finalCondition ? countQuery.where(finalCondition) : countQuery,
  ]);

  res.json({ orders: ordersResult.map(mapOrder), total: Number(countResult[0]?.count ?? 0), page, limit });
});

router.get("/admin/orders/:id/detail", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = AdminGetOrderDetailParams.safeParse({ id: raw });
  if (!params.success) { res.status(400).json({ error: "ID inválido" }); return; }

  const [order, notes, history, costRow] = await Promise.all([
    db.select().from(ordersTable).where(eq(ordersTable.id, params.data.id)).then(r => r[0]),
    db.select().from(orderNotesTable).where(eq(orderNotesTable.orderId, params.data.id)).orderBy(sql`${orderNotesTable.createdAt} DESC`).limit(1),
    db.select().from(orderStatusHistoryTable).where(eq(orderStatusHistoryTable.orderId, params.data.id)).orderBy(sql`${orderStatusHistoryTable.createdAt} DESC`),
    db.select().from(orderCostsTable).where(eq(orderCostsTable.orderId, params.data.id)).then(r => r[0]),
  ]);

  if (!order) { res.status(404).json({ error: "Pedido não encontrado" }); return; }

  // Filter out comprovativo notes from the note shown to client
  const visibleNote = notes[0]?.note?.startsWith("__comprovativo__") ? null : (notes[0]?.note ?? null);

  res.json({
    ...mapOrder(order),
    note: visibleNote,
    costKwanza: costRow?.costKwanza ? parseFloat(costRow.costKwanza) : null,
    statusHistory: history.map(h => ({
      fromStatus: h.fromStatus,
      toStatus: h.toStatus,
      changedBy: h.changedBy,
      createdAt: h.createdAt.toISOString(),
      formattedDate: formatDate(h.createdAt),
    })),
  });
});

router.patch("/admin/orders/:id/status", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const paramsResult = AdminUpdateOrderStatusParams.safeParse({ id: rawId });
  if (!paramsResult.success) { res.status(400).json({ error: "ID inválido" }); return; }
  const bodyResult = AdminUpdateOrderStatusBody.safeParse(req.body);
  if (!bodyResult.success) { res.status(400).json({ error: "Status inválido" }); return; }

  const [currentOrder] = await db.select().from(ordersTable).where(eq(ordersTable.id, paramsResult.data.id));
  if (!currentOrder) { res.status(404).json({ error: "Pedido não encontrado" }); return; }

  const [order] = await db.update(ordersTable).set({ status: bodyResult.data.status }).where(eq(ordersTable.id, paramsResult.data.id)).returning();

  await db.insert(orderStatusHistoryTable).values({
    orderId: paramsResult.data.id,
    fromStatus: currentOrder.status,
    toStatus: bodyResult.data.status,
    changedBy: "admin",
  });

  const mapped = mapOrder(order);

  res.json(mapped);
});

router.patch("/admin/orders/:id/note", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const paramsResult = AdminUpdateOrderNoteParams.safeParse({ id: rawId });
  if (!paramsResult.success) { res.status(400).json({ error: "ID inválido" }); return; }
  const bodyResult = AdminUpdateOrderNoteBody.safeParse(req.body);
  if (!bodyResult.success) { res.status(400).json({ error: "Nota inválida" }); return; }

  await db.insert(orderNotesTable).values({
    orderId: paramsResult.data.id,
    note: bodyResult.data.note,
    changedBy: "admin",
  });

  const [order, notes, history, costRow] = await Promise.all([
    db.select().from(ordersTable).where(eq(ordersTable.id, paramsResult.data.id)).then(r => r[0]),
    db.select().from(orderNotesTable).where(eq(orderNotesTable.orderId, paramsResult.data.id)).orderBy(sql`${orderNotesTable.createdAt} DESC`).limit(1),
    db.select().from(orderStatusHistoryTable).where(eq(orderStatusHistoryTable.orderId, paramsResult.data.id)).orderBy(sql`${orderStatusHistoryTable.createdAt} DESC`),
    db.select().from(orderCostsTable).where(eq(orderCostsTable.orderId, paramsResult.data.id)).then(r => r[0]),
  ]);

  if (!order) { res.status(404).json({ error: "Pedido não encontrado" }); return; }

  res.json({
    ...mapOrder(order),
    note: notes[0]?.note ?? null,
    costKwanza: costRow?.costKwanza ? parseFloat(costRow.costKwanza) : null,
    statusHistory: history.map(h => ({
      fromStatus: h.fromStatus,
      toStatus: h.toStatus,
      changedBy: h.changedBy,
      createdAt: h.createdAt.toISOString(),
      formattedDate: formatDate(h.createdAt),
    })),
  });
});

router.patch("/admin/orders/:id/cost", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const paramsResult = AdminUpdateOrderCostParams.safeParse({ id: rawId });
  if (!paramsResult.success) { res.status(400).json({ error: "ID inválido" }); return; }
  const bodyResult = AdminUpdateOrderCostBody.safeParse(req.body);
  if (!bodyResult.success) { res.status(400).json({ error: "Custo inválido" }); return; }

  await db
    .insert(orderCostsTable)
    .values({ orderId: paramsResult.data.id, costKwanza: bodyResult.data.costKwanza.toString() })
    .onConflictDoUpdate({ target: orderCostsTable.orderId, set: { costKwanza: bodyResult.data.costKwanza.toString(), updatedAt: new Date() } });

  const [order, notes, history, costRow] = await Promise.all([
    db.select().from(ordersTable).where(eq(ordersTable.id, paramsResult.data.id)).then(r => r[0]),
    db.select().from(orderNotesTable).where(eq(orderNotesTable.orderId, paramsResult.data.id)).orderBy(sql`${orderNotesTable.createdAt} DESC`).limit(1),
    db.select().from(orderStatusHistoryTable).where(eq(orderStatusHistoryTable.orderId, paramsResult.data.id)).orderBy(sql`${orderStatusHistoryTable.createdAt} DESC`),
    db.select().from(orderCostsTable).where(eq(orderCostsTable.orderId, paramsResult.data.id)).then(r => r[0]),
  ]);

  if (!order) { res.status(404).json({ error: "Pedido não encontrado" }); return; }

  res.json({
    ...mapOrder(order),
    note: notes[0]?.note ?? null,
    costKwanza: costRow?.costKwanza ? parseFloat(costRow.costKwanza) : null,
    statusHistory: history.map(h => ({
      fromStatus: h.fromStatus,
      toStatus: h.toStatus,
      changedBy: h.changedBy,
      createdAt: h.createdAt.toISOString(),
      formattedDate: formatDate(h.createdAt),
    })),
  });
});

router.get("/admin/stats", async (_req, res): Promise<void> => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalResult, clientsResult, statusResult, serviceResult, todayResult, weekResult, monthResult, monthVolumeResult, revenueResult, costResult] = await Promise.all([
    db.select({ count: count() }).from(ordersTable),
    db.select({ count: countDistinct(ordersTable.email) }).from(ordersTable),
    db.select({ status: ordersTable.status, count: count() }).from(ordersTable).groupBy(ordersTable.status),
    db.select({ service: ordersTable.service, count: count() }).from(ordersTable).groupBy(ordersTable.service),
    db.select({ count: count() }).from(ordersTable).where(gte(ordersTable.createdAt, startOfToday)),
    db.select({ count: count() }).from(ordersTable).where(gte(ordersTable.createdAt, startOfWeek)),
    db.select({ count: count() }).from(ordersTable).where(gte(ordersTable.createdAt, startOfMonth)),
    db.select({
      usd: sql<string>`COALESCE(SUM(CASE WHEN currency = 'USD' THEN amount_usd::numeric ELSE 0 END), 0)`,
      kz: sql<string>`COALESCE(SUM(amount_kwanza::numeric), 0)`,
    }).from(ordersTable).where(gte(ordersTable.createdAt, startOfMonth)),
    db.select({ total: sql<string>`COALESCE(SUM(amount_kwanza::numeric), 0)` }).from(ordersTable).where(eq(ordersTable.status, "concluido")),
    db.select({ total: sql<string>`COALESCE(SUM(cost_kwanza::numeric), 0)` }).from(orderCostsTable),
  ]);

  const byStatus: Record<string, number> = {};
  for (const row of statusResult) byStatus[row.status] = Number(row.count);
  const byService: Record<string, number> = {};
  for (const row of serviceResult) byService[row.service] = Number(row.count);

  res.json({
    totalOrders: Number(totalResult[0]?.count ?? 0),
    totalClients: Number(clientsResult[0]?.count ?? 0),
    completedOrders: byStatus["concluido"] ?? 0,
    pendingOrders: byStatus["pendente"] ?? 0,
    totalRevenueKwanza: parseFloat(revenueResult[0]?.total ?? "0"),
    totalCostKwanza: parseFloat(costResult[0]?.total ?? "0"),
    ordersToday: Number(todayResult[0]?.count ?? 0),
    ordersThisWeek: Number(weekResult[0]?.count ?? 0),
    ordersThisMonth: Number(monthResult[0]?.count ?? 0),
    volumeUsdThisMonth: parseFloat(monthVolumeResult[0]?.usd ?? "0"),
    volumeKwanzaThisMonth: parseFloat(monthVolumeResult[0]?.kz ?? "0"),
    ordersByService: byService,
  });
});

router.get("/admin/stats/daily", async (req, res): Promise<void> => {
  const days = parseInt((req.query.days as string) ?? "30", 10);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const result = await db
    .select({
      date: sql<string>`DATE(created_at AT TIME ZONE 'UTC')::text`,
      count: count(),
    })
    .from(ordersTable)
    .where(gte(ordersTable.createdAt, since))
    .groupBy(sql`DATE(created_at AT TIME ZONE 'UTC')`)
    .orderBy(sql`DATE(created_at AT TIME ZONE 'UTC') ASC`);

  const dateMap: Record<string, number> = {};
  for (const row of result) dateMap[row.date] = Number(row.count);

  const daysList: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    daysList.push({ date: dateStr, count: dateMap[dateStr] ?? 0 });
  }

  res.json({ days: daysList });
});

export default router;
