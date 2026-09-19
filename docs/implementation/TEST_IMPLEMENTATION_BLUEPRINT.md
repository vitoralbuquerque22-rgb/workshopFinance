# TEST IMPLEMENTATION BLUEPRINT

- **Unit:** Testes pesados focados na classe de Domínio (ex: `OrdemServico.calcularParcelas(100, 3)`).
- **Integration (Testcontainers):** A classe `FinalizeOsUseCase` será executada chamando o Prisma contra um PostgreSQL real hospedado em Docker na pipeline do GitHub Actions para garantir que a Transação (OS + Outbox + Fatura) commite integralmente.
- **Parity:** A validação será um suite Jest especial nomeado `parity.e2e-spec.ts`.
