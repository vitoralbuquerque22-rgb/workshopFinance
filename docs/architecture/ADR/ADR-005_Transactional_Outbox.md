# ADR-005: Padrão Transactional Outbox

**Status:** Aceito
**Contexto:** Ao finalizar OS, o sistema deve disparar notificação, mover estoque e criar CRM lead. A chamada síncrona causa downtime se o CRM cair. 
**Decisão:** Implementar tabela `EventOutbox`. A mesma transaction de banco que salva a OS, insere o evento no Outbox. Um Poller ou CDC lê e manda para o BullMQ (Redis).
**Consequência:** Garantia de Entrega (At-Least-Once). Os listeners devem ser obrigatoriamente Idempotentes.
