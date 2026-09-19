# TENANT IMPLEMENTATION BLUEPRINT (HARDENED)

Defesa em 3 Camadas:

1. **Authentication/Request Context:** JWT carrega `empresa_id`. Middleware `AsyncLocalStorage` propaga a variável na thread.
2. **Application Authorization:** O Use Case garante que o usuário tem role suficiente para mexer naquele Agregado.
3. **Database Constraint (The Wall):** Extensão Prisma injeta compulsoriamente o `empresa_id` de dentro do 'AsyncLocalStorage'.

**Falha de Desenvolvedor mitigada:** Se um dev rodar `prisma.cliente.findMany()` sem passar Where, a extensão do ORM o injetará, evitando vazamento entre Tenants.
PostgreSQL RLS será uma decisão estrutural FUTURA caso o Prisma perca suporte ou a performance degrade.
