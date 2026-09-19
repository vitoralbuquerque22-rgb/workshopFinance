# ADR-004: Prisma Middleware para Multi-Tenancy

**Status:** Aceito
**Decisão:** Utilizar Prisma Extensions para forçar globalmente o parâmetro `empresa_id` nos `wheres` e `creates` da aplicação, evitando que programadores esqueçam o filtro.
