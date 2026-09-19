# ADR — Módulo Ordem de Serviço

> **Versão:** 1.0 · **Última atualização:** 2026-07-05 · **Status:** ✅ vigente

Architecture Decision Records do módulo de Ordem de Serviço (OS). Cada ADR registra uma decisão, seu contexto, alternativas e consequências.

---

## ADR-OS-001 — A OS é a entidade central do ciclo operacional-financeiro

**Contexto.** O ERP precisa de um objeto que atravesse recepção → diagnóstico → orçamento → execução → faturamento → recebimento. Várias entidades (Orçamento, NotaFiscal, ContaReceber, GpsAtendimento) tocam esse ciclo.

**Decisão.** A `OrdemServico` é a **raiz de agregação** do ciclo. Ela guarda o `status` de negócio, a `etapa_fluxo` operacional, os `itens` (peças/serviços/mão de obra) e as `condicao_pagamento`. Demais entidades referenciam a OS por `ordem_servico_id`, nunca o contrário como fonte de verdade do ciclo.

**Alternativas consideradas.**
- *Orçamento como raiz:* rejeitado — o orçamento é um estágio, não o ciclo inteiro.
- *NotaFiscal como raiz financeira:* rejeitado — a cobrança pode nascer antes da nota (na finalização).

**Consequências.** Toda mudança de estado do ciclo passa pela função `manageOs`. Isso centraliza regras e efeitos colaterais (financeiro, estoque, notificações).

---

## ADR-OS-002 — Dois eixos de estado: `status` (negócio) e `etapa_fluxo` (operação)

**Contexto.** "Aprovado" é um estado de negócio; "em qualidade" é um estado operacional do pátio. Misturá-los num único campo gera enums enormes e ambíguos.

**Decisão.** Manter dois campos independentes:
- `status`: `orcamento · aprovado · em_andamento · concluido · cancelado` — governança comercial/financeira.
- `etapa_fluxo`: `recepcao · diagnostico · orcamento · aprovacao · compra · execucao · qualidade · aguardando_faturamento · nota_emitida · pagamento · entrega · pos_venda` — kanban operacional.

**Consequências.** BI e Pátio consomem `etapa_fluxo`; Financeiro e comissões consomem `status`. Transições de etapa registram na `timeline`.

---

## ADR-OS-003 — Recebíveis nascem na finalização, não na emissão da nota

**Contexto.** Regra de negócio: ao **finalizar** a OS o título financeiro já deve existir (o cliente pode pagar antes da nota). Mas a NF-e também precisa vincular recebíveis. Risco: duplicar cobrança.

**Decisão.** A finalização (`manageOs → finalizar_os`) cria os `ContaReceber` a partir da `condicao_pagamento`. Ao emitir a NF-e (`manageNfeSaida → emitir`), o sistema **busca títulos já existentes** da OS e os **vincula** à nota, em vez de criar novos.

**Alternativas.**
- *Criar sempre na nota:* rejeitado — quebra a regra de cobrança antecipada.
- *Criar sempre na finalização e nunca na nota:* rejeitado — OS faturadas sem passar por finalização ficariam sem título.

**Consequências.** Idempotência é obrigatória (ver `BR-OS-20`). Validado por QA end-to-end (ver `06-criterios-aceitacao.md`).

---

## ADR-OS-004 — Efeitos colaterais concentrados em backend functions

**Contexto.** Mudanças de estado disparam efeitos: financeiro, baixa de estoque, notificação ao cliente, agendamento de pós-venda.

**Decisão.** Efeitos colaterais vivem em backend functions (`manageOs`, `manageNfeSaida`, `notificarEtapaOs`), nunca no frontend. O frontend apenas invoca ações e reflete o resultado.

**Consequências.** Segurança (regras não burláveis pelo cliente), atomicidade e testabilidade via `test_backend_function`.

---

## Changelog
- **1.0** (2026-07-05) — Versão inicial: ADRs 001–004.