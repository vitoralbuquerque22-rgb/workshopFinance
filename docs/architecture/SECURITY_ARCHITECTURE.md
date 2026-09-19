# SECURITY ARCHITECTURE

- **Isolamento de Tenant:** O `empresa_id` será sempre o parâmetro mandatório em todas as queries (Multi-tenancy).
- **Proteção da API:** Todos os endpoints requerem token válido injetado por Guard (NestJS), exceto rotas de Webhook que utilizarão Assinatura HMAC.
- **Validação de Entrada:** O DTO validado via Zod previne Injection e mass-assignment.
