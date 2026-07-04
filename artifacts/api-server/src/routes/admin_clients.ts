import { Router, type IRouter } from "express";
import { eq, sql, ilike, or, count } from "drizzle-orm";
import { db, ordersTable, clientNotesTable } from "@workspace/db";
import { AdminUpdateClientNoteBody, AdminUpdateClientNoteParams } from "@workspace/api-zod";

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

router.get("/admin/clients", async (req, res): Promise<void> => {
  const search = req.query.search as string | undefined;

  let ordersQuery = db
    .select({
      email: ordersTable.email,
      name: ordersTable.name,
      whatsapp: ordersTable.whatsapp,
      totalOrders: count(ordersTable.id),
      totalSpentKwanza: sql<string>`COALESCE(SUM(CASE WHEN status = 'concluido' THEN amount_kwanza::numeric ELSE 0 END), 0)`,
      lastOrderDate: sql<string>`MAX(created_at)::text`,
    })
    .from(ordersTable)
    .groupBy(ordersTable.email, ordersTable.name, ordersTable.whatsapp)
    .orderBy(sql`MAX(created_at) DESC`);

  if (search) {
    const searchResult = db
      .select({
        email: ordersTable.email,
        name: ordersTable.name,
        whatsapp: ordersTable.whatsapp,
        totalOrders: count(ordersTable.id),
        totalSpentKwanza: sql<string>`COALESCE(SUM(CASE WHEN status = 'concluido' THEN amount_kwanza::numeric ELSE 0 END), 0)`,
        lastOrderDate: sql<string>`MAX(created_at)::text`,
      })
      .from(ordersTable)
      .where(or(
        ilike(ordersTable.name, `%${search}%`),
        ilike(ordersTable.email, `%${search}%`),
        ilike(ordersTable.whatsapp, `%${search}%`)
      ))
      .groupBy(ordersTable.email, ordersTable.name, ordersTable.whatsapp)
      .orderBy(sql`MAX(created_at) DESC`);

    const clients = await searchResult;
    res.json({
      clients: clients.map(c => ({
        name: c.name,
        email: c.email,
        whatsapp: c.whatsapp,
        totalOrders: Number(c.totalOrders),
        totalSpentKwanza: parseFloat(c.totalSpentKwanza),
        lastOrderDate: c.lastOrderDate ?? null,
      })),
    });
    return;
  }

  const clients = await ordersQuery;
  res.json({
    clients: clients.map(c => ({
      name: c.name,
      email: c.email,
      whatsapp: c.whatsapp,
      totalOrders: Number(c.totalOrders),
      totalSpentKwanza: parseFloat(c.totalSpentKwanza),
      lastOrderDate: c.lastOrderDate ?? null,
    })),
  });
});

router.get("/admin/clients/:email", async (req, res): Promise<void> => {
  const rawEmail = Array.isArray(req.params.email) ? req.params.email[0] : req.params.email;
  const email = decodeURIComponent(rawEmail);

  const [clientOrders, noteRow] = await Promise.all([
    db.select().from(ordersTable).where(eq(ordersTable.email, email)).orderBy(sql`${ordersTable.createdAt} DESC`),
    db.select().from(clientNotesTable).where(eq(clientNotesTable.email, email)).then(r => r[0]),
  ]);

  if (clientOrders.length === 0) {
    res.status(404).json({ error: "Cliente não encontrado" });
    return;
  }

  const firstOrder = clientOrders[clientOrders.length - 1];
  const completedOrders = clientOrders.filter(o => o.status === "concluido");
  const totalSpentKwanza = completedOrders.reduce((sum, o) => sum + (o.amountKwanza ? parseFloat(o.amountKwanza) : 0), 0);

  const serviceCounts: Record<string, number> = {};
  for (const o of clientOrders) serviceCounts[o.service] = (serviceCounts[o.service] ?? 0) + 1;
  const favoriteService = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  res.json({
    name: firstOrder.name,
    email: firstOrder.email,
    whatsapp: firstOrder.whatsapp,
    totalOrders: clientOrders.length,
    completedOrders: completedOrders.length,
    totalSpentKwanza,
    firstOrderDate: firstOrder.createdAt.toISOString(),
    favoriteService,
    note: noteRow?.note ?? null,
    orders: clientOrders.map(mapOrder),
  });
});

router.patch("/admin/clients/:email/note", async (req, res): Promise<void> => {
  const rawEmail = Array.isArray(req.params.email) ? req.params.email[0] : req.params.email;
  const email = decodeURIComponent(rawEmail);

  const paramsResult = AdminUpdateClientNoteParams.safeParse({ email });
  if (!paramsResult.success) { res.status(400).json({ error: "Email inválido" }); return; }

  const bodyResult = AdminUpdateClientNoteBody.safeParse(req.body);
  if (!bodyResult.success) { res.status(400).json({ error: "Nota inválida" }); return; }

  await db
    .insert(clientNotesTable)
    .values({ email, note: bodyResult.data.note })
    .onConflictDoUpdate({ target: clientNotesTable.email, set: { note: bodyResult.data.note, updatedAt: new Date() } });

  const [clientOrders, noteRow] = await Promise.all([
    db.select().from(ordersTable).where(eq(ordersTable.email, email)).orderBy(sql`${ordersTable.createdAt} DESC`),
    db.select().from(clientNotesTable).where(eq(clientNotesTable.email, email)).then(r => r[0]),
  ]);

  if (clientOrders.length === 0) { res.status(404).json({ error: "Cliente não encontrado" }); return; }

  const firstOrder = clientOrders[clientOrders.length - 1];
  const completedOrders = clientOrders.filter(o => o.status === "concluido");
  const totalSpentKwanza = completedOrders.reduce((sum, o) => sum + (o.amountKwanza ? parseFloat(o.amountKwanza) : 0), 0);
  const serviceCounts: Record<string, number> = {};
  for (const o of clientOrders) serviceCounts[o.service] = (serviceCounts[o.service] ?? 0) + 1;
  const favoriteService = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  res.json({
    name: firstOrder.name,
    email: firstOrder.email,
    whatsapp: firstOrder.whatsapp,
    totalOrders: clientOrders.length,
    completedOrders: completedOrders.length,
    totalSpentKwanza,
    firstOrderDate: firstOrder.createdAt.toISOString(),
    favoriteService,
    note: noteRow?.note ?? null,
    orders: clientOrders.map(mapOrder),
  });
});

export default router;
