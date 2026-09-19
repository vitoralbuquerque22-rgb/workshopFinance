# Critérios de Aceitação (QA) — Módulo Ordem de Serviço

> **Versão:** 1.0 · **Última atualização:** 2026-07-05
>
> Formato Gherkin (Dado / Quando / Então). Cada critério mapeia para uma ou mais Business Rules.

## AC-OS-01 — Abertura exige cliente e veículo · `BR-OS-01`
- **Dado** um formulário de OS sem cliente ou sem veículo,
- **Quando** tento salvar,
- **Então** a criação é bloqueada.

## AC-OS-02 — Finalização gera recebível · `BR-OS-10`, `BR-OS-11`
- **Dado** uma OS `em_andamento` de `valor_total = 500` com `condicao_pagamento` boleto em 1 parcela,
- **Quando** finalizo a OS,
- **Então** existe exatamente **1** `ContaReceber` de `valor = 500`, `status: pendente`, `forma_recebimento: boleto`, com o vencimento da condição.
- **Status:** ✅ validado end-to-end via `test_backend_function('manageOs', {action:'finalizar_os'})`.

## AC-OS-03 — Recebível carrega vínculos corretos · `BR-OS-12`
- **Dado** a finalização da AC-OS-02,
- **Então** o título tem `ordem_servico_id`, `cliente_id`, `forma_recebimento` e (se informada) `conta_bancaria_id` iguais aos da OS.

## AC-OS-04 — NF-e não duplica cobrança · `BR-OS-20`
- **Dado** uma OS finalizada que **já possui** 1 título (`ContaReceber`),
- **Quando** emito a NF-e dessa OS,
- **Então** continua existindo **apenas 1** `ContaReceber` para a OS (nenhum título novo é criado),
- **E** a nota fica `autorizada` referenciando essa OS.
- **Status:** ✅ validado end-to-end via `test_backend_function('manageNfeSaida', {action:'emitir'})` — resultado observado: `total_titulos = 1` após a emissão.

## AC-OS-05 — NF-e baixa estoque das peças · `BR-OS-30`
- **Dado** uma OS com item `tipo: peca`,
- **Quando** emito a NF-e,
- **Então** o estoque da peça é reduzido pela quantidade faturada.

## AC-OS-06 — Transições registram timeline · `BR-OS-04`
- **Dado** qualquer mudança de `status` ou `etapa_fluxo`,
- **Então** uma nova entrada aparece na `timeline` com etapa, usuário e data.

## AC-OS-07 — Concluída não regride · `BR-OS-03`
- **Dado** uma OS `concluido`,
- **Quando** tento voltar para `em_andamento` diretamente,
- **Então** a operação é rejeitada (o caminho válido é abrir OS de retrabalho).

## Regressão obrigatória
Antes de qualquer alteração em `manageOs` ou `manageNfeSaida`, reexecutar **AC-OS-02** e **AC-OS-04** (fluxo finalizar → emitir → contar títulos = 1).