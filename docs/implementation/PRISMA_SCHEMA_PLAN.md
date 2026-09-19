# PRISMA SCHEMA PLAN

O schema do banco não vai depender de UUIDs auto-gerados pelo DB `default(uuid())` se o backend (Domain) precisar prever o ID antes do insert.
Exemplo:
```prisma
model OrdemServico {
  id              String   @id // ID fornecido pela Application (ULID ou UUIDv4)
  empresa_id      String
  status          String
  valor_total     Decimal  @db.Decimal(12,2)
  conta_receber_id String? // Ligação circular resolvida no Application
  
  @@index([empresa_id])
}
```
