# DATA ARCHITECTURE

## Banco de Dados Principal: PostgreSQL
O esquema será gerenciado via **Prisma ORM**, garantindo segurança de tipos (Type Safety).

## Estrutura Multi-Tenant
Toda entidade pertencente a um cliente final possuirá `empresa_id` e `filial_id`.
O Prisma Client utilizará Extensões (Prisma Client Extensions) para injetar RLs (Row Level Security no lado da aplicação) filtrando automaticamente por tenant baseado no escopo do request.

## Soft Delete & Auditoria
- Não há exclusão física nas tabelas Core (exceto via scripts de manutenção de GDPR/LGPD).
- Utilização de campos `deleted_at` indexados.
- A exclusão de OS manterá a regra homologada de Snapshot na tabela `OsExcluida`.
