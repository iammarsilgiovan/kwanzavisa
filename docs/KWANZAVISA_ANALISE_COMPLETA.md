# KwanzaVisa — Documento Completo da Plataforma (para análise profunda)

> Este documento reúne toda a arquitectura, funcionalidades, esquema de base de dados e código estrutural da plataforma KwanzaVisa, para ser usado como prompt/contexto numa análise técnica aprofundada (auditoria, revisão de arquitectura, IA externa, etc).

---

## 1. Visão Geral do Produto

**KwanzaVisa** é uma fintech angolana que permite a angolanos aceder a serviços financeiros internacionais, pagando em Kwanzas (Kz). A plataforma resolve o problema de acesso a pagamentos internacionais (cartões, compras online, transferências) num país com restrições cambiais.

### Serviços oferecidos (3 activos)

1. **Cartão Virtual** — Geração de um cartão virtual internacional para pagamentos online. Entregue via WhatsApp em minutos.
2. **Acesso Assistido** — O cliente faz a compra com a sua própria conta; a KwanzaVisa fornece o método de pagamento (cartão).
3. **Transferência com Liquidação Local** — Transferência de valores entre países: o cliente paga em Kz, o destinatário recebe na moeda local do país de destino.

> Nota: um 4º serviço ("Abertura de Conta Internacional" — Wise/Bybit/Kast) foi **removido completamente** da plataforma (código, base de dados, UI, e-mails). Não existe mais em nenhuma camada do sistema.

---

## 2. Arquitectura Técnica

Monorepo pnpm com os seguintes pacotes:

```
artifacts/
  kwanzavisa/         → Frontend React + Vite (site público + painel admin), servido em "/"
  api-server/         → Backend Express 5 (API REST), servido em "/api"
lib/
  api-spec/           → Contrato OpenAPI (fonte única da verdade dos endpoints)
  api-client-react/   → Hooks React Query gerados automaticamente (Orval)
  api-zod/            → Schemas de validação Zod gerados automaticamente (Orval)
  db/                 → Esquema Drizzle ORM + ligação PostgreSQL
```

### Stack tecnológico

| Camada | Tecnologia |
|---|---|
| Frontend | React + Vite + Tailwind CSS (design Apple-like, preto e branco) |
| Router | Wouter |
| Formulários | React Hook Form + Zod |
| Animações | Framer Motion |
| Ícones | Lucide React |
| Backend | Express 5 |
| Validação | Zod (`zod/v4`) + `drizzle-zod` |
| Base de dados | PostgreSQL + Drizzle ORM |
| Codegen API | Orval (a partir de `openapi.yaml`) |
| Build | esbuild (bundle CJS) |
| Logging | Pino (`req.log` / `logger`, nunca `console.log`) |

Anteriormente existia também uma app móvel Expo/React Native (`kwanzavisa-mobile`) com funcionalidades espelhadas (pedidos, rastreamento, admin móvel); **este artefacto foi removido** do workspace na sessão mais recente — a plataforma actual é apenas web (frontend público + painel admin) e API.

---

## 3. Funcionalidades por Área

### 3.1 Site público (`/`)

- **Hero** — proposta de valor, CTA "Começar agora"
- **Marcas/parceiros** (secção de confiança)
- **Como funciona** — 4 passos (Escolhe o serviço → Simula o câmbio → Submete o pedido → Confirmação via WhatsApp)
- **Grid de Serviços** — os 3 serviços activos, cada um com ícone, título e descrição
- **Simulador de câmbio** — calculadora USD → Kwanza em tempo real, com margem cambial
- **Prova social / Estatísticas** — pedidos concluídos (1.200+), clientes satisfeitos (850+), dias por semana (7), serviços globais (3)
- **Formulário de pedido** — nome, e-mail, WhatsApp, serviço, valor, moeda, descrição, país de destino, destinatário, mensagem
- **Rastreamento de pedido** — pesquisa por e-mail ou WhatsApp, mostra histórico de pedidos do cliente com estado, valores e ID (`KV-YYYY-NNNN`)
- **Footer**

### 3.2 Painel administrativo (`/admin`)

Autenticação por password (`kwanza2025admin`).

