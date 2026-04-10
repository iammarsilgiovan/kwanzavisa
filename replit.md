# KwanzaVisa

## Overview

KwanzaVisa is an Angolan fintech platform that allows Angolans to access international financial services paying in Kwanzas. Built as a pnpm monorepo with a React + Vite frontend and Express API backend.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS (Apple-inspired black & white design)
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Animation**: Framer Motion
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React
- **Router**: Wouter

## Services & Features

- **Cartão Virtual** — Virtual card generation for international online payments
- **Acesso Assistido** — Customer shops with their own accounts, KwanzaVisa provides payment method
- **Transferência com Liquidação Local** — Cross-border value transfers
- **Abertura de Conta Internacional** — Account opening support (Wise, Bybit, Kast)

## Key Pages

- `/` — Full landing page (Hero, Brands, How It Works, Services, Exchange Simulator, International Accounts, Social Proof, Order Form, Order Tracking, Footer)
- `/admin` — Admin panel (password: `kwanza2025admin`) with order management, status updates, stats

## Architecture

- `artifacts/kwanzavisa/` — React + Vite frontend (served at `/`)
- `artifacts/api-server/` — Express backend (served at `/api`)
- `lib/api-spec/openapi.yaml` — OpenAPI contract
- `lib/api-client-react/` — Generated React Query hooks
- `lib/api-zod/` — Generated Zod validation schemas
- `lib/db/` — Drizzle ORM schema and connection

## Database Schema

- `orders` — Order records (id: KV-YYYY-NNNN format, name, email, whatsapp, service, amounts, status)
- `order_sequence` — Auto-incrementing order number per year

## API Endpoints

- `GET /api/exchange/rate?currency=USD&amount=100` — Exchange rate with margin
- `POST /api/orders` — Create new order
- `GET /api/orders/lookup?contact=email_or_phone` — Customer order history
- `GET /api/orders/:id` — Get specific order
- `GET /api/admin/orders` — Admin: list all orders
- `PATCH /api/admin/orders/:id/status` — Admin: update order status
- `GET /api/admin/stats` — Admin: platform statistics

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Design System

Strictly black and white (Apple-inspired):
- `#FFFFFF` — white background
- `#F5F5F7` — secondary background (Apple gray)
- `#000000` — dark sections
- `#1D1D1F` — primary text
- `#6E6E73` — secondary text
- `#D2D2D7` — borders
- `#FF3B30` — errors only (no other colors)
