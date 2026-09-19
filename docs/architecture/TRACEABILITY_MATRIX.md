# TRACEABILITY MATRIX

Mapeamento ponta-a-ponta garantindo que nenhuma regra de negócio essencial se perca na nova arquitetura.

| Regra de Negócio | Documento Fonte | Bounded Context | Aggregate | Use Case | Transação | Evento (Outbox) | Teste Relacionado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Arredondamento da Última Parcela | CRITICAL_BUSINESS_RULES (RULE-001) | Financeiro | ContaReceber | Gerar Parcelas OS | SIM | OS_FINALIZADA | PARITY-02 |
| OS concluída obriga `conta_receber_id` | CRITICAL_BUSINESS_RULES (RULE-002) | Oficina / Financeiro | OrdemServico | Finalizar OS | SIM | OS_FINALIZADA | PARITY-01 |
| Exclusão com Snapshot frio obrigatório | CRITICAL_BUSINESS_RULES (RULE-003) | Auditoria | OsExcluida | Excluir OS | SIM | OS_EXCLUIDA | PARITY-03 |
| Reaproveitamento de Lead na Recusa | CRITICAL_BUSINESS_RULES (RULE-004) | CRM | Lead | Reprovar Orçamento | SIM | ORCAMENTO_REPROVADO | Integração (CRM) |
| Casamento exato CNAB DDA | SYSTEM_BEHAVIOR_CONTRACT | Financeiro | ContaPagar | Processar Retorno DDA | SIM | DDA_PROCESSADO | Unitário (Parser) |
