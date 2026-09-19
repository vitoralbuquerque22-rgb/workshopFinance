# Local Setup

## Pré-requisitos
- Node.js 20+
- pnpm 9+
- Docker & Docker Compose

## Instalação
\`\`\`bash
# 1. Instalar dependências
pnpm install

# 2. Subir infraestrutura (PostgreSQL e Redis)
pnpm infra:up

# 3. Rodar migrações do banco de dados
pnpm db:migrate

# 4. Iniciar servidores
pnpm dev
\`\`\`

## Variáveis de Ambiente
Copie o arquivo \`.env.example\` para \`.env\` e garanta que as credenciais coincidem com as do \`docker-compose.yml\`.

## Testes
\`\`\`bash
pnpm test
pnpm test:integration
pnpm test:e2e
\`\`\`
