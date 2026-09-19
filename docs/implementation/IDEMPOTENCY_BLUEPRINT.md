# IDEMPOTENCY BLUEPRINT (HARDENED)

NÃO depender exclusivamente do Redis (`SETNX`) para operações financeiras persistentes. O Redis é volátil.

### Tabela: `IdempotencyRecord` no PostgreSQL
```sql
CREATE TABLE idempotency_record (
  idempotency_key VARCHAR(255) PRIMARY KEY,
  tenant_id UUID NOT NULL,
  operation VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL, -- PENDING, COMPLETED, FAILED
  response_body JSONB,
  created_at TIMESTAMP,
  expires_at TIMESTAMP
);
```

**Uso Síncrono (Webhooks/Mutações de UI):**
O Interceptor/Guard consulta a tabela via chave idempotente. Se encontrar `COMPLETED`, responde imediatamente com o `response_body` sem tocar no Use Case.

**Uso Assíncrono (Worker BullMQ):**
Worker inicia abrindo transação: `INSERT INTO idempotency_record (idempotency_key) VALUES (event.id) ON CONFLICT DO NOTHING`. Se falhar no conflito, a notificação/evento JÁ FOI processada antes. DESCARTA o processamento (mitigando re-delivery).
