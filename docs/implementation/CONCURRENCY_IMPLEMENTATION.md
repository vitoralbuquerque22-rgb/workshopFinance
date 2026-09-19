# CONCURRENCY IMPLEMENTATION

O sistema utilizará controle de concorrência nativo misturado. Apenas a cláusula de estado (`status = em_andamento`) não é suficiente para Optimistic Locking robusto.

### Optimistic Locking
O Prisma utilizará um campo `version` em Agregados pesados (ex: `OrdemServico`).
```typescript
const result = await prisma.ordemServico.updateMany({
  where: { 
    id: input.osId, 
    version: expectedVersion, // Lock
    status: 'em_andamento'    // State transition guard
  },
  data: { status: 'concluido', version: { increment: 1 } }
});

if (result.count === 0) throw new ConcurrencyError('Conflito de Concorrência.');
```

### Pessimistic Locking
Destinado estritamente a fluxos onde a contenção é brutal e o Optimistic Locking causaria UX terrível, como controle de quantidade de peças na prateleira (`Peca`).
```sql
SELECT * FROM peca WHERE id = ? FOR UPDATE;
```
