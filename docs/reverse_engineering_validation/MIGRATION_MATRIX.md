# MATRIZ DE MIGRAÇÃO

Avaliação aprofundada dos componentes cruciais da plataforma.

| ID | Funcionalidade | Código atual | Dependência Base44 | O que precisa ser preservado | Reimplementação | Prioridade |
| -- | -------------- | ------------ | ------------------ | ---------------------------- | --------------- | ---------- |
| 001 | Criação de API Client / Auth | `AuthContext.jsx` e `base44Client.js` | **CRÍTICA** (`@base44/sdk`) | Comportamento de checagem de estado público e redirecionamento de tela (`auth.me()`, `auth.logout()`). | Trocar para lib `axios` configurada usando Interceptors para Tokens JWT fornecidos pelo novo backend próprio. | P0 |
| 002 | Gestão e Processamento da OS | `base44/functions/manageOs/*` | **CRÍTICA** (Invoca eventos via SDK Backend Serverless) | As regras financeiras (divisão do preço por N parcelas na conclusão da OS), as auditorias em `OsExcluida`, a integração com CRMs nativos. | APIs Node/NestJS usando transações no PostgreSQL para atualizar a OS, Contas e Veículo num único lote seguro. | P1 |
| 003 | Banco de Dados & Entidades | `base44/entities/*.jsonc` | **CRÍTICA** (Geração dinâmica via JSON) | Relacionamentos e lógicas de "campos calculados/referências". Defaults, campos enumerados (status). | Prisma Schema (`schema.prisma`) ou TypeORM descrevendo todas as tabelas rigidamente e gerando migrações SQL reais. | P0 |
| 004 | Automações e Callbacks (Cron) | `base44/workflows/*.jsonc` | ALTA (Triggers de Agendamento) | Agendamento CRON exato de varredura (como o `DDA` diário e `DisparoAgendamentos`). | Filas de processamento Assíncrono. Biblioteca BullMQ (com Redis) ou Serverless nativo da AWS (EventBridge). | P2 |
| 005 | Notificação por E-mail | `manageOs/entry.ts -> SendEmail` | MÉDIA (Pacote de Integração do SDK) | Envio transacional de relatórios de auditoria e exclusão para e-mails dos Admins. | Integração de terceiros: Resend, SendGrid, Amazon SES utilizando SDK próprio da solução e chaves no `.env`. | P3 |