| Página | Funcionalidade |
|---|---|
| `/admin` | Login |
| `/admin/dashboard` | Estatísticas gerais, pedidos recentes, taxa de câmbio rápida |
| `/admin/pedidos` | Gestão completa de pedidos: alterar estado, editar custo (Kz), adicionar notas, ver histórico de alterações, filtros (estado, serviço, pesquisa, datas), paginação |
| `/admin/clientes` | Lista de clientes agregados por e-mail, vista de detalhe por cliente (histórico de pedidos + notas internas) |
| `/admin/cambio` | Gestão da taxa de câmbio USD, com histórico de alterações |
| `/admin/relatorios` | Relatórios financeiros e operacionais (receita, volume, por mês/ano) |
| `/admin/saldos` | Acompanhamento de saldos internos (Angola Bank, AirTM, Wise EUR/USD) com histórico de movimentos |

### 3.3 Funcionalidades de backend "além do MVP" (existentes no esquema/API mas não expostas publicamente no site actual)

O backend já possui infraestrutura pronta para um sistema de **contas de utilizador, KYC e cartões geridos**, que hoje corre em paralelo ao fluxo simples de pedidos:

- **Autenticação** — registo/login por e-mail e password (`/auth/register`, `/auth/login`, `/auth/me`)
- **KYC (Know Your Customer)** — upload de documentos (BI frente/verso, selfie), submissão para revisão, estado (`not_submitted | pending | approved | rejected`), revisão manual por admin
- **Cartões (Cards)** — emissão de cartão associado a um pedido, listagem/detalhe de cartões do utilizador, bloqueio/desbloqueio, carregamento de saldo (fund) por admin, histórico de transacções do cartão

Estas funcionalidades têm rotas e schemas Zod completos no backend, mas não têm ainda UI pública ligada no site (candidatas a próxima fase de desenvolvimento — ex: "área de cliente").

---

## 4. Esquema Completo da Base de Dados (PostgreSQL + Drizzle ORM)

14 tabelas activas:

### `users`
| Coluna | Tipo | Notas |
|---|---|---|
| id | text (PK) | |
| nome | text NOT NULL | |
| email | text NOT NULL UNIQUE | |
| telefone | text | |
| password_hash | text | |
| provider | text NOT NULL DEFAULT 'email' | |
| email_verified | boolean NOT NULL DEFAULT false | |
| created_at | timestamptz NOT NULL DEFAULT now() | |

### `orders`
| Coluna | Tipo | Notas |
|---|---|---|
| id | text (PK) | formato `KV-YYYY-NNNN` |
| sequence_number | integer NOT NULL | |
| name | text NOT NULL | |
| email | text NOT NULL | |
| whatsapp | text NOT NULL | |
| service | text NOT NULL | enum: `cartao_virtual`, `acesso_assistido`, `transferencia` |
| platform | text | nullable |
| amount_usd | numeric(12,2) | nullable |
| amount_eur | numeric(12,2) | nullable |
| amount_kwanza | numeric(14,2) | nullable |
| currency | text | nullable, enum: `USD` |
| description | text | nullable |
| destination_country | text | nullable |
| recipient_name | text | nullable |
| message | text | nullable |
| status | text NOT NULL DEFAULT 'pendente' | |
| created_at | timestamptz NOT NULL DEFAULT now() | |

### `order_sequence`
| Coluna | Tipo |
|---|---|
| id | serial (PK) |
| year | integer NOT NULL |
| last_number | integer NOT NULL DEFAULT 0 |

### `order_notes`
| Coluna | Tipo |
|---|---|
| id | serial (PK) |
| order_id | text NOT NULL |
| note | text NOT NULL |
| changed_by | text NOT NULL DEFAULT 'admin' |
| created_at | timestamptz NOT NULL DEFAULT now() |

### `order_status_history`
| Coluna | Tipo |
|---|---|
| id | serial (PK) |
| order_id | text NOT NULL |
| from_status | text |
| to_status | text NOT NULL |
| changed_by | text NOT NULL DEFAULT 'admin' |
| created_at | timestamptz NOT NULL DEFAULT now() |

### `order_costs`
| Coluna | Tipo |
|---|---|
| id | serial (PK) |
| order_id | text NOT NULL UNIQUE |
| cost_kwanza | numeric(14,2) |
| updated_at | timestamptz NOT NULL DEFAULT now() |

