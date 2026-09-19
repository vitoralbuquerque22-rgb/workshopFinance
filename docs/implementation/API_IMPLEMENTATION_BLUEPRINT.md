# API IMPLEMENTATION BLUEPRINT

- **Contrato:** REST Nível 2.
- **Padrão Envelopado:**
```json
{
  "data": { "id": "123", "status": "concluido" },
  "meta": { "correlationId": "abc-123", "timestamp": "2026..." }
}
```
- **Tratamento de Erros:** Exceções de Domínio (ex: `InvalidOSStatusError`) capturadas por um Exception Filter Global do NestJS e convertidas em `422 Unprocessable Entity` ou `400 Bad Request`. Stack traces nunca vazam para produção.
