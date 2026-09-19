# MATRIZ DE PARIDADE FUNCIONAL

Critérios estritos de aceitação para assegurar que a migração não causou regressões no negócio.

### PARITY-01: Finalização de OS à vista
* **DADO** uma OS em andamento com valor total R$ 100,00 e condição de pagamento "PIX" (À vista).
* **QUANDO** a requisição `finalizar_os` for disparada pelo usuário.
* **ENTÃO** o sistema DEVE:
  1. Alterar o status da OS para `concluido`.
  2. Inserir a data_fechamento.
  3. Criar exatos **1** registro na entidade `ContaReceber`.
  4. O registro `ContaReceber` gerado DEVE ter status `recebido`.
  5. A data_recebimento DEVE ser o dia atual do fechamento.
  6. Disparar evento para a fila do `motorOperacional`.

### PARITY-02: Finalização de OS parcelada
* **DADO** uma OS com valor total de R$ 100,00 e condição de parcelamento em 3x (Boleto).
* **QUANDO** finalizada.
* **ENTÃO** o sistema DEVE:
  1. Criar exatos **3** registros em `ContaReceber`.
  2. O Valor dos dois primeiros títulos DEVE ser `R$ 33,33` (`Math.round(100/3*100)/100`).
  3. O Valor do último título DEVE ser a diferença contábil `R$ 33,34`.
  4. Agendar a cadência de cobrança de cada um dos títulos através do job `cadenciaCobranca`.

### PARITY-03: Auditoria na Exclusão da OS
* **DADO** a solicitação de exclusão de uma OS ativa com a justificativa "Erro no orçamento original".
* **QUANDO** submetida por um atendente.
* **ENTÃO** o sistema DEVE:
  1. Impedir a exclusão se a justificativa tiver < 5 caracteres.
  2. Criar um registro inalterável na entidade `OsExcluida` copiando as chaves estrangeiras e o `snapshot` completo (JSON state original da OS antes da deleção).
  3. Emitir requisição via Provider de E-mail enviando mensagem formatada a todos os membros com a _role_ `admin`.
  4. Excluir o registro principal de `OrdemServico` na base relacional real.