### `client_notes`
| Coluna | Tipo |
|---|---|
| id | serial (PK) |
| email | text NOT NULL UNIQUE |
| note | text NOT NULL DEFAULT '' |
| updated_at | timestamptz NOT NULL DEFAULT now() |

### `exchange_rates`
| Coluna | Tipo |
|---|---|
| id | serial (PK) |
| currency | text NOT NULL |
| rate | numeric(12,2) NOT NULL |
| previous_rate | numeric(12,2) |
| changed_by | text NOT NULL DEFAULT 'admin' |
| created_at | timestamptz NOT NULL DEFAULT now() |

### `balances`
| Coluna | Tipo |
|---|---|
| id | serial (PK) |
| account | text NOT NULL UNIQUE | ex: `angola_bank`, `airtm`, `wise_eur`, `wise_usd` |
| currency | text NOT NULL |
| balance | numeric(14,2) NOT NULL DEFAULT 0 |
| updated_by | text NOT NULL DEFAULT 'admin' |
| updated_at | timestamptz NOT NULL DEFAULT now() |

### `balance_history`
| Coluna | Tipo |
|---|---|
| id | serial (PK) |
| account | text NOT NULL |
| currency | text NOT NULL |
| previous_balance | numeric(14,2) |
| new_balance | numeric(14,2) NOT NULL |
| updated_by | text NOT NULL DEFAULT 'admin' |
| created_at | timestamptz NOT NULL DEFAULT now() |

### `kyc_documents`
| Coluna | Tipo |
|---|---|
| id | serial (PK) |
| user_id | text NOT NULL → FK `users.id` (cascade) |
| tipo | text NOT NULL | `bi_frente` \| `bi_verso` \| `selfie` |
| base64_data | text NOT NULL |
| file_name | text |
| mime_type | text |
| created_at | timestamptz NOT NULL DEFAULT now() |

### `kyc_status`
| Coluna | Tipo |
|---|---|
| user_id | text (PK) → FK `users.id` (cascade) |
| status | text NOT NULL DEFAULT 'not_submitted' | `not_submitted` \| `pending` \| `approved` \| `rejected` |
| reviewed_by | text |
| reviewed_at | timestamptz |
| reject_reason | text |
| updated_at | timestamptz NOT NULL DEFAULT now() |

### `cards`
| Coluna | Tipo |
|---|---|
| id | text (PK) |
| user_id | text NOT NULL → FK `users.id` (cascade) |
| order_id | text | nullable |
| provider_card_id | text | nullable |
| last4 | text NOT NULL |
| expiry_month | integer NOT NULL |
| expiry_year | integer NOT NULL |
| card_number_encrypted | text | nullable |
| cvv_encrypted | text | nullable |
| cardholder_name | text NOT NULL |
| status | text NOT NULL DEFAULT 'active' | `active` \| `blocked` \| `cancelled` |
| balance_usd | numeric(12,2) NOT NULL DEFAULT 0 |
| issued_by | text | nullable |
| created_at | timestamptz NOT NULL DEFAULT now() |
| updated_at | timestamptz NOT NULL DEFAULT now() |

### `card_transactions`
| Coluna | Tipo |
|---|---|
| id | serial (PK) |
| card_id | text NOT NULL → FK `cards.id` (cascade) |
| amount | numeric(12,2) NOT NULL |
| merchant | text | nullable |
| tipo | text NOT NULL DEFAULT 'fund' | `fund` \| `debit` \| `credit` \| `block` \| `unblock` |
| description | text | nullable |
| created_at | timestamptz NOT NULL DEFAULT now() |

### Relações (FKs)

```
cards.user_id           → users.id     (cascade)
kyc_documents.user_id   → users.id     (cascade)
kyc_status.user_id      → users.id     (cascade, PK)
card_transactions.card_id → cards.id   (cascade)
```

`orders`, `order_notes`, `order_status_history`, `order_costs` referenciam `order_id` como texto solto (sem FK formal — ligação lógica pelo ID `KV-YYYY-NNNN`).

---

## 5. Contrato de API Completo (`lib/api-spec/openapi.yaml`)

