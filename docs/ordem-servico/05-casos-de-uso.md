# Casos de Uso — Módulo Ordem de Serviço

> **Versão:** 1.0 · **Última atualização:** 2026-07-05
>
> Cada caso: **Ator**, **Pré-condição**, **Fluxo principal**, **Fluxos alternativos**, **Pós-condição**.

## UC-OS-01 — Abrir OS
- **Ator:** Consultor.
- **Pré:** Cliente e veículo cadastrados.
- **Fluxo:** 1) Seleciona cliente e veículo. 2) Descreve o problema. 3) Adiciona itens (peças/serviços). 4) Salva → OS criada em `status: orcamento`, `etapa_fluxo: recepcao`.
- **Alt:** Cliente/veículo inexistente → cadastro rápido inline.
- **Pós:** OS visível na lista e no fluxo operacional.

## UC-OS-02 — Enviar e aprovar orçamento
- **Ator:** Consultor (envia) / Cliente (aprova).
- **Pré:** OS com itens.
- **Fluxo:** 1) Consultor envia orçamento por link. 2) Cliente abre a página pública, revisa e assina. 3) Sistema marca aprovação → OS `status: aprovado`.
- **Alt:** Cliente reprova → registra motivo → OS segue para tratamento comercial (CRM).
- **Pós:** Aprovação/reprovação registrada com IP e assinatura.

## UC-OS-03 — Executar e apontar horas
- **Ator:** Técnico.
- **Pré:** OS `aprovado`.
- **Fluxo:** 1) OS entra em `em_andamento` / `etapa_fluxo: execucao`. 2) Técnico ocupa elevador. 3) Aponta horas por item. 4) Marca checklist de produção.
- **Pós:** Horas apontadas registradas; elevador ocupado.

## UC-OS-04 — Finalizar OS (gera recebível)
- **Ator:** Consultor.
- **Pré:** OS executada; `condicao_pagamento` definida.
- **Fluxo:** 1) Aciona **Finalizar**. 2) Sistema define `status: concluido`, `etapa_fluxo: aguardando_faturamento`. 3) Gera os `ContaReceber` conforme a condição de pagamento.
- **Pós:** Título(s) financeiro(s) pendente(s) criado(s) — soma = `valor_total` (`BR-OS-10/11`).

## UC-OS-05 — Emitir NF-e (sem duplicar cobrança)
- **Ator:** Faturamento.
- **Pré:** OS finalizada com títulos já criados.
- **Fluxo:** 1) Aciona **Emitir NF-e**. 2) Sistema calcula tributos, baixa estoque das peças. 3) **Localiza os títulos existentes da OS e os vincula à nota** (não cria novos). 4) OS → `etapa_fluxo: nota_emitida`.
- **Alt:** OS sem título prévio → cria os recebíveis a partir da nota.
- **Pós:** Nota `autorizada`, títulos vinculados, sem duplicidade (`BR-OS-20`).

## UC-OS-06 — Abrir retrabalho
- **Ator:** Consultor/Gestor.
- **Pré:** OS de origem concluída.
- **Fluxo:** 1) Abre nova OS marcando retrabalho e a OS de origem. 2) Define tipo (interno/retorno cliente).
- **Pós:** Nova OS vinculada; comissão ajustada conforme configuração.