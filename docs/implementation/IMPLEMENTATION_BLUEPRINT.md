# IMPLEMENTATION BLUEPRINT (HARDENED)

## 1. Visão Geral da Arquitetura
O sistema será implementado sob um repositório centralizado (**Monorepo pnpm**) abrigando o Frontend e o Backend sob o padrão **Modular Monolith Event-Driven**.

### 1.1 Stack de Tecnologia Congelada
- **Monorepo:** pnpm workspaces
- **Frontend:** Next.js (React), Tailwind CSS, React Query.
- **Backend API & Workers:** NestJS (TypeScript).
- **RDBMS:** PostgreSQL (Prisma ORM).
- **Assincronia (Outbox/Fila):** Redis + BullMQ (At-Least-Once Delivery).
- **Tipagem Financeira:** Decimal.js + Tipo SQL `NUMERIC(12,2)`.

## 2. Estrutura do Repositório (Repository Blueprint)
```
/
├── apps/
│   ├── web/      # Frontend
│   ├── api/      # Backend Core (NestJS Modular Monolith)
│   └── worker/   # Background Worker Node (BullMQ Handlers, At-Least-Once)
│
├── packages/
│   ├── shared/   # Interfaces e DTOs (Zod)
│   └── database/ # Prisma Schema
└── infra/        # Docker Compose (Postgres, Redis)
```

## 3. Padrão Estrutural (NestJS API)
Cada módulo dentro da API (`apps/api/src/modules/[moduleName]`) adota sub-pastas rígidas:
* `/presentation`: REST Controllers (validação de entrada HTTP).
* `/application`: Use Cases orquestrando Domínio e Interfaces de Infraestrutura. ZERO acoplamento direto com Prisma.
* `/domain`: Entidades puras, Aggregate Roots, Exceções. Proibido Prisma, Redis ou S3.
* `/infrastructure`: Prisma Repositories (Adaptadores de banco de dados).

## 4. Multi-Tenant Foundation
Multi-Tenancy aplicado em camadas (Defense in depth):
1. **Auth Middleware**: Injeta o contexto (Tenant ID).
2. **App / Authorization**: Confirma que o usuário pertence ao Tenant.
3. **Database Guard**: Prisma Extension injetando `empresa_id`.
4. **Futuro:** PostgreSQL Row Level Security (RLS) se a extensão provar furos.

## 5. Event & Outbox Architecture (Realista)
Não usamos "Event Bus Síncrono". Usamos **Transactional Outbox**.
1. Transação atômica atualiza OS e salva na tabela `EventOutbox`.
2. O `Outbox Relay` varre o banco e enfileira no `BullMQ`.
3. Worker consome com semântica **At-Least-Once**. Handlers precisam checar estado ou chave no banco antes de re-executar efeitos destrutivos, usando tabelas de Idempotência.
