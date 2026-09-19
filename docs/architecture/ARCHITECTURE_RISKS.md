# ARCHITECTURE RISKS

**Risco 01:** Lógica financeira implícita não mapeada na PARITY_MATRIX original.
**Mitigação:** TDD na reescrita. Nenhuma regra de parcelamento deve ir a produção sem passar pelos testes que validam cenários de dízima (R$ 100/3).

**Risco 02:** Latência. O antigo Motor Operacional rodava na mesma VM/Isolate local da cloud Base44. Na nova arquitetura, o uso de Webhooks/Filas distribuídas via Redis pode causar concorrência.
**Mitigação:** Garantir Idempotência estrita via chave de `CorrelationId`.
