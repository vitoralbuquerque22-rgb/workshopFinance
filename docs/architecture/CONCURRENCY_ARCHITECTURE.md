# CONCURRENCY ARCHITECTURE

Regras para lidar com processamento paralelo e condições de corrida (Race Conditions).

### 1. Finalização Duplicada de OS (Optimistic Locking)
- **Cenário:** Dois atendentes clicam em "Finalizar OS" simultaneamente ou dão duplo clique.
- **Tratamento:** Utilizar o campo \`status\` como invariante na Transação.
  \`\`\`sql
  UPDATE OrdemServico SET status = 'concluido' WHERE id = 'X' AND status = 'em_andamento';
  \`\`\`
  Se o segundo update falhar (afetou 0 linhas), a transação morre abortando a geração de Títulos duplicados.

### 2. Idempotência de Webhooks e Jobs (BullMQ)
- **Cenário:** Um Job no BullMQ é re-entregue por falha na rede (At-Least-Once Delivery).
- **Tratamento:** Chave de Idempotência baseada no Correlation ID injetada no Redis.
  \`\`\`typescript
  // Worker DDA, E-mails, etc.
  const idempotencyKey = \`processed:\${job.data.outbox_id}\`;
  const exists = await redis.set(idempotencyKey, "1", "NX", "EX", 86400); // Set if Not eXists
  if (!exists) return; // Silent discard
  \`\`\`

### 3. Estoque (Pessimistic Locking / Atomic Increment)
- **Cenário:** Múltiplas Ordens de Serviço dão baixa na mesma Peça no mesmo milissegundo.
- **Tratamento:**
  O \`EstoqueSaldo\` não é a fonte da verdade bruta. A fonte é a tabela de \`MovimentoEstoque\` (Event Sourcing pobre). Porém, para travar estoque negativo:
  \`\`\`sql
  UPDATE Peca SET quantidade = quantidade - 2 WHERE id = 'Y' AND quantidade >= 2;
  \`\`\`
  Se falhar, estoura erro de Estoque Insuficiente.
