# CLAUDE.md — financeiro-rafa-erp

> Guia completo para agentes de IA trabalhando neste repositório.
> Leia também `AGENTS.md` para instruções de workflow Base44/CLI.

---

## 1. Visão Geral do Projeto

**financeiro-rafa-erp** é um ERP financeiro multi-tenant construído como **monorepo pnpm** com três aplicações e dois pacotes compartilhados.

### Stack Principal
| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 16, React 19, TailwindCSS v4 |
| API / Backend | NestJS 12 (ESM), Passport-JWT, BullMQ |
| Worker | NestJS 12 (ESM), BullMQ, @nestjs/schedule |
| Banco de dados | PostgreSQL 16 via Prisma ORM |
| Fila de mensagens | Redis 7 via BullMQ |
| Pacote gerenciador | pnpm (workspaces) |
| Linguagem | TypeScript 5 (web) / TypeScript 6 (api/worker) |

---

## 2. Estrutura do Monorepo

```
financeiroRafa/
├── apps/
│   ├── api/        # Backend NestJS — REST API (porta 3001)
│   ├── web/        # Frontend Next.js (porta 3000)
│   └── worker/     # Serviço de background NestJS (sem porta HTTP)
├── packages/
│   ├── database/   # Prisma client + schema (@erp/database)
│   └── shared/     # Constantes compartilhadas (@erp/shared)
├── infra/
│   └── docker-compose.yml  # PostgreSQL + Redis local
├── pnpm-workspace.yaml
└── package.json    # Scripts raiz orquestrados com pnpm -r
```

---

## 3. Apps em Detalhe

### 3.1 `apps/api` — REST API
- **Porta:** `3001` (configurável via `PORT` env)
- **Framework:** NestJS 12, modo **ESM** (`"type": "module"`)
- **Linter:** oxlint
- **Testes:** Vitest + Supertest (unit + e2e)
- **Módulos ativos:**
  - `AuthModule` — login, logout, `/auth/me`
  - `HealthController` — endpoint de health check
  - `RequestContextMiddleware` — aplicado globalmente em `*`
  - `GlobalExceptionFilter` — filtro global de erros
- **Auth:** Passport-JWT com cookie `httpOnly` (`erp_session`)
- **CORS:** permite origem `FRONTEND_URL` (default: `http://localhost:3000`), credentials: true

**Endpoints de Auth:**
```
POST /auth/login   — valida email/password, seta cookie JWT
POST /auth/logout  — limpa cookie
GET  /auth/me      — retorna usuário autenticado (JwtAuthGuard)
```

### 3.2 `apps/web` — Frontend Next.js
- **Porta:** `3000`
- **Framework:** Next.js 16, App Router, React 19
- **Styling:** TailwindCSS v4, `lucide-react` para ícones
- **Pacotes internos:** `@erp/shared`
- **Estrutura de rotas:**
  ```
  src/app/
  ├── (auth)/login/      # Página de login (pública)
  ├── (authenticated)/   # Rotas protegidas (layout próprio)
  ├── layout.tsx         # Root layout
  └── page.tsx           # Página raiz (redireciona conforme sessão)
  ```
- **Middleware** (`src/middleware.ts`): protege rotas — redireciona para `/login` sem cookie `erp_session`, redireciona autenticados para `/` se tentarem acessar `/login`
- **Hook `useSession`:** chama `GET /auth/me` com credentials para obter sessão atual

> ⚠️ **Hardcoded URLs:** `login/page.tsx` e `useSession.ts` chamam `http://localhost:3001` diretamente. Em produção isso precisa ser variável de ambiente.

### 3.3 `apps/worker` — Worker de Background
- **Framework:** NestJS 12, modo ESM
- **Sem porta HTTP** — apenas consumidor de fila
- **Módulos:**
  - `OutboxRelayService` — cron a cada **5 segundos**, lê eventos `PENDING` do banco com `FOR UPDATE SKIP LOCKED` e enfileira no BullMQ
  - `SystemEventsProcessor` — consome fila `system-events`, implementa **idempotência via PostgreSQL** (`IdempotencyRecord`)
- **Conexão Redis:** `REDIS_HOST` + `REDIS_PORT` (default: localhost:6379)

---

## 4. Packages Compartilhados

### 4.1 `packages/database` (`@erp/database`)
- **Prisma** com provider PostgreSQL
- URL do banco via `DATABASE_URL` env
- **Modelos:**
  | Model | Descrição |
  |---|---|
  | `Empresa` | Tenant principal (multi-tenant por `empresaId`) |
  | `User` | Usuário vinculado a uma Empresa, com `role` |
  | `EventOutbox` | Outbox Pattern — eventos com status `PENDING/PROCESSING/PROCESSED/FAILED` |
  | `IdempotencyRecord` | Controle de idempotência de jobs do worker |

