# Repositório de Especificações — ERP Oficina

Documentação oficial e versionada do produto. Cada módulo do ERP (CRM, Ordem de Serviço, Pátio, Marketing, Financeiro, Produção, BI, IA, Automações) segue **um padrão único** de documentação, composto por 7 artefatos.

## Por que isso existe

O sistema atingiu escala em que prompts isolados geram ambiguidade e retrabalho. Este repositório serve como **fonte da verdade** do comportamento esperado do produto — para humanos e para o Base44 evoluir o ERP de forma consistente.

## O padrão (7 artefatos por módulo)

Cada módulo vive em `docs/<modulo>/` com os seguintes arquivos:

| Arquivo | Artefato | O que descreve |
|---|---|---|
| `01-adr.md` | **ADR** — Architecture Decision Record | Decisões arquiteturais, alternativas consideradas e trade-offs. |
| `02-modelo-dominio.md` | **Modelo de Domínio** | Entidades, atributos-chave e relacionamentos. |
| `03-business-rules.md` | **Business Rules** | Regras de negócio invariantes (o que sempre deve ser verdade). |
| `04-roadmap.md` | **Roadmap** | Fases de implementação e estado atual. |
| `05-casos-de-uso.md` | **Casos de Uso** | Fluxos do usuário, passo a passo. |
| `06-criterios-aceitacao.md` | **Critérios de Aceitação (QA)** | Testes que validam cada entrega (dado/quando/então). |
| `07-event-bus.md` | **Event Bus** | Eventos que este módulo emite/consome para sincronizar os demais. |

## Convenções

- **Idioma:** Português (BR).
- **Versionamento:** cada arquivo tem cabeçalho `Versão` e `Última atualização`. Ao mudar comportamento, atualize a versão e o changelog no fim do arquivo.
- **IDs de regra:** `BR-<MODULO>-<n>` (ex: `BR-OS-01`). IDs de evento: `<modulo>.<fato>` (ex: `os.finalizada`).
- **Estado:** `✅ implementado` · `🚧 em andamento` · `📋 planejado`.

## Módulos

| Módulo | Pasta | Status da documentação |
|---|---|---|
| Ordem de Serviço | [`ordem-servico/`](./ordem-servico/) | ✅ Módulo modelo (referência) |
| CRM | `crm/` | 📋 a documentar |
| Pátio | `patio/` | 📋 a documentar |
| Financeiro | `financeiro/` | 📋 a documentar |
| Fiscal | `fiscal/` | 📋 a documentar |
| Marketing | `marketing/` | 📋 a documentar |
| Produção | `producao/` | 📋 a documentar |
| BI | `bi/` | 📋 a documentar |
| IA / Automações | `automacoes/` | 📋 a documentar |

> **Ordem de Serviço** é o módulo modelo. Use-o como template ao documentar os demais.