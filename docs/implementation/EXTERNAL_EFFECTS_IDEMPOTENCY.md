# EXTERNAL EFFECTS IDEMPOTENCY

Mapeamento de efeitos externos acionados pelo Outbox -> Relay -> BullMQ. 
A premissa absoluta é **AT-LEAST-ONCE DELIVERY**. O Worker PODE rodar mais de uma vez em caso de crash. "Exactly-once" é matematicamente impossível.

| Efeito | Provedor / API | Risco Duplicidade | Tratamento de Idempotência |
| :--- | :--- | :--- | :--- |
| **E-mail (OS Excluída)** | Resend / SES | Moderado | Envio com header idempotente nativo do provedor (se existir) OU `IdempotencyRecord` interno persistido em banco contendo `eventId`. Se já gravado = Discard. |
| **Webhooks DDA / BaaS (Futuro)** | Adquirente | Crítico | Payload assinado, `correlationId` enviado ao parceiro e tabela de log (Dead Letter / Idempotency) no Worker verificada ANTES do `POST`. |
| **WhatsApp Cliente** | API Third Party | Baixo | Tabela de `IdempotencyRecord`. Se o Redis/Worker tentar processar o EventID X novamente, ignora. |