### 4.2 `packages/shared` (`@erp/shared`)
- `AUTH_COOKIE_NAME = 'erp_session'` — nome do cookie de autenticação compartilhado entre API e Web

---

## 5. Infraestrutura Local

**Serviços via Docker Compose** (`infra/docker-compose.yml`):
```
PostgreSQL 16  — porta 5434 (host) → 5432 (container)
Redis 7        — porta 6379
```

**Volumes nomeados:** `erp_pgdata`, `erp_redisdata`

---

## 6. Comandos Essenciais

### Desenvolvimento
```bash
# Subir infra (PostgreSQL + Redis)
pnpm infra:up

# Rodar todas as apps em paralelo
pnpm dev

# Rodar só o frontend (contra backend hosted)
cd apps/web && npm run dev
```

### Banco de dados
```bash
pnpm db:generate   # gera Prisma client
pnpm db:migrate    # roda migrations
pnpm db:push       # aplica schema sem migration (dev only)
```

### Build / Lint / Testes
```bash
pnpm build              # build de todos os apps
pnpm lint               # lint em todos
pnpm typecheck          # type check em todos
pnpm test               # testes unitários
pnpm test:e2e           # testes e2e
```

### Infra
```bash
pnpm infra:up    # docker-compose up -d
pnpm infra:down  # docker-compose down
```

---

## 7. Variáveis de Ambiente

O `.env` raiz é compartilhado. Variáveis chave:

| Variável | Usado em | Descrição |
|---|---|---|
| `DATABASE_URL` | api, worker, database | URL PostgreSQL |
| `JWT_SECRET` | api | Segredo para assinar tokens JWT |
| `REDIS_HOST` | api, worker | Host do Redis (default: localhost) |
| `REDIS_PORT` | api, worker | Porta do Redis (default: 6379) |
| `PORT` | api | Porta da API (default: 3001) |
| `FRONTEND_URL` | api | URL do frontend para CORS (default: http://localhost:3000) |
| `NODE_ENV` | api | `production` ativa cookies `secure` |

---

## 8. Padrões Arquiteturais

### Multi-tenancy
- Cada request de API carrega `tenantId` (= `empresaId`) no payload JWT
- Todos os dados são filtrados por `tenantId`
- `RequestContextMiddleware` propaga contexto do request

### Outbox Pattern
1. API grava evento em `EventOutbox` com status `PENDING` dentro da mesma transação do domínio
2. `OutboxRelayService` (worker) faz poll a cada 5s com `FOR UPDATE SKIP LOCKED` para evitar race conditions
3. Eventos são publicados no BullMQ com tentativas: 3, backoff exponencial
4. `SystemEventsProcessor` processa com verificação de idempotência via `IdempotencyRecord`

### Autenticação
- JWT armazenado em cookie `httpOnly` (nome: `erp_session`)
- Middleware Next.js verifica presença do cookie para proteger rotas
- API valida o JWT via `JwtAuthGuard` e re-verifica usuário no banco em `/auth/me`

---

## 9. Convenções de Código

- **ESM puro:** imports com extensão `.js` em api e worker (mesmo sendo `.ts`)
- **Testes:** Vitest (não Jest) em todas as apps
- **Linter:** oxlint em api/worker (não ESLint)
- **Formatador:** Prettier (configurado em `.prettierrc`)
- **Imports de workspace:** `@erp/database`, `@erp/shared` (não caminhos relativos)
- **Nomes de tabelas:** snake_case com `@@map()` no Prisma
- **Nomes de campos:** camelCase no código, snake_case no banco via `@map()`

---

## 10. Pontos de Atenção / TODOs Conhecidos

- **URLs hardcoded:** `apps/web` referencia `http://localhost:3001` em dois lugares (`login/page.tsx` e `useSession.ts`) — deve usar variável de ambiente `NEXT_PUBLIC_API_URL`
- **Rotas autenticadas vazias:** `(authenticated)/` tem apenas `layout.tsx`, nenhuma página de dashboard ainda implementada
- **`page.tsx` raiz:** tem 3076 bytes — provavelmente tem lógica de redirecionamento ou landing page, verificar se está atualizada
- **`SystemEventsProcessor`:** simula efeito externo com `setTimeout(500ms)` — precisa ser substituído por lógica real de negócio
- **`IdempotencyRecord.expiresAt`:** campo existe mas não há lógica de cleanup/TTL implementada
- **`next.config.old.mjs`:** arquivo antigo de config sobrevivendo no repo, pode ser removido
