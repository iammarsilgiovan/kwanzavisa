import { Router, type IRouter } from "express";
import { eq, or, ilike, sql, count, countDistinct } from "drizzle-orm";
import { db, ordersTable, orderSequenceTable } from "@workspace/db";
import {
  CreateOrderBody,
  LookupOrdersQueryParams,
  GetOrderParams,
  AdminListOrdersQueryParams,
  AdminUpdateOrderStatusBody,
  AdminUpdateOrderStatusParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatDate(date: Date): string {
  const months = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
  ];
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
    intlPlatform: order.intlPlatform ?? null,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    formattedDate: formatDate(order.createdAt),
  };
}

async function generateOrderId(): Promise<{ id: string; sequenceNumber: number }> {
  const year = new Date().getFullYear();

  const result = await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(orderSequenceTable)
      .where(eq(orderSequenceTable.year, year));

    if (existing) {
      const newNumber = existing.lastNumber + 1;
      await tx
        .update(orderSequenceTable)
        .set({ lastNumber: newNumber })
        .where(eq(orderSequenceTable.year, year));
      return { sequenceNumber: newNumber };
    } else {
      await tx.insert(orderSequenceTable).values({ year, lastNumber: 1 });
      return { sequenceNumber: 1 };
    }
  });

  const padded = result.sequenceNumber.toString().padStart(4, "0");
  return {
    id: `KV-${year}-${padded}`,
    sequenceNumber: result.sequenceNumber,
  };
}

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos", message: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const { id, sequenceNumber } = await generateOrderId();

  const USD_RATE = 950;
  const EUR_RATE = 1050;

  let amountUsd: string | undefined;
  let amountEur: string | undefined;
  let amountKwanza: string | undefined;

  if (data.amount && data.currency) {
    if (data.currency === "USD") {
      amountUsd = data.amount.toString();
      amountKwanza = (data.amount * USD_RATE).toString();
    } else if (data.currency === "EUR") {
      amountEur = data.amount.toString();
      amountKwanza = (data.amount * EUR_RATE).toString();
    }
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
    amountEur: amountEur ?? null,
    amountKwanza: amountKwanza ?? null,
    currency: data.currency ?? null,
    description: data.description ?? null,
    destinationCountry: data.destinationCountry ?? null,
    recipientName: data.recipientName ?? null,
    intlPlatform: data.intlPlatform ?? null,
    message: data.message ?? null,
  }).returning();

  res.status(201).json(mapOrder(order));
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
    .where(
      or(
        ilike(ordersTable.email, contact),
        ilike(ordersTable.whatsapp, contact),
        ilike(ordersTable.whatsapp, contact.replace(/\s/g, ""))
      )
    )
    .orderBy(sql`${ordersTable.createdAt} DESC`);

  const completedOrders = orders.filter(o => o.status === "concluido");
  const totalSpentKwanza = completedOrders.reduce((sum, o) => {
    return sum + (o.amountKwanza ? parseFloat(o.amountKwanza) : 0);
  }, 0);

  const name = orders.length > 0 ? orders[0].name : "";

  res.json({
    name,
    orders: orders.map(mapOrder),
    totalSpentKwanza,
  });
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetOrderParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, params.data.id));

  if (!order) {
    res.status(404).json({ error: "Pedido não encontrado" });
    return;
  }

  res.json(mapOrder(order));
});

router.get("/admin/orders", async (req, res): Promise<void> => {
  const params = AdminListOrdersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: "Parâmetros inválidos" });
    return;
  }

  const { status, service, page = 1, limit = 20 } = params.data;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (status) conditions.push(eq(ordersTable.status, status));
  if (service) conditions.push(eq(ordersTable.service, service));

  const whereClause = conditions.length > 0
    ? sql`${conditions.reduce((a, b) => sql`${a} AND ${b}`)}`
    : undefined;

  const ordersQuery = db
    .select()
    .from(ordersTable)
    .orderBy(sql`${ordersTable.createdAt} DESC`)
    .limit(limit)
    .offset(offset);

  const countQuery = db
    .select({ count: count() })
    .from(ordersTable);

  const [ordersResult, countResult] = await Promise.all([
    whereClause ? ordersQuery.where(whereClause) : ordersQuery,
    whereClause ? countQuery.where(whereClause) : countQuery,
  ]);

  res.json({
    orders: ordersResult.map(mapOrder),
    total: countResult[0]?.count ?? 0,
    page,
    limit,
  });
});

router.patch("/admin/orders/:id/status", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const paramsResult = AdminUpdateOrderStatusParams.safeParse({ id: rawId });
  if (!paramsResult.success) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const bodyResult = AdminUpdateOrderStatusBody.safeParse(req.body);
  if (!bodyResult.success) {
    res.status(400).json({ error: "Status inválido" });
    return;
  }

  const [order] = await db
    .update(ordersTable)
    .set({ status: bodyResult.data.status })
    .where(eq(ordersTable.id, paramsResult.data.id))
    .returning();

  if (!order) {
    res.status(404).json({ error: "Pedido não encontrado" });
    return;
  }

  res.json(mapOrder(order));
});

router.get("/admin/stats", async (_req, res): Promise<void> => {
  const [totalResult, clientsResult, statusResult, serviceResult] = await Promise.all([
    db.select({ count: count() }).from(ordersTable),
    db.select({ count: countDistinct(ordersTable.email) }).from(ordersTable),
    db.select({ status: ordersTable.status, count: count() }).from(ordersTable).groupBy(ordersTable.status),
    db.select({ service: ordersTable.service, count: count() }).from(ordersTable).groupBy(ordersTable.service),
  ]);

  const revenueResult = await db
    .select({ total: sql<string>`COALESCE(SUM(amount_kwanza::numeric), 0)` })
    .from(ordersTable)
    .where(eq(ordersTable.status, "concluido"));

  const byStatus: Record<string, number> = {};
  for (const row of statusResult) {
    byStatus[row.status] = Number(row.count);
  }

  const byService: Record<string, number> = {};
  for (const row of serviceResult) {
    byService[row.service] = Number(row.count);
  }

  res.json({
    totalOrders: Number(totalResult[0]?.count ?? 0),
    totalClients: Number(clientsResult[0]?.count ?? 0),
    completedOrders: byStatus["concluido"] ?? 0,
    pendingOrders: byStatus["pendente"] ?? 0,
    totalRevenueKwanza: parseFloat(revenueResult[0]?.total ?? "0"),
    ordersByService: byService,
  });
});

export default router;
