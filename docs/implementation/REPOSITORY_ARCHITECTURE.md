# REPOSITORY ARCHITECTURE

## Decisão
O projeto será um **Monorepo** gerenciado pelo **pnpm workspaces** (TurboRepo opcional para cache de build futuro).
* **Por quê?** Facilita o compartilhamento de tipos (TypeScript) entre o Frontend (Next.js) e Backend (NestJS), garantindo contratos REST consistentes, além de centralizar configurações de ESLint, Prettier e Prisma.

## Estrutura Inicial
```text
/
├── apps/
│   ├── web/ (Next.js)
│   ├── api/ (NestJS - Modular Monolith)
│   └── worker/ (NestJS Microservice para BullMQ)
├── packages/
│   ├── database/ (Prisma schema e client gerado)
│   ├── shared-types/ (DTOs e tipos comuns Frontend/Backend)
│   └── eslint-config/
├── infra/
│   └── docker-compose.yml (Postgres, Redis)
└── pnpm-workspace.yaml
```

## Domain vs Infrastructure Layering (Dentro do app API)
Cada módulo no NestJS (`apps/api/src/modules/...`) seguirá:
- `domain/`: Entities, Value Objects, Domain Exceptions. Zero dependência de Prisma.
- `application/`: Use Cases (ex: `FinalizarOsUseCase`).
- `infrastructure/`: Implementação dos Repositories (Prisma), Adapters.
- `presentation/`: REST Controllers, Zod DTOs.
