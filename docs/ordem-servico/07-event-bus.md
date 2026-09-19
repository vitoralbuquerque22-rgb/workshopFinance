# Event Bus — Módulo Ordem de Serviço

> **Versão:** 1.0 · **Última atualização:** 2026-07-05
>
> Catálogo de eventos que sincronizam a OS com os demais módulos. Hoje esses eventos são **implícitos** (efeitos colaterais dentro das backend functions). Este documento os torna explícitos como contrato — e serve de base para a Fase 6 (event bus formal).

## Convenção
- Nome do evento: `os.<fato>` (passado). Payload sempre inclui `ordem_servico_id`.
- **Emite** = a OS publica o fato. **Consome** = módulo que reage.

## Eventos emitidos pela OS

| Evento | Quando | Payload principal | Consumidores |
|---|---|---|---|
| `os.criada` | OS salva pela 1ª vez | `ordem_servico_id, cliente_id, veiculo_id, origem_marketing` | BI, Marketing (atribuição) |
| `os.etapa_alterada` | muda `etapa_fluxo` | `ordem_servico_id, etapa_anterior, etapa_nova` | Pátio, Notificações (`notificarEtapaOs`), BI |
| `os.aprovada` | cliente aprova orçamento | `ordem_servico_id, aprovacao_id, assinatura` | Financeiro (previsão), CRM |
| `os.reprovada` | cliente reprova | `ordem_servico_id, motivo` | CRM (lead/follow-up), BI |
| `os.finalizada` | `status → concluido` | `ordem_servico_id, valor_total, condicao_pagamento` | **Financeiro** (gera `ContaReceber` — `BR-OS-10`), Pós-venda/Automações |
| `os.nota_emitida` | NF-e autorizada | `ordem_servico_id, nota_fiscal_id, contas_receber_ids` | **Financeiro** (vincula títulos — `BR-OS-20`), Estoque (baixa peças), Fiscal |
| `os.retrabalho_aberto` | nova OS de retrabalho | `ordem_servico_id, os_origem_id, tipo_retrabalho` | Remuneração (comissão), BI |

## Eventos consumidos pela OS

| Evento | Origem | Efeito na OS |
|---|---|---|
| `pagamento.recebido` | Financeiro/Boletos | Atualiza situação de recebimento vinculada à OS |
| `pedido_compra.recebido` | Compras | Libera etapa `compra → execucao` quando peças chegam |
| `lead.convertido` | Marketing/CRM | Preenche `origem_marketing` na abertura da OS |

## Garantias
- **Idempotência:** `os.finalizada` + `os.nota_emitida` não podem, juntos, gerar títulos em duplicidade (`BR-OS-20`). Ver QA `AC-OS-04`.
- **Ordem:** `os.finalizada` sempre precede `os.nota_emitida` no caminho feliz; a nota reaproveita o que a finalização criou.

## Changelog
- **1.0** (2026-07-05) — Catálogo inicial de eventos (implícitos documentados como contrato).