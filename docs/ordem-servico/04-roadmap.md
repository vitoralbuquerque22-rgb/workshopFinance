# Roadmap — Módulo Ordem de Serviço

> **Versão:** 1.0 · **Última atualização:** 2026-07-05
>
> Legenda: ✅ implementado · 🚧 em andamento · 📋 planejado

## Fase 1 — Núcleo da OS ✅
- ✅ CRUD de OS com itens (peças/serviços/mão de obra/serviços compostos).
- ✅ Dois eixos de estado (`status` + `etapa_fluxo`) com timeline auditável.
- ✅ Detalhe da OS com mídia, checklist de produção e comentários.

## Fase 2 — Fluxo operacional ✅
- ✅ Stepper / kanban de `etapa_fluxo`.
- ✅ Apontamento de horas por técnico.
- ✅ Vínculo a elevador (ocupação de pátio).

## Fase 3 — Comercial e aprovação ✅
- ✅ Envio de orçamento e aprovação eletrônica pública (link + assinatura).
- ✅ Registro de recusa com motivo → integração com CRM (lead/follow-up).

## Fase 4 — Faturamento e financeiro ✅
- ✅ Finalização gera `ContaReceber` a partir da condição de pagamento (`BR-OS-10`).
- ✅ Emissão de NF-e de saída com cálculo tributário e baixa de estoque.
- ✅ Idempotência de recebíveis entre finalização e nota (`BR-OS-20`).

## Fase 5 — Retrabalho e comissão ✅
- ✅ Abertura de OS de retrabalho vinculada à origem.
- ✅ Desconto de comissão por retrabalho conforme configuração.

## Fase 6 — Próximos passos 📋
- 📋 Event Bus explícito para os eventos da OS (ver `07-event-bus.md`), hoje implícitos nas backend functions.
- 📋 Pagamento parcial / conciliação automática de recebíveis.
- 📋 Métricas de lead time por etapa no BI.