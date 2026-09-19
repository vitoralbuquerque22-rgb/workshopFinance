# TEST ARCHITECTURE

O foco será garantir que a nova arquitetura cumpra a **PARITY_MATRIX** herdada.
1. **Unit Tests (Vitest):** Cobertura pesada na lógica matemática da regra de parcelamento e fechamento de centavos.
2. **Integration Tests (Testcontainers + PostgreSQL):** Simulação da Transaction finalizando a OS e garantindo que, se houver falha, as Contas a Receber nunca sejam salvas orfãs.
3. **E2E Tests (Playwright):** Reprodução do fluxo visual do atendente aprovando a OS no Frontend Next.js.
