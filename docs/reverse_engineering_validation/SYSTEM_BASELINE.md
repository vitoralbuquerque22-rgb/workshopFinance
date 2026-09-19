# BASELINE DO SISTEMA (COMPORTAMENTO OFICIAL)

Este documento representa o congelamento do comportamento atual. A nova arquitetura deve reproduzir exatamente estes domínios e lógicas.

### Domínio: Ordem de Serviço (OS) e Produção
* **Regra Oculta de Desconto:** Quando o usuário aprova ou finaliza uma OS, se ele enviar um `valor_desconto` avulso ou um `valor_total` fixado, esse valor **sobrepõe** qualquer desconto que estava na OS anteriormente, recalculando o resultado final líquido.
* **Timeline Auditoria:** O sistema insere um objeto literal de histórico (array de objetos com `etapa, descricao, usuario, data`) na propriedade `timeline` do JSON da OS sempre que o status avança (criado -> em_andamento -> concluido). A nova arquitetura precisa suportar um campo JSONB ou tabela relacional para "Linha do Tempo".

### Domínio: Financeiro e Contas
* **Não existe Carrinho Global:** A OS tem um acoplamento extremamente alto com o Contas a Receber. A rotina de finalização da OS injeta o título financeiro (já particionado, se parcelado) no banco e amarra o ID da primeira parcela de volta na OS (`conta_receber_id`).
* **Baixa Automática:** Ao finalizar uma OS com formato `pix`, `dinheiro` ou `cartao`, o título a receber é inserido diretamente com status `recebido` e a `data_recebimento` cravada no dia de hoje.
* **Conciliação de Pagamentos (CNAB 240):** O ERP valida CNAB de fornecedores via upload, comparando o `valor` (margem de 0.01) e o `vencimento`. Se bater com um Contas a Pagar pendente, ele apenas faz Update para `dda_confirmado = true`. Senão, cria uma nova Conta Pagar com observação "Auto-gerado via DDA".

### Domínio: CRM & Pós Venda
* **Idempotência no Atendimento Externo:** Ao transformar uma OS em "Atendimento Externo" (Missão Operacional AE-000000), o sistema verifica primeiro se já existe uma Missão apontando para o `ordem_servico_id`. Se sim, ele apenas a reaproveita (evitando AE duplicado).
* **Lead Automático na Recusa:** A reprovação de uma OS pode ressuscitar um Lead comercial antigo se o veículo for o mesmo. Apenas se não houver um Lead ativo (status diferente de ganho/perdido), ele cria um Lead novo do zero.

### Automações
* O "Motor Operacional" é o Hub de Eventos síncrono.
* Ele é acionado manualmente via POST, onde a controller informa qual evento aconteceu.
* Os módulos `producao`, `financeiro`, `estoque` e `crm` confiam que o Motor os atualizará corretamente sem falhar.
