# LOCAL DEVELOPMENT

Desenvolvedores usarão:
```bash
docker-compose -f infra/docker-compose.yml up -d
```
O arquivo providenciará Postgres 16 e Redis. O App rodará localmente no host usando `pnpm dev` (Turborepo) para HMR (Hot Module Replacement) rápido sem a lentidão do Docker para Node.js.
