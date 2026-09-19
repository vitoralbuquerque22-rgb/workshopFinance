# MATRIZ FUNCIONAL REAL

Comportamentos detalhados retirados do código fonte das funções de negócio (`base44/functions/`).

### FUNC-001

**Nome:** Finalizar Ordem de Serviço (`manageOs/finalizar_os`)

**Objetivo:** Concluir uma operação técnica, ajustar valores finais e preparar para faturamento.

**Entrada:** `ordem_servico_id`, `condicao_pagamento` (opcional), `valor_desconto` (opcional), `valor_total` (opcional).

**Pré-condições:** A OS precisa existir e estar no status `aprovado` ou `em_andamento`.

**Fluxo:**
1. Valida existência e status.
2. Recalcula o Custo Total somando os itens, caso o campo mestre esteja vazio.
3. Calcula `descontoFinal` e o `totalFinal` baseado no que foi passado no payload, ou usa um fallback de `valor_pecas + valor_servicos - desconto`.
4. Atualiza os dados da OS (Data fechamento, custos, valores).
5. Adiciona entrada de `timeline`.
6. Atualiza quilometragem do veículo.
7. Gera títulos financeiros de Contas a Receber, processando parcelas de acordo com a condição de pagamento.
8. Invoca de forma assíncrona o motor de regras pós-venda (`dispararReguas`).
9. Invoca o evento `motorOperacional`.

**Regras Ocultas Descobertas:**
* Se a `forma` do financeiro for "parcelado", o script gera Títulos pendentes individuais calculando a divisão (`Math.round(valorTotal / n * 100) / 100`).
* A última parcela absorve a diferença de centavos (Regra Financeira Clássica: `valorTotal - valorParcela * (n - 1)`).
* Se for à vista ("pix", "cartao", "dinheiro"), o título é inserido já com status `recebido` e data igual ao dia corrente.
* A geração do "Conta a Receber" garante que a OS fique com o `conta_receber_id` da primeira parcela salva nela mesma, vinculando o módulo técnico ao módulo financeiro.

**Integrações:** Nenhuma chamada HTTP externa explícita; o processo dispara eventos para outras funções locais Base44.

**Saída:** JSON com `status: sucesso`, OS atualizada e quantidade de contas criadas.

---

### FUNC-002

**Nome:** Reprovar Orçamento de OS (`manageOs/reprovar_orcamento`)

**Objetivo:** Cancelar um orçamento recusado e convertê-lo ativamente num prospect (Lead) para a equipe comercial, gerando tarefa de retorno.

**Entrada:** `ordem_servico_id`, `motivo_recusa`, `motivo_recusa_detalhe`, `agendar_retorno`, `data_retorno`.

**Fluxo & Regras:**
1. **Regra Forte:** Cancela a OS. Só é possível se a OS estiver estritamente em `orcamento`.
2. Se o cliente optou por "agendar_retorno", a inteligência busca na base se já existe um `Lead` para este cliente/veículo que esteja em aberto.
3. Se existir: atualiza o Lead para a etapa `negociacao`, anota que a OS foi perdida nos logs do lead, atualiza follow-up.
4. Se NÃO existir: **Cria um Lead no CRM** com as informações do proprietário do veículo com origem "manual".
5. Cria uma `Atividade` (Tarefa) para a equipe comercial realizar o retorno (`data_agendada: data_retorno T 09:00:00`).

**Entidades Alteradas:** `OrdemServico` (Update), `Lead` (Create/Update), `Atividade` (Create).

---

### FUNC-003

**Nome:** Excluir Ordem de Serviço (`manageOs/excluir_os`)

**Objetivo:** Remover fisicamente o registro da OS do banco, mantendo trilha de auditoria severa e notificação via email a diretores.

**Regras:**
* É obrigatório enviar uma justificativa com mínimo de 5 caracteres.
* Dispara um registro em `OsExcluida` com o snapshot (payload JSON inteiro da OS anterior), permitindo rollback manual caso ocorra uma sabotagem.
* **Integração:** Usa `base44.integrations.Core.SendEmail` para enviar email imediato a todos os usuários cadastrados no banco com `role: 'admin'`. Somente depois a exclusão acontece.
