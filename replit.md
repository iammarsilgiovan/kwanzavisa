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

## Key Pages

- `/` — Full landing page (Hero, Brands, How It Works, Services, Exchange Simulator, Social Proof, Order Form, Order Tracking, Footer)
- `/admin` — Login do painel admin (password: `kwanza2025admin`)
- `/admin/dashboard` — Dashboard com estatísticas, pedidos recentes, taxa de câmbio rápida
- `/admin/pedidos` — Gestão completa de pedidos (status, custo, notas, histórico)
- `/admin/clientes` — Lista de clientes com vista de detalhe por cliente
- `/admin/cambio` — Gestão de taxas USD/EUR com histórico
- `/admin/relatorios` — Relatórios de receita e volume
- `/admin/saldos` — Acompanhamento de saldos (Angola Bank, AirTM, Wise EUR/USD)

## Architecture

- `artifacts/kwanzavisa/` — React + Vite frontend (served at `/`)
- `artifacts/kwanzavisa-mobile/` — Expo React Native app (served at `/kwanzavisa-mobile`)
- `artifacts/api-server/` — Express backend (served at `/api`)
- `lib/api-spec/openapi.yaml` — OpenAPI contract
- `lib/api-client-react/` — Generated React Query hooks
- `lib/api-zod/` — Generated Zod validation schemas
- `lib/db/` — Drizzle ORM schema and connection

## Mobile App (KwanzaVisa Mobile)

Expo app (React Native) with 4 tabs:

- **Início** — Taxa de câmbio em tempo real, 4 botões de serviço, botão WhatsApp
- **Pedidos** — Novo pedido (formulário completo) e Rastrear (busca por e-mail/WhatsApp)
- **Cartões** — Placeholder para gestão de cartões virtuais (em desenvolvimento)
- **Conta** — Suporte, links, acesso de admin

Admin móvel (acedido via tab Conta → "Acesso Restrito"):
- Login com password `kwanza2025admin`
- Dashboard com estatísticas em tempo real
- Gestão de pedidos (alterar estado, contactar via WhatsApp)
- Taxa de câmbio (visualizar e actualizar)

APK Android: não suportado directamente no Replit — usar EAS Build externamente.
iOS: publicação via Replit Expo Launch.

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
- `pnpm run build` — typecheck + build all packages (used for Railway deploy too)
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Railway Deployment (Single Service)

O frontend e a API são publicados juntos como **um único serviço** no Railway — o Express serve tanto as rotas `/api/*` como os ficheiros estáticos do frontend construído (SPA fallback para todas as outras rotas).

Configuração via `railway.json` na raiz do projecto:
- Build: `pnpm install --frozen-lockfile && pnpm run build` (constrói frontend + API)
- Start: `NODE_ENV=production node --enable-source-maps artifacts/api-server/dist/index.mjs`

Quando `NODE_ENV=production`, `artifacts/api-server/src/app.ts` serve os ficheiros estáticos de `artifacts/kwanzavisa/dist/public` e faz fallback de SPA para rotas não-`/api`. Não é necessário `VITE_API_BASE_URL` — o frontend chama `/api/*` como caminho relativo, pois é servido pelo mesmo serviço.

Variáveis de ambiente obrigatórias no painel do Railway:
- `DATABASE_URL`
- `RESEND_API_KEY`
- `SESSION_SECRET`

O Railway define `PORT` automaticamente; o servidor já lê essa variável.

Passos para deploy:
1. Criar novo projecto no Railway a partir do repositório
2. O Railway detecta o `railway.json` automaticamente (builder Nixpacks)
3. Definir as variáveis de ambiente acima no painel do projecto
4. Deploy — um único link serve tudo (frontend + `/api`)

## Design System

Strictly black and white (Apple-inspired):
- `#FFFFFF` — white background
- `#F5F5F7` — secondary background (Apple gray)
- `#000000` — dark sections
- `#1D1D1F` — primary text
- `#6E6E73` — secondary text
- `#D2D2D7` — borders
- `#FF3B30` — errors only (no other colors)
