# DATABASE BLUEPRINT

- **RDBMS:** PostgreSQL 16+
- **Tenant Isolation:** A coluna `empresa_id` (UUID) é mandante em todas as tabelas, sendo Foreign Key para a tabela raiz `Empresa`.
- **Soft Delete:** Coluna `deleted_at` (Timestamp).
- **Tipagem Financeira:** Substituir `Float` por `DECIMAL(12,2)`.
- **Tabela Outbox:**
  - `id` (UUID)
  - `event_type` (VARCHAR)
  - `aggregate_type` (VARCHAR)
  - `aggregate_id` (UUID)
  - `payload` (JSONB)
  - `status` (ENUM: PENDING, PROCESSED, FAILED)
  - `correlation_id` (UUID)
