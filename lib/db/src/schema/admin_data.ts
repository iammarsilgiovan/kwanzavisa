import { pgTable, serial, text, numeric, timestamp } from "drizzle-orm/pg-core";

export const orderNotesTable = pgTable("order_notes", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").notNull(),
  note: text("note").notNull(),
  changedBy: text("changed_by").notNull().default("admin"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orderStatusHistoryTable = pgTable("order_status_history", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").notNull(),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  changedBy: text("changed_by").notNull().default("admin"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orderCostsTable = pgTable("order_costs", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").notNull().unique(),
  costKwanza: numeric("cost_kwanza", { precision: 14, scale: 2 }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const clientNotesTable = pgTable("client_notes", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  note: text("note").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const balancesTable = pgTable("balances", {
  id: serial("id").primaryKey(),
  account: text("account").notNull().unique(),
  currency: text("currency").notNull(),
  balance: numeric("balance", { precision: 14, scale: 2 }).notNull().default("0"),
  updatedBy: text("updated_by").notNull().default("admin"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const balanceHistoryTable = pgTable("balance_history", {
  id: serial("id").primaryKey(),
  account: text("account").notNull(),
  currency: text("currency").notNull(),
  previousBalance: numeric("previous_balance", { precision: 14, scale: 2 }),
  newBalance: numeric("new_balance", { precision: 14, scale: 2 }).notNull(),
  updatedBy: text("updated_by").notNull().default("admin"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type OrderNote = typeof orderNotesTable.$inferSelect;
export type OrderStatusHistory = typeof orderStatusHistoryTable.$inferSelect;
export type OrderCost = typeof orderCostsTable.$inferSelect;
export type ClientNote = typeof clientNotesTable.$inferSelect;
export type Balance = typeof balancesTable.$inferSelect;
export type BalanceHistory = typeof balanceHistoryTable.$inferSelect;
