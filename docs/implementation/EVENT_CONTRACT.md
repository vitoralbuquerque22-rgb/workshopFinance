# EVENT CONTRACT

```typescript
interface DomainEvent<T = any> {
  eventId: string;           // Serve como Idempotency Key pro Worker
  eventType: string;         // 'OS_FINALIZADA'
  aggregateType: string;     // 'OrdemServico'
  aggregateId: string;
  tenantId: string;
  occurredAt: Date;
  correlationId: string;     // Request tracking trace
  causationId: string;       // Qual evento causou este evento (se aplicável)
  payload: T;                // Somente dados essenciais, sem lixo.
  version: number;           // Esquema do payload (v1)
}
```
