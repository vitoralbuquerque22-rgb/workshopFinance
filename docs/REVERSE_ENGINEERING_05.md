# 18. DEPENDÊNCIAS BASE44

Esta seção é CRÍTICA. O sistema é fortemente dependente do ecossistema Base44.

| Recurso Base44 | Onde utilizado | Finalidade | Impacto | Substituição necessária |
| --- | --- | --- | --- | --- |
| `@base44/sdk` | Frontend (Lib, Hooks, Pages) | Acesso a dados e auth | CRÍTICA | Implementar cliente HTTP próprio |
| `base44/entities` | Backend | Definição de banco de dados e ORM | CRÍTICA | Migrar para PostgreSQL/Prisma |
| `base44/functions` | Backend | Lógica de negócios (Serverless) | CRÍTICA | Reescrever em API REST/GraphQL (ex: Node/NestJS) |
| `base44/workflows` | Backend | Automação e CRON | ALTA | Implementar filas e CRON (ex: BullMQ) |

