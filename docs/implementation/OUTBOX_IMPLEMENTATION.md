# OUTBOX IMPLEMENTATION (HARDENED)

NÃO É UM EVENT BUS IMEDIATO. É armazenamento seguro (Store and Forward).

### Tabela `EventOutbox`
Campos:
- `id` (UUID)
- `tenant_id` (UUID)
- `event_type` (VARCHAR)
- `aggregate_type` (VARCHAR)
- `aggregate_id` (UUID)
- `payload` (JSONB)
- `status` (PENDING, PROCESSING, PROCESSED, FAILED, DEAD_LETTER)
- `correlation_id` (UUID)
- `created_at` (TIMESTAMP)

### O Relay Assíncrono
Roda num loop cronjobizado (Worker):
```sql
SELECT * FROM event_outbox WHERE status = 'PENDING' ORDER BY created_at LIMIT 100 FOR UPDATE SKIP LOCKED;
```
Após ler, atualiza para `PROCESSED` (ou delega pro BullMQ e atualiza). 
