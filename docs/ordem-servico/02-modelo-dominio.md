# Modelo de Domínio — Módulo Ordem de Serviço

> **Versão:** 1.0 · **Última atualização:** 2026-07-05

## Entidade raiz: `OrdemServico`

Atributos-chave (a definição completa é o schema em `base44/entities/OrdemServico.jsonc`):

| Campo | Tipo | Papel |
|---|---|---|
| `numero` | string | Identificador humano da OS. |
| `cliente_id` | ref → Cliente | Dono do veículo / pagador. **obrigatório** |
| `veiculo_id` | ref → Veiculo | Veículo atendido. **obrigatório** |
| `itens[]` | array | Peças, serviços, mão de obra e serviços compostos. |
| `valor_pecas` / `valor_servicos` / `valor_desconto` / `valor_total` | number | Totais financeiros da OS. |
| `custo_total` | number | Custo consolidado (para margem/rentabilidade). |
| `condicao_pagamento` | object | Forma, parcelas, 1º vencimento, conta bancária. Base dos recebíveis. |
| `status` | enum | Estado de negócio (ver ADR-OS-002). |
| `etapa_fluxo` | enum | Estado operacional (ver ADR-OS-002). |
| `timeline[]` | array | Histórico auditável de transições. |
| `conta_receber_id` | ref → ContaReceber | Vínculo ao(s) título(s) gerado(s). |
| `nota_fiscal_id` | ref → NotaFiscal | Nota vinculada, quando emitida. |
| `retrabalho` / `tipo_retrabalho` / `os_origem_id` | bool/enum/ref | Rastreio de retrabalho (impacta comissões). |
| `origem_marketing` | object | Atribuição de lead/campanha (integra com Marketing/BI). |

### Subestrutura `itens[]`
Cada item: `tipo` (`servico · peca · mao_obra · servico_composto`), `descricao`, `quantidade`, `valor_unitario`, `valor_total`, `custo_unitario`, refs (`peca_id`, `mao_obra_id`, `servico_composto_id`), horas (`horas_vendidas`, `horas_apontadas`) e `apontamentos[]` de técnicos (para produção e comissão).

### Subestrutura `condicao_pagamento`
`forma` (`pix · boleto · promissoria · cartao · dinheiro · transferencia · parcelado`), `numero_parcelas`, `data_primeiro_vencimento`, `conta_bancaria_id`, `observacoes`.

## Relacionamentos

```
Cliente 1───N OrdemServico N───1 Veiculo
OrdemServico 1───N ContaReceber        (via ordem_servico_id)
OrdemServico 1───0..1 NotaFiscal       (via ordem_servico_id / nota_fiscal_id)
OrdemServico 1───N PedidoCompra        (via pedidos_compra_ids)
OrdemServico 0..1───1 GpsAtendimento   (origem do lead — gps_atendimento_id)
OrdemServico N───1 Colaborador         (tecnico_responsavel, consultor_id)
OrdemServico 0..1───1 Elevador         (elevador_id — ocupação de pátio)
OrdemServico 0..1───1 OrdemServico      (os_origem_id — retrabalho)
```

## Entidades relacionadas (referência)
- `ContaReceber` — título financeiro. Vinculado por `ordem_servico_id` e `nota_fiscal_id`.
- `NotaFiscal` (tipo `saida`) — documento fiscal. Guarda `contas_receber_ids`.
- `Elevador` — recurso físico de pátio ocupado durante `execucao`.
- `Lead` / `Campanha` — atribuição de marketing via `origem_marketing`.

## Invariantes de integridade
- Uma OS sempre tem `cliente_id` e `veiculo_id`.
- `valor_total = valor_pecas + valor_servicos − valor_desconto` (validado no cálculo, não no schema).
- Recebíveis de uma OS somam, no total, o `valor_total` da OS (menos ajustes explícitos).