# TENANT SCOPE MATRIX

Classificação de isolamento por entidade. O Prisma Middleware será configurado com base nestas diretrizes, não "cegamente" em tudo.

| Tabela / Aggregate | Scope | empresa_id | filial_id | Justificativa |
| :--- | :--- | :--- | :--- | :--- |
| **OrdemServico** | TENANT_SCOPED | SIM (Obrigatório) | SIM (Opcional, preenchido se alocado) | Dados privativos da oficina. |
| **ContaReceber** | TENANT_SCOPED | SIM (Obrigatório) | Opcional | Títulos financeiros devem respeitar isolamento de cliente (empresa). |
| **Lead / CRM** | TENANT_SCOPED | SIM (Obrigatório) | Opcional | Isolamento de carteira comercial. |
| **Usuario** | TENANT_SCOPED | SIM (Relacional) | - | Um usuário pertence a uma `Empresa` e pode ter vinculo N:N com filiais. |
| **Empresa** | SYSTEM | - | - | Entidade raiz do sistema SaaS. |
| **SystemConfig** | GLOBAL | NÃO | NÃO | Configurações do próprio ERP (versão, manutenções). |
