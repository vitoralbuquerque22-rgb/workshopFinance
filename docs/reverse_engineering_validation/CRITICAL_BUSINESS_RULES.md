# REGRAS DE NEGÓCIO CRÍTICAS

Somente as regras absolutas extraídas da auditoria que causarão perdas financeiras ou corrupção de fluxo se não reimplementadas exatamente como são.

### RULE-001: Arredondamento e Absorção de Centavos em Parcelas
* **Função Atual:** `manageOs -> gerarContasReceberDaOs`
* **Impacto:** Alto (Inconsistência Financeira).
* **Regra:** Ao parcelar, o sistema divide o total pelo `numeroParcelas` com arredondamento estrito de 2 casas. As `N-1` parcelas recebem o valor exato. A **Última Parcela** (i === n - 1) obrigatoriamente recebe o valor residual (`valorTotal - valorParcela * (n - 1)`) para impedir perda ou sobra de R$ 0,01 a R$ 0,05.
* **Paridade:** Enviar OS de R$ 100,00 em 3x. Esperado: Parcela 1 e 2 = R$ 33,33. Parcela 3 = R$ 33,34.

### RULE-002: Vinculação Circular Técnica-Financeira
* **Função Atual:** `manageOs -> finalizar_os`
* **Impacto:** Alto (Faturamento Duplicado).
* **Regra:** O `conta_receber_id` não é apenas apontado pelo Financeiro para a OS. A própria entidade `OrdemServico` recebe um update contendo o `conta_receber_id` da PRIMEIRA parcela gerada, para indicar ao módulo fiscal ("Aguardando Faturamento") que ela já possui lastro no caixa.
* **Paridade:** Nenhuma OS pode ficar como "concluido" sem possuir o ID da Conta a Receber gravado nela mesma.

### RULE-003: Deleção com Trilha Fria de Auditoria
* **Função Atual:** `manageOs -> excluir_os`
* **Impacto:** Crítico (Risco de Fraude de Caixa).
* **Regra:** Não se usa "Soft Delete" tradicional (apenas marcar `deleted_at`). A OS é realmente deletada do banco, mas ANTES o sistema **duplica o payload inteiro** na entidade fria `OsExcluida`, anexando o ID do autor, a data e a justificativa obrigatória.
* **Paridade:** Simular requisição de exclusão na API e verificar se o E-mail de notificação foi enfileirado para os administradores antes do commit do banco.

### RULE-004: Aproveitamento (Idempotência) do Lead do CRM
* **Função Atual:** `manageOs -> reprovar_orcamento`
* **Impacto:** Médio (Poluição de Banco / Spam para Vendedores).
* **Regra:** Se o orçamento não for fechado, o sistema varre o banco procurando um Lead com o mesmo `veiculo_id` ou `cliente_id` que esteja com status "em_contato" ou "negociacao". Apenas atualiza esse Lead existente (anotando a perda) em vez de criar outro card repetido para os consultores.
* **Paridade:** Reprovar 3 Orçamentos seguidos para o mesmo carro. Deve resultar em apenas 1 Lead atualizado 3 vezes.