Base URL: `/api`. Todos os endpoints são tipados via OpenAPI 3.1, com Zod (server) e React Query (frontend) gerados automaticamente.

### `health`
- `GET /healthz` — health check

### `orders` (público)
- `POST /orders` — criar pedido (`OrderInput` → `Order`)
- `GET /orders/lookup?contact=` — histórico de pedidos por e-mail/WhatsApp
- `GET /orders/{id}` — detalhe de um pedido

### `exchange` (público)
- `GET /exchange/rate?currency=USD&amount=` — taxa de câmbio com margem

### `admin` (painel administrativo)
- `GET /admin/orders` — listar pedidos (filtros: status, service, search, dateFrom, dateTo, page, limit)
- `PATCH /admin/orders/{id}/status` — actualizar estado do pedido
- `PATCH /admin/orders/{id}/note` — actualizar nota do pedido
- `PATCH /admin/orders/{id}/cost` — actualizar custo (Kz) do pedido
- `GET /admin/orders/{id}/detail` — detalhe completo (nota + custo + histórico)
- `GET /admin/stats` — estatísticas da plataforma
- `GET /admin/stats/daily?days=` — contagem diária de pedidos
- `GET /admin/exchange-rates` — taxas actuais + histórico
- `PUT /admin/exchange-rates` — definir nova taxa
- `GET /admin/clients?search=` — lista de clientes
- `GET /admin/clients/{email}` — detalhe de cliente
- `PATCH /admin/clients/{email}/note` — actualizar nota do cliente
- `GET /admin/reports?month=&year=` — relatório financeiro/operacional
- `GET /admin/balances` — saldos actuais
- `PUT /admin/balances/{account}` — actualizar saldo de uma conta
- `GET /admin/kyc?status=` — listar pedidos KYC
- `GET /admin/kyc/{userId}/documents` — ver documentos KYC de um utilizador
- `POST /admin/kyc/{userId}/review` — aprovar/rejeitar KYC
- `POST /admin/orders/{id}/issue-card` — emitir cartão para um pedido
- `GET /admin/cards` — listar todos os cartões
- `PUT /admin/cards/{id}/fund` — carregar saldo num cartão

### `auth` (contas de utilizador)
- `POST /auth/register` — registar conta
- `POST /auth/login` — login
- `GET /auth/me` — perfil autenticado (bearer token)

### `kyc` (utilizador autenticado)
- `POST /kyc/upload` — upload de documento KYC
- `POST /kyc/submit` — submeter KYC para revisão
- `GET /kyc/status` — estado do KYC

### `cards` (utilizador autenticado)
- `GET /cards` — listar cartões do utilizador
- `GET /cards/{id}` — detalhe do cartão
- `POST /cards/{id}/toggle-block` — bloquear/desbloquear cartão

---

## 6. Estrutura de Código do Backend (`artifacts/api-server/src`)

```
index.ts                 → entrypoint (lê PORT, arranca o servidor)
app.ts                   → configuração Express (middlewares, rotas)
lib/logger.ts            → logger Pino singleton
routes/
  index.ts               → agrega todos os routers
  health.ts               (11 linhas)
  orders.ts               (503 linhas) — CRUD de pedidos, lookup, admin de pedidos
  exchange.ts             (41 linhas)  — taxa de câmbio pública
  auth.ts                 (70 linhas)  — registo/login/perfil
  kyc.ts                  (98 linhas)  — upload/submissão/estado KYC (utilizador)
  cards.ts                (87 linhas)  — cartões do utilizador
  admin_clients.ts        (180 linhas) — gestão de clientes
  admin_exchange.ts       (75 linhas)  — gestão de taxas de câmbio
  admin_reports.ts        (88 linhas)  — relatórios
  admin_balances.ts       (112 linhas) — gestão de saldos internos
  admin_kyc.ts            (99 linhas)  — revisão KYC (admin)
  admin_cards.ts          (115 linhas) — emissão/gestão de cartões (admin)
services/
  email.ts                (245 linhas) — envio de e-mails transaccionais (Resend)
  cardProvider.ts         (66 linhas)  — abstração do fornecedor de cartões virtuais
```

