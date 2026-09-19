# IMPLEMENTATION ROADMAP

- **Fase 0 (Foundation):** Setup da base PostgreSQL, Prisma Schema baseado em `base44/entities`, Configuração Docker e NestJS Core.
- **Fase 1 (Identity & Cadastro):** Autenticação nova (HTTPOnly Cookies), Cadastros de Empresa, Filial, Usuários e RBAC.
- **Fase 2 (CRM):** Reescrita dos Leads, conversão manual de recusa.
- **Fase 3 (Oficina / OS Core):** O Coração do sistema. Fluxo de aprovação e execução.
- **Fase 4 (Financeiro Parcial):** Geração de Contas a Receber fortemente ligada à Finalização da OS (com transações ACID).
- **Fase 5 (Assincronia e DDA):** Workers BullMQ para varredura de DDA/CNAB e disparo de E-mails/Automações de Timeline.
- **Fase 6 (Frontend Completo):** Migração das páginas Next.js, convertendo chamadas SDK para Fetch da API REST.
- **Fase 7 (Migração de Dados e Go-Live):** Cutover Strangler Pattern, sincronizando dados Base44 para a DB Nova.
