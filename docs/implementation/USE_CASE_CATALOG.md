# USE CASE CATALOG

| Use Case | Contexto | Aggregate | Entrada | Saída | Transaction | Evento Outbox |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Finalizar OS** | Oficina | OrdemServico | id, condicao, descontos | OS Completa + Boletos | SIM | OS_FINALIZADA |
| **Excluir OS** | Auditoria | OsExcluida | id, justificativa | void | SIM | OS_EXCLUIDA |
| **Reprovar Orcamento** | CRM / Oficina | OrdemServico | id, motivo | Lead DTO | SIM | ORCAMENTO_REPROVADO |
| **Gerar Contas Receber**| Financeiro | ContaReceber | valor, parcelas, os_id | Array<ContaReceber> | SIM (Injetada) | - |
| **Processar DDA** | Financeiro | ContaPagar | CNAB string | IntegrationLog | SIM (Por Titulo)| DDA_PROCESSADO |
