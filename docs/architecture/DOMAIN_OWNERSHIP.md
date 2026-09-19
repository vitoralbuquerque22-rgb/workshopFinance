# DOMAIN OWNERSHIP

Fronteiras estritas de quem pode ler e quem pode alterar os dados no Banco de Dados.

| Entidade | Owner | Quem Pode Escrever | Quem Pode Ler | Fonte de Verdade |
| :--- | :--- | :--- | :--- | :--- |
| **OrdemServico** | Oficina | Apenas Oficina (Service/Aggregate) | Financeiro, CRM, BI | Oficina |
| **ContaReceber** | Financeiro | Oficina (via Transação de Conclusão), Financeiro (Baixa) | Oficina, Dashboards | Financeiro |
| **Lead** | CRM | CRM (Criar, Update), Oficina (via Reaproveitamento síncrono) | Oficina | CRM |
| **Patrimonio** | Estoque | Estoque (Manutenção), Oficina (via Outbox async) | Oficina | Estoque |
| **Usuario / Filial** | Identity | Apenas Modulo Identity | Todos (via Token Auth) | Identity |

> **Nota Crítica de Acoplamento:**
> A entidade `ContaReceber` é um Aggregate Root do Financeiro, mas a regra **CRITICAL-BR-002** força que a "Oficina" crie a ContaReceber simultaneamente ao finalizar a OS. Portanto, a Oficina **pode** escrever em `ContaReceber` como parte do UoW (Unit of Work) daquela transação específica, ou delegar a construção da estrutura para um Domínio Service compartilhado antes de persistir.
