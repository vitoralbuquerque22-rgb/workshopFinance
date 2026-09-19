# PARITY ARCHITECTURE COVERAGE

Validação de que a nova arquitetura consegue suportar 100% dos testes de regressão de negócio (PARITY_MATRIX.md).

| Parity | Arquitetura Suporta? | Transação | Evento | Teste | Risco Residual |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PARITY-01** (Finalização à vista) | SIM | `$transaction` englobando update da OS e insert da ContaReceber com status `recebido`. | `OS_FINALIZADA` (Dispara para BI/Dashboards) | Integration/E2E | Baixo. Garantido via constraint ACID. |
| **PARITY-02** (Finalização Parcelada) | SIM | `$transaction` iterando sobre Array de Contas. A matemática da última parcela rodará no Service da OS antes do commit. | `OS_FINALIZADA` | Unit/Integration | Médio. Risco apenas se o tipo numérico for modelado incorretamente como Float ao invés de Decimal(10,2). |
| **PARITY-03** (Auditoria na Exclusão) | SIM | `$transaction` copiando JSON inteiro para `OsExcluida`, inserindo no Outbox, e então deletando a OS. | `OS_EXCLUIDA` | Integration | Médio. O Worker do BullMQ precisa estar idempotente caso caia ao enviar o E-mail para os Admins. |
