# MONEY REPRESENTATION STANDARD

- **Proibição Absoluta:** O uso de `number` em JS (Float64) para operações financeiras.
- **Backend/Domain:** Uso mandatório da lib `Decimal.js`.
- **Banco de Dados:** `DECIMAL(12, 2)`.
- **JSON Serialization:** O NestJS fará a serialização de Decimal para `string` (ex: `"33.34"`) ao despachar pela API. O Frontend tratará puramente para display ou instanciará `Decimal.js` se precisar recalcular algo na UI.
