# DEFINITION OF DONE (DoD)

Uma funcionalidade só fecha quando:
1. Regra de Negócio implementada no Domínio (Não no Controller).
2. Transação garantida contra DB se envolver 2+ tabelas.
3. Tratamento de Idempotência.
4. Tipo `Decimal.js` para financeiros.
5. Unit Test (Lógica) + Integration Test (DB).
6. Lint & Typecheck passando sem 'any'.
