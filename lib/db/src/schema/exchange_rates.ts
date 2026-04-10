import { pgTable, serial, text, numeric, timestamp } from "drizzle-orm/pg-core";

export const exchangeRatesTable = pgTable("exchange_rates", {
  id: serial("id").primaryKey(),
  currency: text("currency").notNull(),
  rate: numeric("rate", { precision: 12, scale: 2 }).notNull(),
  previousRate: numeric("previous_rate", { precision: 12, scale: 2 }),
  changedBy: text("changed_by").notNull().default("admin"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ExchangeRate = typeof exchangeRatesTable.$inferSelect;
