import { Router, type IRouter } from "express";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { db, ordersTable, orderCostsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/admin/reports", async (req, res): Promise<void> => {
  const now = new Date();
  const month = parseInt((req.query.month as string) ?? String(now.getMonth() + 1), 10);
  const year = parseInt((req.query.year as string) ?? String(now.getFullYear()), 10);

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const [allOrders, costsResult] = await Promise.all([
    db.select().from(ordersTable).where(and(gte(ordersTable.createdAt, startDate), lte(ordersTable.createdAt, endDate))),
    db
      .select({ orderId: orderCostsTable.orderId, costKwanza: orderCostsTable.costKwanza })
      .from(orderCostsTable)
      .innerJoin(ordersTable, eq(orderCostsTable.orderId, ordersTable.id))
      .where(and(gte(ordersTable.createdAt, startDate), lte(ordersTable.createdAt, endDate))),
  ]);

  const costMap: Record<string, number> = {};
  for (const c of costsResult) costMap[c.orderId] = parseFloat(c.costKwanza ?? "0");

  const completed = allOrders.filter(o => o.status === "concluido");
  const cancelled = allOrders.filter(o => o.status === "cancelado");

  const volumeUsd = allOrders.reduce((s, o) => s + (o.amountUsd ? parseFloat(o.amountUsd) : 0), 0);
  const volumeKwanza = allOrders.reduce((s, o) => s + (o.amountKwanza ? parseFloat(o.amountKwanza) : 0), 0);
  const grossRevenue = completed.reduce((s, o) => s + (o.amountKwanza ? parseFloat(o.amountKwanza) : 0), 0);
  const totalCost = allOrders.reduce((s, o) => s + (costMap[o.id] ?? 0), 0);
  const netProfit = grossRevenue - totalCost;
  const margin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;
  const completionRate = allOrders.length > 0 ? (completed.length / allOrders.length) * 100 : 0;

  const serviceMap: Record<string, { count: number; volumeKwanza: number; revenue: number; cost: number }> = {};
  for (const o of allOrders) {
    if (!serviceMap[o.service]) serviceMap[o.service] = { count: 0, volumeKwanza: 0, revenue: 0, cost: 0 };
    serviceMap[o.service].count++;
    serviceMap[o.service].volumeKwanza += o.amountKwanza ? parseFloat(o.amountKwanza) : 0;
    if (o.status === "concluido") serviceMap[o.service].revenue += o.amountKwanza ? parseFloat(o.amountKwanza) : 0;
    serviceMap[o.service].cost += costMap[o.id] ?? 0;
  }

  const byService = Object.entries(serviceMap).map(([service, data]) => {
    const profit = data.revenue - data.cost;
    const svcMargin = data.revenue > 0 ? (profit / data.revenue) * 100 : 0;
    return { service, count: data.count, volumeKwanza: data.volumeKwanza, revenue: data.revenue, cost: data.cost, profit, margin: svcMargin };
  });

  const weeklyMap: Record<string, { revenue: number; cost: number }> = {};
  for (const o of allOrders) {
    const d = new Date(o.createdAt);
    const weekNum = Math.ceil(d.getDate() / 7);
    const weekKey = `Semana ${weekNum}`;
    if (!weeklyMap[weekKey]) weeklyMap[weekKey] = { revenue: 0, cost: 0 };
    if (o.status === "concluido") weeklyMap[weekKey].revenue += o.amountKwanza ? parseFloat(o.amountKwanza) : 0;
    weeklyMap[weekKey].cost += costMap[o.id] ?? 0;
  }

  const weeklyFinancials = Object.entries(weeklyMap).map(([week, data]) => ({
    week,
    revenue: data.revenue,
    cost: data.cost,
    profit: data.revenue - data.cost,
  }));

  res.json({
    month,
    year,
    totalOrders: allOrders.length,
    completedOrders: completed.length,
    cancelledOrders: cancelled.length,
    completionRate,
    volumeUsd,
    volumeKwanza,
    grossRevenue,
    totalCost,
    netProfit,
    margin,
    byService,
    weeklyFinancials,
  });
});

export default router;