Padrões usados:
- Toda a validação de entrada usa os schemas Zod gerados a partir do OpenAPI (`@workspace/api-zod`), nunca validação manual.
- Logging estruturado via `req.log` (por pedido) e `logger` singleton (fora do ciclo de pedido); `console.log` é proibido no código de servidor.
- Base de dados acedida via Drizzle ORM (`@workspace/db`), com queries type-safe (`eq`, `and`, `or`, `ilike`, `gte`, `lte`, `count`, `countDistinct`).

### E-mails transaccionais (`services/email.ts`)

Enviados via Resend API, cobrindo:
- Confirmação de pedido criado (cliente)
- Notificação de novo pedido (admin)
- Notificação de mudança de estado (ex: "Pago", "Concluído") para o cliente

---

## 7. Estrutura de Código do Frontend (`artifacts/kwanzavisa/src`)

```
pages/
  Home.tsx                → landing page completa (hero, serviços, simulador, formulário, rastreamento, footer)
  Admin.tsx               → login do painel admin
  not-found.tsx           → página 404
  admin/
    Dashboard.tsx          → estatísticas + pedidos recentes + taxa rápida
    Pedidos.tsx            → gestão completa de pedidos
    ClientesList.tsx       → lista de clientes
    ClienteDetail.tsx      → detalhe de cliente
    Cambio.tsx             → gestão de taxas de câmbio
    Relatorios.tsx         → relatórios
    Saldos.tsx             → saldos internos
components/
  AdminLayout.tsx          → layout partilhado do painel admin (sidebar, navegação)
  ui/                      → biblioteca de componentes base (botões, inputs, cards, etc — shadcn-style)
```

Consumo de API: hooks gerados via `@workspace/api-client-react` (React Query), nunca `fetch` manual directo a `/api/...`.

---

## 8. Sistema de Design

Estritamente preto e branco (inspirado na Apple):

| Cor | Uso |
|---|---|
| `#FFFFFF` | fundo branco |
| `#F5F5F7` | fundo secundário (cinza Apple) |
| `#000000` | secções escuras |
| `#1D1D1F` | texto primário |
| `#6E6E73` | texto secundário |
| `#D2D2D7` | bordas |
| `#FF3B30` | apenas erros (nenhuma outra cor usada) |

---

## 9. Dados Reais Actuais na Base de Dados

- Pedidos existentes: 2 (`KV-2026-0001`, `KV-2026-0002`), ambos sem qualquer relação com o serviço removido.
- Nenhum registo em `orders` usa o serviço `conta_internacional` (já não existe como valor válido).
- Coluna `intl_platform` foi removida fisicamente da tabela `orders`.

---

## 10. Comandos-chave do Projecto

```bash
pnpm run typecheck                                   # typecheck completo do monorepo
pnpm run build                                        # typecheck + build de tudo
pnpm run build:vercel                                  # build apenas do frontend (deploy estático)
pnpm --filter @workspace/api-spec run codegen         # regenerar hooks/schemas a partir do OpenAPI
pnpm --filter @workspace/db run push                  # aplicar alterações de esquema (dev)
pnpm --filter @workspace/api-server run dev           # correr a API localmente
```

---

## 11. Pontos de Atenção para Análise

1. **Duplicação de fluxos**: existe um fluxo simples de "pedidos" (público, sem conta) e um fluxo mais avançado de "contas + KYC + cartões" (autenticado) que ainda não está ligado à UI pública. Vale a pena decidir se estes fluxos vão convergir ou coexistir.
2. **Segurança de dados sensíveis**: `card_number_encrypted` e `cvv_encrypted` existem na tabela `cards` — confirmar que a encriptação/gestão de chaves está correctamente implementada antes de qualquer uso em produção real com dados de cartão verdadeiros.
3. **Autenticação do admin**: actualmente por password única partilhada (`kwanza2025admin`), sem utilizador/sessão individual — ponto a rever para produção.
4. **App móvel**: removida nesta sessão; se for necessário retomar, o histórico de código está nos checkpoints anteriores do projecto.
5. **Sem testes automatizados** identificados no repositório — toda a verificação é manual/typecheck.

---

*Documento gerado automaticamente a partir do estado actual do código-fonte e da base de dados em produção/desenvolvimento (04 de Julho de 2026).*
