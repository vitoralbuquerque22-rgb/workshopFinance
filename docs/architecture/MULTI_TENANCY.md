# MULTI-TENANCY

O modelo adotado é **Pool/Logical Isolation**. Todos os clientes da SaaS dividem o mesmo banco PostgreSQL.
- O campo `empresa_id` é o Discriminador.
- Aggregate Roots (ex: OrdemServico) obrigam o `empresa_id`.
- Entidades filhas (ex: ItemOS, ContaReceber) também propagam o `empresa_id` para otimizar os Indexers e evitar JOINs perigosos de validação.
