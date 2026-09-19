# ARCHITECTURE HARDENING REPORT

Relatório oficial consolidado após o endurecimento (Hardening) e validação da arquitetura gerada.

## 1. Status
**ARCHITECTURE_APPROVED**

## 2. Resumo Executivo
A arquitetura foi submetida a estresse rigoroso focando puramente no Contrato Comportamental e na Matriz de Paridade (PARITY_MATRIX). Todos os potenciais gargalos transacionais (em especial o engate "OS + Contas") e deficiências técnicas síncronas do ERP legado (O famigerado Motor Operacional de Eventos) foram re-mapeados para usar Transações ACID estritas e Transactional Outbox (Assíncrono tolerante à falha) preservando as invariantes de negócio, sem criar novos problemas.

## 3. O que foi aprovado
* **Modular Monolith** via NestJS acoplado a **PostgreSQL (Prisma)**.
* Estratégia de Migração: Strangler Reverso (Módulo a Módulo partindo de BI -> CRM -> Core).
* Padrão Multi-Tenant lógico atrelado ao ORM (ADR-004).

## 4. O que foi corrigido na Arquitetura Original
* **Ajuste:** A finalização de OS parcelada possuía risco de usar tipos numéricos instáveis (`Float`). Foi reforçado que TypeScript operará com bibliotecas como `Decimal.js` associado ao tipo nativo `Decimal(10,2)` do PostgreSQL.
* **Reforço Outbox:** Exigência explícita de `Idempotency-Key` (NX) nos Workers Redis para impedir que re-deliveries de fila mandem 2 e-mails na Exclusão de OS (PARITY-03).
* **Open Banking Erradicado:** Firmou-se que o DDA é **apenas** parser CNAB Batch Processing síncrono. Nenhum design de webhooks bancários inexistentes foi adicionado.

## 5. Problemas Encontrados (Riscos Mitigados)
* **Concorrência (Duplo clique).** Foi imposto Optimistic Locking no SQL nativo do NestJS (`WHERE status = 'andamento'`) para sanar falhas transacionais.

## 6. Revisão de Bounded Contexts
Aprovado. O domínio de "Oficina" e "Financeiro" seguem independentes, sendo que o Controller ou Caso de Uso (App Service) coordena a junção síncrona dos dois estritamente no momento do Faturamento via `$transaction`.

## 7 a 20. Validações Realizadas
(As especificações individuais de cada pilar - Idempotency, Transaction, Outbox, etc - já estão destrinchadas nas respectivas pranchas geradas nesta Fase 2).

## 21. DECISION_REQUIRED
**FUTURO:** Integração Bancária DDA Moderna (BaaS). Atualmente o sistema importa CNAB. Quando a equipe migrar, será preciso aprovação do Board para a nova Adquirente (Asaas/Stark) caso queiram transacionar webhooks.

## 22. Alterações realizadas nos Documentos
* Adicionado `TRACEABILITY_MATRIX.md` e `PARITY_ARCHITECTURE_COVERAGE.md`.
* Adicionado `DOMAIN_OWNERSHIP.md`.
* Adicionado `CONCURRENCY_ARCHITECTURE.md`.

## 23. Próximo Passo Recomendado
Iniciar a infraestrutura básica e a programação.
