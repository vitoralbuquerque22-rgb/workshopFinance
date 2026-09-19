# OBSERVABILITY

- **Logs:** Pino Logger formatado em JSON. Envio para ELK Stack ou Datadog.
- **Correlation ID:** Um UUID gerado pelo Middleware do NestJS no ato da requisição. Toda camada subjacente, inclusive o Worker do BullMQ, receberá e logará este Correlation ID, rastreando a OS desde o clique no Frontend até a geração do Boleto no DDA.
