# IMPLEMENTATION ROADMAP (REVISADO E CORRIGIDO)

O fluxo obedece estritamente às dependências tecnológicas e arquiteturais, provando a infraestrutura antes da volumetria.

1. **FASE 0 — FOUNDATION:** Setup pnpm, NestJS, Prisma, Infra (Postgres, Redis), CI/CD, Observability, Unit Testing Core (Decimal).
2. **FASE 1 — IDENTITY + MULTI-TENANCY:** Autenticação (Cookies HTTPOnly), RBAC, Configuração global do TenantContext no NestJS.
3. **FASE 2 — FIRST VERTICAL SLICE:** Fluxo real cruzando domínios (Cliente -> Veiculo -> Orçamento -> Aprovação -> OS -> Finalização -> ContaReceber -> Outbox -> Worker -> Idempotency Log). Valida a transação atômica completa e o disparo assíncrono. Testa 100% o PARITY-01 e PARITY-02.
4. **FASE 3 — CRM:** Módulo de Leads (Reaproveitamento) e Atividades.
5. **FASE 4 — OFICINA:** O restante das manutenções, Timeline de OS, Etapas.
6. **FASE 5 — FINANCEIRO CORE:** Baixa de boletos, transações bancárias.
7. **FASE 6 — ESTOQUE + COMPRAS:** Fechamento de dependência material.
8. **FASE 7 — OPERACIONAL:** Dashboards analíticos.
9. **FASE 8 — FISCAL:** Integração NF-e.
10. **FASE 9 — INTEGRAÇÕES:** DDA / Parser CNAB, E-mails terceiros.
11. **FASE 10 — MIGRATION + CUTOVER:** ETL do Base44 para Postgres.
