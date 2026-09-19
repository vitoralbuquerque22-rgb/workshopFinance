# CI/CD BLUEPRINT

- **Ferramenta:** GitHub Actions.
- **Workflow:**
  1. `pnpm install`
  2. `pnpm lint && pnpm typecheck`
  3. `pnpm test:unit`
  4. Docker Compose up (DB/Redis) -> `pnpm test:integration`
  5. Merge Block: Falha em qualquer etapa anterior trava a main.
