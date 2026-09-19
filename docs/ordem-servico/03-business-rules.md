# Business Rules — Módulo Ordem de Serviço

> **Versão:** 1.0 · **Última atualização:** 2026-07-05
>
> IDs no formato `BR-OS-<n>`. Regras são **invariantes**: devem ser sempre verdadeiras.

## Ciclo de vida

- **BR-OS-01** — Uma OS só pode ser criada com `cliente_id` e `veiculo_id` preenchidos.
- **BR-OS-02** — `status` transita apenas em: `orcamento → aprovado → em_andamento → concluido`. `cancelado` é acessível a partir de qualquer estado não concluído.
- **BR-OS-03** — Uma OS `concluido` não pode voltar para estados anteriores, exceto via abertura de OS de retrabalho (nova OS com `os_origem_id`).
- **BR-OS-04** — Toda transição de estado registra uma entrada em `timeline` com etapa, usuário e data.

## Financeiro

- **BR-OS-10** — Ao finalizar a OS, o sistema gera os `ContaReceber` a partir de `condicao_pagamento`: uma parcela por `numero_parcelas`, com vencimentos mensais a partir de `data_primeiro_vencimento`.
- **BR-OS-11** — A soma dos títulos gerados na finalização é igual ao `valor_total` da OS.
- **BR-OS-12** — Cada `ContaReceber` gerado carrega `ordem_servico_id`, `cliente_id`, `forma_recebimento` e `conta_bancaria_id` da condição de pagamento.
- **BR-OS-20** — *(Idempotência)* Ao emitir a NF-e de uma OS, se já existirem títulos com aquele `ordem_servico_id`, o sistema **vincula** esses títulos à nota (preenche `nota_fiscal_id` / `contas_receber_ids`) em vez de criar novos. **Nunca** duplicar cobrança. ✅ validado por QA end-to-end.

## Estoque e execução

- **BR-OS-30** — A emissão da NF-e de saída dá baixa no estoque das peças (`tipo: peca`) contidas nos itens.
- **BR-OS-31** — Horas apontadas por técnico (`apontamentos[]`) alimentam produção e cálculo de comissão; não alteram o valor faturado da OS.

## Retrabalho e comissão

- **BR-OS-40** — Retrabalho (`retrabalho: true`) referencia a OS de origem via `os_origem_id`/`os_origem_numero`.
- **BR-OS-41** — Retrabalho pode descontar comissão conforme `ConfigRemuneracao` (`descontar_retrabalho_interno` / `descontar_retorno_cliente`).

## Notificação

- **BR-OS-50** — Mudanças de `etapa_fluxo` podem notificar o cliente conforme `ConfigNotificacao.etapas_notificaveis`, respeitando o opt-out do cliente (`aceita_notificacoes`).

## Changelog
- **1.0** (2026-07-05) — Versão inicial. BR-OS-20 marcada como validada por QA.