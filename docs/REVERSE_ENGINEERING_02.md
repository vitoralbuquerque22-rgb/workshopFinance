# 7. BANCO DE DADOS

### ENTIDADE: AprovacaoOrcamento

**Arquivo:** `base44/entities/AprovacaoOrcamento.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| ordem_servico_id | string | Sim | - | - | Inferido | schema |
| os_numero | string | Não | - | - | - | schema |
| conversa_id | string | Não | - | - | Inferido | schema |
| cliente_id | string | Não | - | - | Inferido | schema |
| cliente_nome | string | Não | - | - | - | schema |
| veiculo_placa | string | Não | - | - | - | schema |
| valor_total | number | Não | 0 | - | - | schema |
| token | string | Sim | - | - | - | schema |
| canal | string | Não | whatsapp | whatsapp, instagram, messenger, email, site, telegram, sms, google_business, interno | - | schema |
| status | string | Não | pendente | pendente, aprovado, reprovado, expirado | - | schema |
| enviado_por_id | string | Não | - | - | Inferido | schema |
| enviado_por_nome | string | Não | - | - | - | schema |
| enviado_em | string | Não | - | - | - | schema |
| respondido_em | string | Não | - | - | - | schema |
| assinatura_nome | string | Não | - | - | - | schema |
| assinatura_ip | string | Não | - | - | - | schema |
| assinatura_user_agent | string | Não | - | - | - | schema |
| motivo_reprovacao | string | Não | - | - | - | schema |
| snapshot_itens | array | Não | - | - | - | schema |

### ENTIDADE: Atividade

**Arquivo:** `base44/entities/Atividade.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| lead_id | string | Sim | - | - | Inferido | schema |
| tipo | string | Sim | nota | whatsapp, email, ligacao, tarefa, nota, reuniao | - | schema |
| titulo | string | Não | - | - | - | schema |
| descricao | string | Não | - | - | - | schema |
| consultor | string | Não | - | - | - | schema |
| data_agendada | string | Não | - | - | - | schema |
| concluida | boolean | Não | false | - | - | schema |
| data_conclusao | string | Não | - | - | - | schema |

### ENTIDADE: AtivoOperacional

**Arquivo:** `base44/entities/AtivoOperacional.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| codigo_patrimonial | string | Não | - | - | - | schema |
| nome | string | Sim | - | - | - | schema |
| tipo | string | Sim | veiculo | veiculo, moto, van, pickup, guincho, empilhadeira, reboque, carrinho, outro | - | schema |
| placa | string | Não | - | - | - | schema |
| marca | string | Não | - | - | - | schema |
| modelo | string | Não | - | - | - | schema |
| ano | string | Não | - | - | - | schema |
| cor | string | Não | - | - | - | schema |
| renavam | string | Não | - | - | - | schema |
| chassi | string | Não | - | - | - | schema |
| categoria | string | Não | - | - | - | schema |
| responsavel_id | string | Não | - | - | Inferido | schema |
| responsavel_nome | string | Não | - | - | - | schema |
| localizacao | string | Não | - | - | - | schema |
| filial_id | string | Não | - | - | Inferido | schema |
| quilometragem | number | Não | 0 | - | - | schema |
| valor_compra | number | Não | 0 | - | - | schema |
| data_compra | string | Não | - | - | - | schema |
| fornecedor_id | string | Não | - | - | Inferido | schema |
| documentacao | object | Não | - | - | - | schema |
| manutencao_preventiva | object | Não | - | - | - | schema |
| historico | array | Não | - | - | - | schema |
| fotos | array | Não | - | - | - | schema |
| documentos | array | Não | - | - | - | schema |
| status | string | Não | disponivel | disponivel, em_uso, em_manutencao, baixado | - | schema |
| observacoes | string | Não | - | - | - | schema |

### ENTIDADE: Auditoria

**Arquivo:** `base44/entities/Auditoria.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| numero | string | Não | - | - | - | schema |
| tipo | string | Sim | ferramentas | ferramentas, pecas, patrimonio, epis, equipamentos | - | schema |
| titulo | string | Não | - | - | - | schema |
| origem | string | Não | manual | manual, atendimento_externo, os | - | schema |
| missao_operacional_id | string | Não | - | - | Inferido | schema |
| ordem_servico_id | string | Não | - | - | Inferido | schema |
| referencia_numero | string | Não | - | - | - | schema |
| responsavel_id | string | Não | - | - | Inferido | schema |
| responsavel_nome | string | Não | - | - | - | schema |
| responsavel_email | string | Não | - | - | - | schema |
| itens | array | Não | - | - | - | schema |
| fotos | array | Não | - | - | - | schema |
| pendencias | array | Não | - | - | - | schema |
| status | string | Não | aberta | aberta, em_conferencia, aguardando_aprovacao, aprovada, reprovada | - | schema |
| aprovada_por_id | string | Não | - | - | Inferido | schema |
| aprovada_por_nome | string | Não | - | - | - | schema |
| aprovada_em | string | Não | - | - | - | schema |
| motivo_reprovacao | string | Não | - | - | - | schema |
| estoque_atualizado | boolean | Não | false | - | - | schema |
| patrimonio_atualizado | boolean | Não | false | - | - | schema |
| historico | array | Não | - | - | - | schema |
| empresa_id | string | Não | - | - | Inferido | schema |
| filial_id | string | Não | - | - | Inferido | schema |
| observacoes | string | Não | - | - | - | schema |

### ENTIDADE: AuditoriaConversa

**Arquivo:** `base44/entities/AuditoriaConversa.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| conversa_id | string | Sim | - | - | Inferido | schema |
| evento | string | Sim | outro | aprovacao_enviada, aprovacao_aprovada, aprovacao_reprovada, transferencia, assumiu, status_alterado, consultor_alterado, mensagem_enviada, ligacao, whatsapp, outro | - | schema |
| descricao | string | Não | - | - | - | schema |
| ordem_servico_id | string | Não | - | - | Inferido | schema |
| ator_id | string | Não | - | - | Inferido | schema |
| ator_nome | string | Não | - | - | - | schema |
| ator_tipo | string | Não | consultor | consultor, cliente, sistema | - | schema |
| de_consultor_id | string | Não | - | - | Inferido | schema |
| de_consultor_nome | string | Não | - | - | - | schema |
| para_consultor_id | string | Não | - | - | Inferido | schema |
| para_consultor_nome | string | Não | - | - | - | schema |
| metadados | object | Não | - | - | - | schema |
| data_evento | string | Não | - | - | - | schema |

### ENTIDADE: Bonificacao

**Arquivo:** `base44/entities/Bonificacao.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| nome | string | Sim | - | - | - | schema |
| descricao | string | Não | - | - | - | schema |
| abrangencia | string | Não | individual | individual, equipe, filial, global | - | schema |
| colaborador_id | string | Não | - | - | Inferido | schema |
| filial_id | string | Não | - | - | Inferido | schema |
| criterio | string | Não | horas_produzidas | horas_produzidas, faturamento, sem_retrabalho, eficiencia, personalizado | - | schema |
| meta_valor | number | Não | 0 | - | - | schema |
| valor_bonus | number | Não | 0 | - | - | schema |
| periodo | string | Não | mensal | mensal, trimestral, campanha | - | schema |
| data_inicio | string | Não | - | - | - | schema |
| data_fim | string | Não | - | - | - | schema |
| status | string | Não | ativa | ativa, pausada, encerrada | - | schema |

### ENTIDADE: Caixa

**Arquivo:** `base44/entities/Caixa.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| filial_id | string | Não | - | - | Inferido | schema |
| usuario_abertura | string | Não | - | - | - | schema |
| usuario_fechamento | string | Não | - | - | - | schema |
| data_abertura | string | Não | - | - | - | schema |
| data_fechamento | string | Não | - | - | - | schema |
| valor_abertura | number | Não | 0 | - | - | schema |
| valor_fechamento | number | Não | - | - | - | schema |
| status | string | Sim | aberto | aberto, fechado | - | schema |
| conferencia | boolean | Não | false | - | - | schema |

### ENTIDADE: Campanha

**Arquivo:** `base44/entities/Campanha.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| nome | string | Sim | - | - | - | schema |
| plataforma | string | Sim | meta_ads | meta_ads, google_ads, instagram, whatsapp, site, indicacao, outro | - | schema |
| objetivo | string | Não | leads | leads, conversao, trafego, alcance, engajamento | - | schema |
| id_externo | string | Não | - | - | - | schema |
| utm_campaign | string | Não | - | - | - | schema |
| investimento | number | Não | 0 | - | - | schema |
| data_inicio | string | Não | - | - | - | schema |
| data_fim | string | Não | - | - | - | schema |
| status | string | Não | ativa | ativa, pausada, encerrada | - | schema |
| observacoes | string | Não | - | - | - | schema |

### ENTIDADE: CanalConexao

**Arquivo:** `base44/entities/CanalConexao.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| empresa_id | string | Não | - | - | Inferido | schema |
| filial_id | string | Não | - | - | Inferido | schema |
| canal | string | Sim | whatsapp | whatsapp, instagram, messenger | - | schema |
| modo_conexao | string | Não | oficial | oficial, qrcode | - | schema |
| nome_exibicao | string | Não | - | - | - | schema |
| status | string | Não | desconectado | desconectado, aguardando_qr, conectado, erro, expirado | - | schema |
| webhook_verificado | boolean | Não | false | - | - | schema |
| credenciais | object | Não | - | - | - | schema |
| verify_token | string | Não | - | - | - | schema |
| qrcode | object | Não | - | - | - | schema |
| ultimo_evento_em | string | Não | - | - | - | schema |
| erro_detalhe | string | Não | - | - | - | schema |

### ENTIDADE: Cargo

**Arquivo:** `base44/entities/Cargo.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| nome | string | Sim | - | - | - | schema |
| descricao | string | Não | - | - | - | schema |
| area | string | Não | tecnica | tecnica, comercial, administrativa, gestao, outros | - | schema |
| modelo_remuneracao_padrao | string | Não | salario | salario, comissao, salario_comissao, salario_bonificacao, comissao_bonificacao, personalizado | - | schema |
| status | string | Não | ativo | ativo, inativo | - | schema |

### ENTIDADE: CentroCusto

**Arquivo:** `base44/entities/CentroCusto.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| filial_id | string | Não | - | - | Inferido | schema |
| nome | string | Sim | - | - | - | schema |
| codigo | string | Não | - | - | - | schema |
| tipo | string | Não | despesa | receita, despesa | - | schema |
| pai_id | string | Não | - | - | Inferido | schema |

### ENTIDADE: Cliente

**Arquivo:** `base44/entities/Cliente.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| tipo_pessoa | string | Sim | fisica | fisica, juridica | - | schema |
| nome | string | Sim | - | - | - | schema |
| cpf | string | Não | - | - | - | schema |
| cnpj | string | Não | - | - | - | schema |
| razao_social | string | Não | - | - | - | schema |
| nome_fantasia | string | Não | - | - | - | schema |
| inscricao_estadual | string | Não | - | - | - | schema |
| data_nascimento | string | Não | - | - | - | schema |
| nome_mae | string | Não | - | - | - | schema |
| situacao_cadastral | string | Não | - | - | - | schema |
| cnae_principal | string | Não | - | - | - | schema |
| cnaes_secundarios | array | Não | - | - | - | schema |
| socios | array | Não | - | - | - | schema |
| tipo_cliente | string | Não | particular | particular, frotista, empresa | - | schema |
| telefone | string | Não | - | - | - | schema |
| celular | string | Não | - | - | - | schema |
| email | string | Não | - | - | - | schema |
| cep | string | Não | - | - | - | schema |
| logradouro | string | Não | - | - | - | schema |
| numero | string | Não | - | - | - | schema |
| complemento | string | Não | - | - | - | schema |
| bairro | string | Não | - | - | - | schema |
| cidade | string | Não | - | - | - | schema |
| uf | string | Não | - | - | - | schema |
| endereco | string | Não | - | - | - | schema |
| aceita_notificacoes | boolean | Não | true | - | - | schema |
| origem_dados | string | Não | manual | manual, consulta_cpf, consulta_cnpj | - | schema |
| ultima_consulta_em | string | Não | - | - | - | schema |
| observacoes | string | Não | - | - | - | schema |
| status | string | Não | ativo | ativo, inativo | - | schema |

### ENTIDADE: Colaborador

**Arquivo:** `base44/entities/Colaborador.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| nome | string | Sim | - | - | - | schema |
| cpf | string | Não | - | - | - | schema |
| cargo_id | string | Não | - | - | Inferido | schema |
| filial_id | string | Não | - | - | Inferido | schema |
| email | string | Não | - | - | - | schema |
| telefone | string | Não | - | - | - | schema |
| user_id | string | Não | - | - | Inferido | schema |
| funcao | string | Não | tecnico | tecnico, consultor, gestor, administrativo, outros | - | schema |
| tipo_contratacao | string | Não | clt | clt, pj, comissionado, autonomo, horista | - | schema |
| modelo_remuneracao | string | Não | salario | salario, comissao, salario_comissao, salario_bonificacao, comissao_bonificacao, personalizado | - | schema |
| salario_base | number | Não | 0 | - | - | schema |
| valor_hora | number | Não | 0 | - | - | schema |
| meta_horas_mensal | number | Não | 0 | - | - | schema |
| meta_faturamento_mensal | number | Não | 0 | - | - | schema |
| regra_comissao_id | string | Não | - | - | Inferido | schema |
| comissao_percentual_padrao | number | Não | 0 | - | - | schema |
| descontos_fixos | number | Não | 0 | - | - | schema |
| observacoes | string | Não | - | - | - | schema |
| data_admissao | string | Não | - | - | - | schema |
| status | string | Não | ativo | ativo, inativo | - | schema |

### ENTIDADE: ConfigAutomacao

**Arquivo:** `base44/entities/ConfigAutomacao.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| respeitar_horario_comercial | boolean | Não | true | - | - | schema |
| horario_inicio | string | Não | 08:00 | - | - | schema |
| horario_fim | string | Não | 20:00 | - | - | schema |
| disparar_fim_de_semana | boolean | Não | false | - | - | schema |
| limite_por_contato_dia | number | Não | 3 | - | - | schema |
| dedup_horas | number | Não | 24 | - | - | schema |

### ENTIDADE: ConfigCobranca

**Arquivo:** `base44/entities/ConfigCobranca.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| escopo | string | Não | padrao | padrao, cliente | - | schema |
| cliente_id | string | Não | - | - | Inferido | schema |
| ativo | boolean | Não | true | - | - | schema |
| canal_padrao | string | Não | whatsapp | whatsapp, email | - | schema |
| formas_alvo | array | Não | boleto,promissoria | - | - | schema |
| passos | array | Não |  | - | - | schema |

### ENTIDADE: ConfigCustoOperacional

**Arquivo:** `base44/entities/ConfigCustoOperacional.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| filial_id | string | Não | - | - | Inferido | schema |
| ativo | boolean | Não | true | - | - | schema |
| valor_km | number | Não | 0 | - | - | schema |
| valor_hora | number | Não | 0 | - | - | schema |
| valor_pedagio | number | Não | 0 | - | - | schema |
| valor_alimentacao | number | Não | 0 | - | - | schema |
| valor_hospedagem | number | Não | 0 | - | - | schema |
| gerar_conta_pagar | boolean | Não | false | - | - | schema |
| centro_custo_id | string | Não | - | - | Inferido | schema |
| observacoes | string | Não | - | - | - | schema |

### ENTIDADE: ConfigNotificacao

**Arquivo:** `base44/entities/ConfigNotificacao.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| filial_id | string | Não | - | - | Inferido | schema |
| notificacoes_ativas | boolean | Não | false | - | - | schema |
| etapas_notificaveis | array | Não | diagnostico,execucao,entrega | - | - | schema |
| canal_padrao | string | Não | whatsapp | whatsapp, email, sms | - | schema |
| templates_etapa | array | Não | - | - | - | schema |

### ENTIDADE: ConfigRemuneracao

**Arquivo:** `base44/entities/ConfigRemuneracao.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| base_calculo_horas | string | Não | horas_apontadas | horas_vendidas, horas_apontadas, horas_padrao, horas_trabalhadas | - | schema |
| comissao_padrao_mao_obra | number | Não | 50 | - | - | schema |
| comissao_padrao_peca | number | Não | 0 | - | - | schema |
| peca_gera_comissao_padrao | boolean | Não | false | - | - | schema |
| servico_gera_comissao_padrao | boolean | Não | true | - | - | schema |
| descontar_retrabalho | boolean | Não | true | - | - | schema |
| descontar_retrabalho_interno | boolean | Não | true | - | - | schema |
| descontar_retorno_cliente | boolean | Não | false | - | - | schema |
| aprovacao_obrigatoria | boolean | Não | true | - | - | schema |
| observacoes | string | Não | - | - | - | schema |

### ENTIDADE: ConsultaLog

**Arquivo:** `base44/entities/ConsultaLog.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| servico | string | Sim | - | cpf, cnpj, veiculo, cep | - | schema |
| documento | string | Não | - | - | - | schema |
| provedor | string | Não | - | - | - | schema |
| usuario | string | Não | - | - | - | schema |
| status | string | Não | sucesso | sucesso, erro, nao_encontrado | - | schema |
| tempo_resposta_ms | number | Não | 0 | - | - | schema |
| erro_detalhe | string | Não | - | - | - | schema |
| campos_atualizados | array | Não | - | - | - | schema |
| cliente_id | string | Não | - | - | Inferido | schema |

### ENTIDADE: ContaBancaria

**Arquivo:** `base44/entities/ContaBancaria.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| filial_id | string | Não | - | - | Inferido | schema |
| banco_codigo | string | Sim | - | - | - | schema |
| banco_nome | string | Não | - | - | - | schema |
| agencia | string | Sim | - | - | - | schema |
| conta | string | Sim | - | - | - | schema |
| tipo_integracao | string | Não | manual | cnab, open_banking, manual | - | schema |
| status | string | Não | ativa | ativa, inativa | - | schema |
| ultimo_sync | string | Não | - | - | - | schema |
| open_banking_consent_id | string | Não | - | - | Inferido | schema |

### ENTIDADE: ContaPagar

**Arquivo:** `base44/entities/ContaPagar.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| filial_id | string | Não | - | - | Inferido | schema |
| descricao | string | Sim | - | - | - | schema |
| fornecedor_id | string | Não | - | - | Inferido | schema |
| categoria | string | Não | - | - | - | schema |
| centro_custo_id | string | Não | - | - | Inferido | schema |
| valor | number | Sim | - | - | - | schema |
| data_vencimento | string | Sim | - | - | - | schema |
| data_pagamento | string | Não | - | - | - | schema |
| status | string | Não | pendente | pendente, pago, cancelado | - | schema |
| forma_pagamento | string | Não | - | pix, boleto, transferencia, cartao, dinheiro | - | schema |
| origem | string | Não | manual | manual, nfe, dda | - | schema |
| dda_confirmado | boolean | Não | false | - | - | schema |
| observacoes | string | Não | - | - | - | schema |
| parcela_atual | number | Não | 1 | - | - | schema |
| total_parcelas | number | Não | 1 | - | - | schema |

### ENTIDADE: ContaReceber

**Arquivo:** `base44/entities/ContaReceber.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| filial_id | string | Não | - | - | Inferido | schema |
| descricao | string | Sim | - | - | - | schema |
| cliente | string | Não | - | - | - | schema |
| cliente_id | string | Não | - | - | Inferido | schema |
| ordem_servico_id | string | Não | - | - | Inferido | schema |
| nota_fiscal_id | string | Não | - | - | Inferido | schema |
| categoria | string | Não | - | - | - | schema |
| centro_custo_id | string | Não | - | - | Inferido | schema |
| valor | number | Sim | - | - | - | schema |
| data_vencimento | string | Sim | - | - | - | schema |
| data_recebimento | string | Não | - | - | - | schema |
| status | string | Não | pendente | pendente, recebido, cancelado | - | schema |
| forma_recebimento | string | Não | - | pix, boleto, promissoria, cartao, dinheiro, transferencia | - | schema |
| conta_bancaria_id | string | Não | - | - | Inferido | schema |
| cobranca_agendada | boolean | Não | false | - | - | schema |
| boleto | object | Não | - | - | - | schema |
| origem | string | Não | manual | os, venda, manual | - | schema |
| observacoes | string | Não | - | - | - | schema |

### ENTIDADE: Conversa

**Arquivo:** `base44/entities/Conversa.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| canal | string | Sim | whatsapp | whatsapp, instagram, messenger, email, site, telegram, sms, google_business, interno | - | schema |
| canal_externo_id | string | Não | - | - | Inferido | schema |
| contato_nome | string | Não | - | - | - | schema |
| contato_telefone | string | Não | - | - | - | schema |
| contato_email | string | Não | - | - | - | schema |
| contato_identificador | string | Não | - | - | - | schema |
| cliente_id | string | Não | - | - | Inferido | schema |
| veiculo_id | string | Não | - | - | Inferido | schema |
| ordem_servico_id | string | Não | - | - | Inferido | schema |
| lead_id | string | Não | - | - | Inferido | schema |
| consultor_id | string | Não | - | - | Inferido | schema |
| consultor_nome | string | Não | - | - | - | schema |
| identificacao_status | string | Não | nao_identificado | identificado, nao_identificado, lead_criado | - | schema |
| status | string | Não | aberta | aberta, aguardando_cliente, aguardando_consultor, resolvida, arquivada | - | schema |
| ultima_mensagem_texto | string | Não | - | - | - | schema |
| ultima_mensagem_em | string | Não | - | - | - | schema |
| ultima_mensagem_direcao | string | Não | - | entrada, saida | - | schema |
| nao_lidas | number | Não | 0 | - | - | schema |
| atendimentos | array | Não | - | - | - | schema |
| tags | array | Não | - | - | - | schema |

### ENTIDADE: Cotacao

**Arquivo:** `base44/entities/Cotacao.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| numero | string | Não | - | - | - | schema |
| requisicao_id | string | Não | - | - | Inferido | schema |
| descricao | string | Não | - | - | - | schema |
| itens | array | Sim | - | - | - | schema |
| propostas | array | Não | - | - | - | schema |
| fornecedor_vencedor_id | string | Não | - | - | Inferido | schema |
| status | string | Não | aberta | aberta, respondida, aprovada, reprovada, convertida, cancelada | - | schema |
| observacoes | string | Não | - | - | - | schema |

### ENTIDADE: Deposito

**Arquivo:** `base44/entities/Deposito.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| nome | string | Sim | - | - | - | schema |
| codigo | string | Não | - | - | - | schema |
| filial_id | string | Não | - | - | Inferido | schema |
| tipo | string | Não | principal | principal, secundario, consignado, avariado, transito | - | schema |
| endereco | string | Não | - | - | - | schema |
| responsavel | string | Não | - | - | - | schema |
| status | string | Não | ativo | ativo, inativo | - | schema |

### ENTIDADE: Elevador

**Arquivo:** `base44/entities/Elevador.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| nome | string | Sim | - | - | - | schema |
| codigo | string | Não | - | - | - | schema |
| filial_id | string | Não | - | - | Inferido | schema |
| tipo | string | Não | elevador | elevador, box, rampa, fosso, area_externa | - | schema |
| capacidade_kg | number | Não | 0 | - | - | schema |
| especialidade | string | Não | geral | geral, mecanica, eletrica, alinhamento, funilaria, pintura, diesel | - | schema |
| status | string | Não | livre | livre, ocupado, manutencao, inativo | - | schema |
| ordem_servico_id | string | Não | - | - | Inferido | schema |
| tecnico_atual | string | Não | - | - | - | schema |
| ocupado_desde | string | Não | - | - | - | schema |

### ENTIDADE: Empresa

**Arquivo:** `base44/entities/Empresa.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| nome_fantasia | string | Sim | - | - | - | schema |
| razao_social | string | Não | - | - | - | schema |
| cnpj | string | Sim | - | - | - | schema |
| regime_tributario | string | Não | - | Simples Nacional, Lucro Presumido, Lucro Real, MEI | - | schema |
| aliquota_iss | number | Não | 0 | - | - | schema |
| inscricao_municipal | string | Não | - | - | - | schema |
| plano | string | Não | Pro | Starter, Pro, Enterprise | - | schema |
| cor_primaria | string | Não | #1d4ed8 | - | - | schema |
| logo_url | string | Não | - | - | - | schema |
| status | string | Não | ativo | ativo, suspenso, cancelado | - | schema |
| endereco | string | Não | - | - | - | schema |
| telefone | string | Não | - | - | - | schema |
| email | string | Não | - | - | - | schema |

### ENTIDADE: EstoqueSaldo

**Arquivo:** `base44/entities/EstoqueSaldo.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| peca_id | string | Sim | - | - | Inferido | schema |
| peca_codigo | string | Não | - | - | - | schema |
| peca_descricao | string | Não | - | - | - | schema |
| deposito_id | string | Sim | - | - | Inferido | schema |
| deposito_nome | string | Não | - | - | - | schema |
| quantidade | number | Não | 0 | - | - | schema |
| quantidade_reservada | number | Não | 0 | - | - | schema |

### ENTIDADE: EventoOperacional

**Arquivo:** `base44/entities/EventoOperacional.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| evento | string | Sim | - | os_criada, os_aprovada, os_iniciada, os_finalizada, atendimento_externo_criado, ferramenta_retirada, ferramenta_devolvida, auditoria_criada, auditoria_finalizada | - | schema |
| origem | string | Não | - | - | - | schema |
| ordem_servico_id | string | Não | - | - | Inferido | schema |
| ativo_id | string | Não | - | - | Inferido | schema |
| referencia_id | string | Não | - | - | Inferido | schema |
| descricao | string | Não | - | - | - | schema |
| payload | object | Não | - | - | - | schema |
| modulos_atualizados | array | Não | - | - | - | schema |
| status | string | Não | processado | processado, parcial, falhou | - | schema |
| erros | array | Não | - | - | - | schema |
| ator_id | string | Não | - | - | Inferido | schema |
| ator_nome | string | Não | - | - | - | schema |
| empresa_id | string | Não | - | - | Inferido | schema |
| filial_id | string | Não | - | - | Inferido | schema |

### ENTIDADE: FechamentoRemuneracao

**Arquivo:** `base44/entities/FechamentoRemuneracao.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| colaborador_id | string | Sim | - | - | Inferido | schema |
| colaborador_nome | string | Não | - | - | - | schema |
| competencia | string | Sim | - | - | - | schema |
| data_inicio | string | Não | - | - | - | schema |
| data_fim | string | Não | - | - | - | schema |
| salario_base | number | Não | 0 | - | - | schema |
| comissao_total | number | Não | 0 | - | - | schema |
| bonificacao_total | number | Não | 0 | - | - | schema |
| descontos | number | Não | 0 | - | - | schema |
| total_liquido | number | Não | 0 | - | - | schema |
| horas_produzidas | number | Não | 0 | - | - | schema |
| horas_vendidas | number | Não | 0 | - | - | schema |
| valor_produzido | number | Não | 0 | - | - | schema |
| detalhamento | array | Não | - | - | - | schema |
| snapshot_regras | object | Não | - | - | - | schema |
| status | string | Não | rascunho | rascunho, aguardando_aprovacao, aprovado, pago, rejeitado | - | schema |
| aprovado_por | string | Não | - | - | - | schema |
| data_aprovacao | string | Não | - | - | - | schema |
| conta_pagar_id | string | Não | - | - | Inferido | schema |
| observacoes | string | Não | - | - | - | schema |

### ENTIDADE: Filial

**Arquivo:** `base44/entities/Filial.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| empresa_id | string | Não | - | - | Inferido | schema |
| nome | string | Sim | - | - | - | schema |
| cnpj | string | Não | - | - | - | schema |
| tipo | string | Sim | filial | matriz, filial | - | schema |
| endereco | string | Não | - | - | - | schema |
| telefone | string | Não | - | - | - | schema |
| email | string | Não | - | - | - | schema |
| fiscal | object | Não | - | - | - | schema |
| recebedor | object | Não | - | - | - | schema |
| status | string | Não | ativa | ativa, inativa | - | schema |

### ENTIDADE: Fornecedor

**Arquivo:** `base44/entities/Fornecedor.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| nome_fantasia | string | Sim | - | - | - | schema |
| razao_social | string | Não | - | - | - | schema |
| cnpj | string | Não | - | - | - | schema |
| categoria | string | Não | pecas | pecas, servicos, utilidades, equipamentos, outros | - | schema |
| contato_nome | string | Não | - | - | - | schema |
| telefone | string | Não | - | - | - | schema |
| email | string | Não | - | - | - | schema |
| endereco | string | Não | - | - | - | schema |
| condicao_pagamento | string | Não | - | - | - | schema |
| prazo_medio_dias | number | Não | - | - | - | schema |
| limite_credito | number | Não | - | - | - | schema |
| status | string | Não | ativo | ativo, inativo | - | schema |

### ENTIDADE: GatewayPagamento

**Arquivo:** `base44/entities/GatewayPagamento.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| provedor | string | Sim | asaas | asaas, mercado_pago, banco_inter, gerencianet, outro | - | schema |
| nome_exibicao | string | Não | - | - | - | schema |
| ambiente | string | Não | homologacao | homologacao, producao | - | schema |
| ativo | boolean | Não | true | - | - | schema |
| api_key | string | Não | - | - | - | schema |
| client_id | string | Não | - | - | Inferido | schema |
| client_secret | string | Não | - | - | - | schema |
| carteira | string | Não | - | - | - | schema |
| conta_bancaria_id | string | Não | - | - | Inferido | schema |
| webhook_url | string | Não | - | - | - | schema |
| webhook_secret | string | Não | - | - | - | schema |
| split | object | Não | - | - | - | schema |
| juros_mes | number | Não | 0 | - | - | schema |
| multa_percentual | number | Não | 0 | - | - | schema |
| dias_vencimento_padrao | number | Não | 3 | - | - | schema |
| observacoes | string | Não | - | - | - | schema |

### ENTIDADE: GpsAtendimento

**Arquivo:** `base44/entities/GpsAtendimento.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| modelo_id | string | Sim | - | - | Inferido | schema |
| modelo_nome | string | Não | - | - | - | schema |
| modelo_versao | number | Não | - | - | - | schema |
| os_id | string | Não | - | - | Inferido | schema |
| cliente_id | string | Não | - | - | Inferido | schema |
| veiculo_id | string | Não | - | - | Inferido | schema |
| lead_id | string | Não | - | - | Inferido | schema |
| consultor | string | Sim | - | - | - | schema |
| placa | string | Não | - | - | - | schema |
| combustivel_nivel | string | Não | - | reserva, um_quarto, meio, tres_quartos, cheio | - | schema |
| quilometragem | number | Não | - | - | - | schema |
| codigos_falha | array | Não | - | - | - | schema |
| observacoes_gerais | string | Não | - | - | - | schema |
| respostas | array | Não | - | - | - | schema |
| ai_analise | string | Não | - | - | - | schema |
| status | string | Não | em_andamento | em_andamento, concluido, cancelado | - | schema |
| data_inicio | string | Não | - | - | - | schema |
| data_conclusao | string | Não | - | - | - | schema |

### ENTIDADE: GpsItemConfig

**Arquivo:** `base44/entities/GpsItemConfig.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| modelo_id | string | Sim | - | - | Inferido | schema |
| tipo | string | Sim | - | pre_diagnostico, ppv, checklist | - | schema |
| categoria | string | Não | - | - | - | schema |
| titulo | string | Sim | - | - | - | schema |
| descricao | string | Não | - | - | - | schema |
| ordem | number | Não | 0 | - | - | schema |
| obrigatorio | boolean | Não | false | - | - | schema |
| ativo | boolean | Não | true | - | - | schema |
| tipo_resposta | string | Sim | texto | texto, sim_nao, multipla_escolha, numero, foto, video, audio | - | schema |
| opcoes | array | Não | - | - | - | schema |
| justificativa | string | Não | - | - | - | schema |
| objetivo_comercial | string | Não | - | - | - | schema |
| peso | number | Não | 0 | - | - | schema |
| tempo_estimado_min | number | Não | 0 | - | - | schema |
| responsavel | string | Não | - | - | - | schema |

### ENTIDADE: GpsModelo

**Arquivo:** `base44/entities/GpsModelo.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| nome | string | Sim | - | - | - | schema |
| descricao | string | Não | - | - | - | schema |
| tipo_oficina | string | Sim | linha_leve | linha_leve, diesel, moto, suv, premium, eletrica, cambio, outros | - | schema |
| versao | number | Não | 1 | - | - | schema |
| status | string | Não | ativo | ativo, inativo | - | schema |
| is_default | boolean | Não | false | - | - | schema |

### ENTIDADE: HistoricoPreco

**Arquivo:** `base44/entities/HistoricoPreco.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| peca_id | string | Sim | - | - | Inferido | schema |
| peca_codigo | string | Não | - | - | - | schema |
| peca_descricao | string | Não | - | - | - | schema |
| fornecedor_id | string | Não | - | - | Inferido | schema |
| fornecedor_nome | string | Não | - | - | - | schema |
| valor_unitario | number | Não | 0 | - | - | schema |
| quantidade | number | Não | 0 | - | - | schema |
| origem | string | Não | pedido | cotacao, pedido, recebimento, nfe | - | schema |
| documento | string | Não | - | - | - | schema |
| data | string | Não | - | - | - | schema |

### ENTIDADE: IntegracaoConfig

**Arquivo:** `base44/entities/IntegracaoConfig.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| servico | string | Sim | cnpj | cpf, cnpj, veiculo, cep | - | schema |
| nome_provedor | string | Não | - | - | - | schema |
| ativo | boolean | Não | true | - | - | schema |
| url | string | Não | - | - | - | schema |
| token | string | Não | - | - | - | schema |
| usuario | string | Não | - | - | - | schema |
| senha | string | Não | - | - | - | schema |
| timeout_ms | number | Não | 10000 | - | - | schema |
| ambiente | string | Não | producao | homologacao, producao | - | schema |
| observacoes | string | Não | - | - | - | schema |

### ENTIDADE: IntegracaoLog

**Arquivo:** `base44/entities/IntegracaoLog.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| conta_bancaria_id | string | Não | - | - | Inferido | schema |
| tipo_integracao | string | Sim | - | cnab, open_banking, manual | - | schema |
| status | string | Não | sucesso | sucesso, erro, parcial | - | schema |
| boletos_encontrados | number | Não | 0 | - | - | schema |
| boletos_criados | number | Não | 0 | - | - | schema |
| boletos_match | number | Não | 0 | - | - | schema |
| erro_detalhe | string | Não | - | - | - | schema |
| data_sync | string | Não | - | - | - | schema |

### ENTIDADE: Inventario

**Arquivo:** `base44/entities/Inventario.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| descricao | string | Sim | - | - | - | schema |
| deposito_id | string | Não | - | - | Inferido | schema |
| deposito_nome | string | Não | - | - | - | schema |
| status | string | Não | aberto | aberto, em_contagem, finalizado, cancelado | - | schema |
| itens | array | Não | - | - | - | schema |
| responsavel | string | Não | - | - | - | schema |
| data_inicio | string | Não | - | - | - | schema |
| data_finalizacao | string | Não | - | - | - | schema |

### ENTIDADE: LancamentoCaixa

**Arquivo:** `base44/entities/LancamentoCaixa.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| filial_id | string | Não | - | - | Inferido | schema |
| caixa_id | string | Não | - | - | Inferido | schema |
| descricao | string | Sim | - | - | - | schema |
| tipo | string | Sim | entrada | entrada, saida | - | schema |
| valor | number | Sim | - | - | - | schema |
| categoria | string | Não | - | - | - | schema |
| forma_pagamento | string | Não | - | pix, boleto, cartao, dinheiro, transferencia | - | schema |
| data | string | Não | - | - | - | schema |
| observacoes | string | Não | - | - | - | schema |

### ENTIDADE: Lead

**Arquivo:** `base44/entities/Lead.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| cliente_id | string | Não | - | - | Inferido | schema |
| cliente_nome | string | Não | - | - | - | schema |
| veiculo_id | string | Não | - | - | Inferido | schema |
| motorista_id | string | Não | - | - | Inferido | schema |
| placa | string | Não | - | - | - | schema |
| nome | string | Não | - | - | - | schema |
| telefone | string | Não | - | - | - | schema |
| email | string | Não | - | - | - | schema |
| consultor | string | Não | - | - | - | schema |
| origem | string | Não | manual | gps_vendas, manual, indicacao, whatsapp, telefone, site, passagem, meta_ads, google_ads, instagram, formulario, landing_page | - | schema |
| plataforma | string | Não | - | meta_ads, google_ads, instagram, whatsapp, site, indicacao, outro | - | schema |
| campanha_id | string | Não | - | - | Inferido | schema |
| campanha_nome | string | Não | - | - | - | schema |
| conjunto_anuncios | string | Não | - | - | - | schema |
| anuncio | string | Não | - | - | - | schema |
| utm_source | string | Não | - | - | - | schema |
| utm_medium | string | Não | - | - | - | schema |
| utm_campaign | string | Não | - | - | - | schema |
| utm_content | string | Não | - | - | - | schema |
| utm_term | string | Não | - | - | - | schema |
| gclid | string | Não | - | - | - | schema |
| fbclid | string | Não | - | - | - | schema |
| landing_page | string | Não | - | - | - | schema |
| url_conversao | string | Não | - | - | - | schema |
| dispositivo | string | Não | - | - | - | schema |
| navegador | string | Não | - | - | - | schema |
| cidade | string | Não | - | - | - | schema |
| estado | string | Não | - | - | - | schema |
| data_captura | string | Não | - | - | - | schema |
| primeiro_atendimento_em | string | Não | - | - | - | schema |
| qualificado | boolean | Não | false | - | - | schema |
| etapa | string | Não | novo | novo, em_contato, negociacao, ganho, perdido | - | schema |
| status | string | Não | novo | novo, em_contato, visitou, convertido, perdido | - | schema |
| valor_estimado | number | Não | 0 | - | - | schema |
| servico_interesse | string | Não | - | - | - | schema |
| motivo_perda | string | Não | - | preco, prazo, concorrencia, desistiu, sem_retorno, outro | - | schema |
| motivo_perda_detalhe | string | Não | - | - | - | schema |
| data_ganho | string | Não | - | - | - | schema |
| data_perda | string | Não | - | - | - | schema |
| proximo_followup | string | Não | - | - | - | schema |
| observacoes | string | Não | - | - | - | schema |
| data_contato | string | Não | - | - | - | schema |

### ENTIDADE: Lote

**Arquivo:** `base44/entities/Lote.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| peca_id | string | Sim | - | - | Inferido | schema |
| peca_codigo | string | Não | - | - | - | schema |
| peca_descricao | string | Não | - | - | - | schema |
| deposito_id | string | Não | - | - | Inferido | schema |
| numero_lote | string | Sim | - | - | - | schema |
| quantidade | number | Não | 0 | - | - | schema |
| consignado | boolean | Não | false | - | - | schema |
| fornecedor_id | string | Não | - | - | Inferido | schema |
| data_fabricacao | string | Não | - | - | - | schema |
| data_validade | string | Não | - | - | - | schema |
| custo_unitario | number | Não | 0 | - | - | schema |
| status | string | Não | ativo | ativo, esgotado, vencido, bloqueado | - | schema |

### ENTIDADE: MaoObra

**Arquivo:** `base44/entities/MaoObra.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| codigo | string | Sim | - | - | - | schema |
| descricao | string | Sim | - | - | - | schema |
| categoria | string | Não | mecanica | mecanica, eletrica, funilaria, pintura, alinhamento, diagnostico, hidraulica, outros | - | schema |
| tempo_estimado_min | number | Não | 0 | - | - | schema |
| tipo_cobranca | string | Sim | fixo | hora, fixo | - | schema |
| valor | number | Não | - | - | - | schema |
| valor_hora | number | Não | 0 | - | - | schema |
| centro_custo_id | string | Não | - | - | Inferido | schema |
| aliquota_iss | number | Não | 0 | - | - | schema |
| item_lista_servicos | string | Não | - | - | - | schema |
| comissao_modo | string | Não | padrao | padrao, sim, nao, personalizado | - | schema |
| comissao_percentual | number | Não | 0 | - | - | schema |
| status | string | Não | ativo | ativo, inativo | - | schema |

### ENTIDADE: Marca

**Arquivo:** `base44/entities/Marca.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| nome | string | Sim | - | - | - | schema |
| status | string | Não | ativo | ativo, inativo | - | schema |

### ENTIDADE: MarketingIntegracao

**Arquivo:** `base44/entities/MarketingIntegracao.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| plataforma | string | Sim | meta | meta, google, site, whatsapp | - | schema |
| nome | string | Não | - | - | - | schema |
| ativo | boolean | Não | false | - | - | schema |
| ambiente | string | Não | producao | homologacao, producao | - | schema |
| url_api | string | Não | - | - | - | schema |
| token | string | Não | - | - | - | schema |
| chave_secreta | string | Não | - | - | - | schema |
| conta_anuncios | string | Não | - | - | - | schema |
| pixel_id | string | Não | - | - | Inferido | schema |
| webhook_url | string | Não | - | - | - | schema |
| eventos_sincronizados | array | Não | - | - | - | schema |
| frequencia_sync | string | Não | diaria | manual, horaria, diaria | - | schema |
| ultima_sync | string | Não | - | - | - | schema |
| ultimo_status | string | Não | nunca | nunca, sucesso, erro | - | schema |
| ultimo_erro | string | Não | - | - | - | schema |
| observacoes | string | Não | - | - | - | schema |

### ENTIDADE: Mensagem

**Arquivo:** `base44/entities/Mensagem.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| conversa_id | string | Sim | - | - | Inferido | schema |
| canal | string | Não | whatsapp | whatsapp, instagram, messenger, email, site, telegram, sms, google_business, interno | - | schema |
| direcao | string | Sim | entrada | entrada, saida | - | schema |
| tipo | string | Não | texto | texto, imagem, audio, video, arquivo, template, sistema | - | schema |
| texto | string | Não | - | - | - | schema |
| midia_url | string | Não | - | - | - | schema |
| midia_nome | string | Não | - | - | - | schema |
| canal_externo_id | string | Não | - | - | Inferido | schema |
| autor_tipo | string | Não | cliente | cliente, consultor, sistema, automacao | - | schema |
| autor_id | string | Não | - | - | Inferido | schema |
| autor_nome | string | Não | - | - | - | schema |
| status_entrega | string | Não | - | pendente, enviada, entregue, lida, falhou | - | schema |
| erro_detalhe | string | Não | - | - | - | schema |
| enviada_em | string | Não | - | - | - | schema |
| referencia | object | Não | - | - | - | schema |

### ENTIDADE: MensagemAgendada

**Arquivo:** `base44/entities/MensagemAgendada.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| conversa_id | string | Não | - | - | Inferido | schema |
| cliente_id | string | Não | - | - | Inferido | schema |
| lead_id | string | Não | - | - | Inferido | schema |
| ordem_servico_id | string | Não | - | - | Inferido | schema |
| template_id | string | Não | - | - | Inferido | schema |
| evento | string | Não | - | - | - | schema |
| canal | string | Não | auto | whatsapp, instagram, messenger, email, sms, auto | - | schema |
| texto | string | Não | - | - | - | schema |
| midia_url | string | Não | - | - | - | schema |
| midia_tipo | string | Não | - | imagem, video, arquivo | - | schema |
| agendado_para | string | Sim | - | - | - | schema |
| status | string | Não | pendente | pendente, enviada, cancelada, falhou | - | schema |
| tentativas | number | Não | 0 | - | - | schema |
| enviado_em | string | Não | - | - | - | schema |
| erro_detalhe | string | Não | - | - | - | schema |
| chave_dedupe | string | Não | - | - | - | schema |
| criado_por_id | string | Não | - | - | Inferido | schema |
| criado_por_nome | string | Não | - | - | - | schema |
| empresa_id | string | Não | - | - | Inferido | schema |
| filial_id | string | Não | - | - | Inferido | schema |

### ENTIDADE: MissaoOperacional

**Arquivo:** `base44/entities/MissaoOperacional.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| numero | string | Não | - | - | - | schema |
| titulo | string | Sim | - | - | - | schema |
| ordem_servico_id | string | Não | - | - | Inferido | schema |
| os_numero | string | Não | - | - | - | schema |
| cliente_id | string | Não | - | - | Inferido | schema |
| cliente_nome | string | Não | - | - | - | schema |
| veiculo_cliente_id | string | Não | - | - | Inferido | schema |
| ativo_frota_id | string | Não | - | - | Inferido | schema |
| ativo_frota_nome | string | Não | - | - | - | schema |
| endereco | string | Não | - | - | - | schema |
| descricao | string | Não | - | - | - | schema |
| equipe | array | Não | - | - | - | schema |
| ferramentas | array | Não | - | - | - | schema |
| pecas | array | Não | - | - | - | schema |
| valor_servico | number | Não | 0 | - | - | schema |
| km_percorrido | number | Não | 0 | - | - | schema |
| custos | object | Não | - | - | - | schema |
| data_agendada | string | Não | - | - | - | schema |
| saida_em | string | Não | - | - | - | schema |
| chegada_em | string | Não | - | - | - | schema |
| inicio_em | string | Não | - | - | - | schema |
| fim_em | string | Não | - | - | - | schema |
| retorno_em | string | Não | - | - | - | schema |
| geo_marcos | object | Não | - | - | - | schema |
| rastreamento | object | Não | - | - | - | schema |
| tempo_deslocamento_min | number | Não | 0 | - | - | schema |
| tempo_atendimento_min | number | Não | 0 | - | - | schema |
| tempo_total_min | number | Não | 0 | - | - | schema |
| status | string | Não | agendado | agendado, em_deslocamento, em_execucao, concluido, cancelado | - | schema |
| historico | array | Não | - | - | - | schema |
| filial_id | string | Não | - | - | Inferido | schema |
| empresa_id | string | Não | - | - | Inferido | schema |
| observacoes | string | Não | - | - | - | schema |

### ENTIDADE: Motorista

**Arquivo:** `base44/entities/Motorista.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| nome | string | Sim | - | - | - | schema |
| cpf | string | Não | - | - | - | schema |
| telefone | string | Não | - | - | - | schema |
| cnh | string | Não | - | - | - | schema |
| cliente_id | string | Não | - | - | Inferido | schema |
| observacoes | string | Não | - | - | - | schema |

### ENTIDADE: MovimentoEstoque

**Arquivo:** `base44/entities/MovimentoEstoque.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| peca_id | string | Sim | - | - | Inferido | schema |
| peca_codigo | string | Não | - | - | - | schema |
| peca_descricao | string | Não | - | - | - | schema |
| tipo | string | Sim | entrada | entrada, saida, transferencia, ajuste_inventario, reserva, liberacao_reserva | - | schema |
| quantidade | number | Sim | 0 | - | - | schema |
| deposito_origem_id | string | Não | - | - | Inferido | schema |
| deposito_destino_id | string | Não | - | - | Inferido | schema |
| lote_id | string | Não | - | - | Inferido | schema |
| numero_lote | string | Não | - | - | - | schema |
| custo_unitario | number | Não | 0 | - | - | schema |
| documento | string | Não | - | - | - | schema |
| motivo | string | Não | - | - | - | schema |
| usuario | string | Não | - | - | - | schema |
| saldo_anterior | number | Não | 0 | - | - | schema |
| saldo_novo | number | Não | 0 | - | - | schema |
| data | string | Não | - | - | - | schema |

### ENTIDADE: MovimentoFinanceiro

**Arquivo:** `base44/entities/MovimentoFinanceiro.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| filial_id | string | Não | - | - | Inferido | schema |
| descricao | string | Sim | - | - | - | schema |
| tipo | string | Sim | receita | receita, despesa | - | schema |
| categoria | string | Não | - | - | - | schema |
| dre_grupo | string | Não | - | receita_bruta, deducoes, custo_mercadorias, despesas_operacionais, despesas_administrativas, despesas_comerciais, resultado_financeiro | - | schema |
| dfc_grupo | string | Não | - | operacional, investimento, financiamento | - | schema |
| valor | number | Sim | - | - | - | schema |
| data | string | Sim | - | - | - | schema |

### ENTIDADE: NotaFiscal

**Arquivo:** `base44/entities/NotaFiscal.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| chave_acesso | string | Não | - | - | - | schema |
| numero | string | Não | - | - | - | schema |
| serie | string | Não | - | - | - | schema |
| tipo | string | Sim | entrada | entrada, saida | - | schema |
| emitente_cnpj | string | Não | - | - | - | schema |
| emitente_nome | string | Não | - | - | - | schema |
| destinatario_cnpj | string | Não | - | - | - | schema |
| destinatario_nome | string | Não | - | - | - | schema |
| destinatario_endereco | string | Não | - | - | - | schema |
| cliente_id | string | Não | - | - | Inferido | schema |
| veiculo_id | string | Não | - | - | Inferido | schema |
| ordem_servico_id | string | Não | - | - | Inferido | schema |
| natureza_operacao | string | Não | - | - | - | schema |
| cfop | string | Não | - | - | - | schema |
| valor_produtos | number | Não | 0 | - | - | schema |
| valor_servicos | number | Não | 0 | - | - | schema |
| valor_desconto | number | Não | 0 | - | - | schema |
| valor_total | number | Não | - | - | - | schema |
| valor_tributos | number | Não | 0 | - | - | schema |
| tributos_detalhe | object | Não | - | - | - | schema |
| data_emissao | string | Não | - | - | - | schema |
| xml_original | string | Não | - | - | - | schema |
| xml_url | string | Não | - | - | - | schema |
| pdf_url | string | Não | - | - | - | schema |
| protocolo | string | Não | - | - | - | schema |
| itens | array | Não | - | - | - | schema |
| forma_pagamento | string | Não | - | pix, cartao, boleto, dinheiro, transferencia, parcelado | - | schema |
| numero_parcelas | number | Não | 1 | - | - | schema |
| pedido_compra_id | string | Não | - | - | Inferido | schema |
| contas_pagar_ids | array | Não | - | - | - | schema |
| contas_receber_ids | array | Não | - | - | - | schema |
| fornecedor_id | string | Não | - | - | Inferido | schema |
| status | string | Não | aguardando_conferencia | aguardando_conferencia, processada, rascunho, autorizada, cancelada, erro, duplicada | - | schema |
| recebimento_completo | boolean | Não | true | - | - | schema |
| motivo_cancelamento | string | Não | - | - | - | schema |
| data_cancelamento | string | Não | - | - | - | schema |
| historico | array | Não | - | - | - | schema |
| erro_detalhe | string | Não | - | - | - | schema |
| origem | string | Não | webhook | webhook, manual, os | - | schema |

### ENTIDADE: Ocorrencia

**Arquivo:** `base44/entities/Ocorrencia.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| numero | string | Não | - | - | - | schema |
| titulo | string | Sim | - | - | - | schema |
| descricao | string | Não | - | - | - | schema |
| tipo | string | Não | incidente | incidente, atraso, falha_equipamento, seguranca, qualidade, reclamacao, outro | - | schema |
| gravidade | string | Não | media | baixa, media, alta, critica | - | schema |
| data_ocorrencia | string | Não | - | - | - | schema |
| registrada_por_nome | string | Não | - | - | - | schema |
| responsavel_id | string | Não | - | - | Inferido | schema |
| responsavel_nome | string | Não | - | - | - | schema |
| tarefa_id | string | Não | - | - | Inferido | schema |
| referencia | object | Não | - | - | - | schema |
| acoes | array | Não | - | - | - | schema |
| fotos | array | Não | - | - | - | schema |
| status | string | Não | aberta | aberta, em_tratamento, resolvida, cancelada | - | schema |
| resolvida_em | string | Não | - | - | - | schema |
| filial_id | string | Não | - | - | Inferido | schema |
| empresa_id | string | Não | - | - | Inferido | schema |

### ENTIDADE: Orcamento

**Arquivo:** `base44/entities/Orcamento.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| filial_id | string | Não | - | - | Inferido | schema |
| centro_custo_id | string | Não | - | - | Inferido | schema |
| categoria | string | Sim | - | - | - | schema |
| periodo_mes | number | Sim | - | - | - | schema |
| periodo_ano | number | Sim | - | - | - | schema |
| valor_orcado | number | Sim | - | - | - | schema |
| status | string | Não | ativo | ativo, fechado | - | schema |

### ENTIDADE: OrdemServico

**Arquivo:** `base44/entities/OrdemServico.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| numero | string | Não | - | - | - | schema |
| cliente_id | string | Sim | - | - | Inferido | schema |
| veiculo_id | string | Sim | - | - | Inferido | schema |
| descricao_problema | string | Não | - | - | - | schema |
| itens | array | Não | - | - | - | schema |
| distribuicao_faturamento | object | Não | - | - | - | schema |
| valor_pecas | number | Não | 0 | - | - | schema |
| valor_servicos | number | Não | 0 | - | - | schema |
| valor_desconto | number | Não | 0 | - | - | schema |
| valor_total | number | Não | 0 | - | - | schema |
| custo_total | number | Não | 0 | - | - | schema |
| aprovacao_parcial | object | Não | - | - | - | schema |
| condicao_pagamento | object | Não | - | - | - | schema |
| tecnico_responsavel | string | Não | - | - | - | schema |
| consultor | string | Não | - | - | - | schema |
| consultor_id | string | Não | - | - | Inferido | schema |
| criado_por_id | string | Não | - | - | Inferido | schema |
| criado_por_nome | string | Não | - | - | - | schema |
| qualidade_por_id | string | Não | - | - | Inferido | schema |
| qualidade_por_nome | string | Não | - | - | - | schema |
| filial_id | string | Não | - | - | Inferido | schema |
| empresa_id | string | Não | - | - | Inferido | schema |
| origem_marketing | object | Não | - | - | - | schema |
| data_abertura | string | Não | - | - | - | schema |
| data_prevista | string | Não | - | - | - | schema |
| data_fechamento | string | Não | - | - | - | schema |
| quilometragem_entrada | number | Não | - | - | - | schema |
| status | string | Não | orcamento | orcamento, aprovado, em_andamento, concluido, cancelado | - | schema |
| etapa_fluxo | string | Não | recepcao | recepcao, diagnostico, orcamento, aprovacao, compra, execucao, qualidade, aguardando_faturamento, nota_emitida, pagamento, entrega, pos_venda | - | schema |
| timeline | array | Não | - | - | - | schema |
| comentarios | array | Não | - | - | - | schema |
| fotos | array | Não | - | - | - | schema |
| videos | array | Não | - | - | - | schema |
| audios | array | Não | - | - | - | schema |
| arquivos | array | Não | - | - | - | schema |
| checklist_producao | array | Não | - | - | - | schema |
| execucao_inicio | string | Não | - | - | - | schema |
| execucao_fim | string | Não | - | - | - | schema |
| horas_trabalhadas | number | Não | 0 | - | - | schema |
| sessoes_producao | array | Não | - | - | - | schema |
| elevador_id | string | Não | - | - | Inferido | schema |
| retrabalho | boolean | Não | false | - | - | schema |
| tipo_retrabalho | string | Não | nenhum | nenhum, interno, retorno_cliente | - | schema |
| os_origem_id | string | Não | - | - | Inferido | schema |
| os_origem_numero | string | Não | - | - | - | schema |
| motivo_retrabalho | string | Não | - | - | - | schema |
| motivo_recusa | string | Não | - | preco, prazo, concorrencia, vai_esperar, desistiu, outro | - | schema |
| motivo_recusa_detalhe | string | Não | - | - | - | schema |
| data_recusa | string | Não | - | - | - | schema |
| gps_atendimento_id | string | Não | - | - | Inferido | schema |
| conta_receber_id | string | Não | - | - | Inferido | schema |
| nota_fiscal_id | string | Não | - | - | Inferido | schema |
| pedidos_compra_ids | array | Não | - | - | - | schema |
| origem | string | Não | manual | manual, orcamento | - | schema |
| observacoes | string | Não | - | - | - | schema |

### ENTIDADE: OsExcluida

**Arquivo:** `base44/entities/OsExcluida.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| os_numero | string | Não | - | - | - | schema |
| os_id_original | string | Não | - | - | - | schema |
| cliente_nome | string | Não | - | - | - | schema |
| veiculo_placa | string | Não | - | - | - | schema |
| valor_total | number | Não | 0 | - | - | schema |
| status_anterior | string | Não | - | - | - | schema |
| motivo | string | Sim | - | - | - | schema |
| excluido_por_id | string | Não | - | - | Inferido | schema |
| excluido_por_nome | string | Não | - | - | - | schema |
| data_exclusao | string | Não | - | - | - | schema |
| snapshot | object | Não | - | - | - | schema |

### ENTIDADE: Patrimonio

**Arquivo:** `base44/entities/Patrimonio.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| codigo_patrimonial | string | Não | - | - | - | schema |
| nome | string | Sim | - | - | - | schema |
| tipo | string | Sim | ferramenta | ferramenta, equipamento, maquina, notebook, scanner, epi, mobiliario, outro | - | schema |
| categoria | string | Não | - | - | - | schema |
| marca | string | Não | - | - | - | schema |
| modelo | string | Não | - | - | - | schema |
| numero_serie | string | Não | - | - | - | schema |
| descricao | string | Não | - | - | - | schema |
| responsavel_id | string | Não | - | - | Inferido | schema |
| responsavel_nome | string | Não | - | - | - | schema |
| localizacao | string | Não | - | - | - | schema |
| filial_id | string | Não | - | - | Inferido | schema |
| valor_compra | number | Não | 0 | - | - | schema |
| data_compra | string | Não | - | - | - | schema |
| fornecedor_id | string | Não | - | - | Inferido | schema |
| vida_util_meses | number | Não | 0 | - | - | schema |
| valor_residual | number | Não | 0 | - | - | schema |
| manutencao_preventiva | object | Não | - | - | - | schema |
| historico | array | Não | - | - | - | schema |
| fotos | array | Não | - | - | - | schema |
| documentos | array | Não | - | - | - | schema |
| status | string | Não | ativo | ativo, em_manutencao, emprestado, baixado, extraviado | - | schema |
| observacoes | string | Não | - | - | - | schema |

### ENTIDADE: Peca

**Arquivo:** `base44/entities/Peca.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| codigo | string | Sim | - | - | - | schema |
| descricao | string | Sim | - | - | - | schema |
| marca | string | Não | - | - | - | schema |
| categoria | string | Não | outros | motor, freio, suspensao, eletrica, transmissao, carroceria, acessorios, fluidos, outros | - | schema |
| unidade | string | Não | UN | UN, CX, KG, L, MT, PCT | - | schema |
| codigo_barras | string | Não | - | - | - | schema |
| qr_code | string | Não | - | - | - | schema |
| fornecedor_principal_id | string | Não | - | - | Inferido | schema |
| deposito_principal_id | string | Não | - | - | Inferido | schema |
| estoque_atual | number | Não | 0 | - | - | schema |
| estoque_reservado | number | Não | 0 | - | - | schema |
| estoque_consignado | number | Não | 0 | - | - | schema |
| estoque_minimo | number | Não | 0 | - | - | schema |
| estoque_maximo | number | Não | 0 | - | - | schema |
| ponto_reposicao | number | Não | 0 | - | - | schema |
| controla_lote | boolean | Não | false | - | - | schema |
| curva_abc | string | Não |  | A, B, C,  | - | schema |
| localizacao | string | Não | - | - | - | schema |
| valor_custo_medio | number | Não | 0 | - | - | schema |
| valor_ultima_compra | number | Não | 0 | - | - | schema |
| margem | number | Não | 0 | - | - | schema |
| valor_venda | number | Não | 0 | - | - | schema |
| ncm | string | Não | - | - | - | schema |
| cest | string | Não | - | - | - | schema |
| cfop | string | Não | - | - | - | schema |
| origem | string | Não | 0 | 0, 1, 2, 3, 4, 5, 6, 7, 8 | - | schema |
| aliquota_icms | number | Não | 0 | - | - | schema |
| aliquota_ipi | number | Não | 0 | - | - | schema |
| aliquota_pis | number | Não | 0 | - | - | schema |
| aliquota_cofins | number | Não | 0 | - | - | schema |
| comissao_modo | string | Não | padrao | padrao, sim, nao, personalizado | - | schema |
| comissao_percentual | number | Não | 0 | - | - | schema |
| status | string | Não | ativo | ativo, inativo | - | schema |

### ENTIDADE: PedidoCompra

**Arquivo:** `base44/entities/PedidoCompra.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| numero | string | Não | - | - | - | schema |
| ordem_servico_id | string | Não | - | - | Inferido | schema |
| requisicao_id | string | Não | - | - | Inferido | schema |
| cotacao_id | string | Não | - | - | Inferido | schema |
| fornecedor_id | string | Sim | - | - | Inferido | schema |
| filial_id | string | Não | - | - | Inferido | schema |
| deposito_id | string | Não | - | - | Inferido | schema |
| itens | array | Não | - | - | - | schema |
| valor_produtos | number | Não | 0 | - | - | schema |
| valor_frete | number | Não | 0 | - | - | schema |
| valor_total | number | Não | 0 | - | - | schema |
| condicao_pagamento | string | Não | - | - | - | schema |
| prazo_entrega_dias | number | Não | 0 | - | - | schema |
| rateio | array | Não | - | - | - | schema |
| recebimentos | array | Não | - | - | - | schema |
| data_emissao | string | Não | - | - | - | schema |
| data_prevista_entrega | string | Não | - | - | - | schema |
| data_recebimento | string | Não | - | - | - | schema |
| status | string | Não | aberto | aberto, enviado, recebido_parcial, recebido, backorder, cancelado | - | schema |
| conta_pagar_id | string | Não | - | - | Inferido | schema |
| nota_fiscal_id | string | Não | - | - | Inferido | schema |
| observacoes | string | Não | - | - | - | schema |

### ENTIDADE: PlanoConta

**Arquivo:** `base44/entities/PlanoConta.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| codigo | string | Sim | - | - | - | schema |
| nome | string | Sim | - | - | - | schema |
| tipo | string | Não | despesa | receita, despesa, custo, ativo, passivo, patrimonio | - | schema |
| natureza | string | Não | analitica | sintetica, analitica | - | schema |
| pai_id | string | Não | - | - | Inferido | schema |
| dre_grupo | string | Não | - | receita_bruta, deducoes, custo_mercadorias, despesas_operacionais, despesas_administrativas, despesas_comerciais, resultado_financeiro | - | schema |
| status | string | Não | ativo | ativo, inativo | - | schema |

### ENTIDADE: RegraComissao

**Arquivo:** `base44/entities/RegraComissao.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| nome | string | Sim | - | - | - | schema |
| descricao | string | Não | - | - | - | schema |
| escopo | string | Não | global | global, colaborador, categoria, cargo | - | schema |
| colaborador_id | string | Não | - | - | Inferido | schema |
| cargo_id | string | Não | - | - | Inferido | schema |
| categoria | string | Não | - | - | - | schema |
| prioridade | number | Não | 0 | - | - | schema |
| comissao_mao_obra_percentual | number | Não | 0 | - | - | schema |
| comissao_peca_percentual | number | Não | 0 | - | - | schema |
| comissao_servico_terceirizado_percentual | number | Não | 0 | - | - | schema |
| usar_margem | boolean | Não | false | - | - | schema |
| margem_minima | number | Não | 0 | - | - | schema |
| comissao_por_margem_percentual | number | Não | 0 | - | - | schema |
| regras_categoria | array | Não | - | - | - | schema |
| status | string | Não | ativo | ativo, inativo | - | schema |

### ENTIDADE: Requisicao

**Arquivo:** `base44/entities/Requisicao.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| numero | string | Não | - | - | - | schema |
| solicitante | string | Não | - | - | - | schema |
| solicitante_id | string | Não | - | - | Inferido | schema |
| filial_id | string | Não | - | - | Inferido | schema |
| centro_custo_id | string | Não | - | - | Inferido | schema |
| ordem_servico_id | string | Não | - | - | Inferido | schema |
| os_numero | string | Não | - | - | - | schema |
| cliente_id | string | Não | - | - | Inferido | schema |
| cliente_nome | string | Não | - | - | - | schema |
| justificativa | string | Não | - | - | - | schema |
| prioridade | string | Não | media | baixa, media, alta, urgente | - | schema |
| itens | array | Sim | - | - | - | schema |
| status | string | Não | solicitada | solicitada, em_cotacao, cotada, aprovada, reprovada, convertida, cancelada | - | schema |
| data_necessidade | string | Não | - | - | - | schema |
| observacoes | string | Não | - | - | - | schema |

### ENTIDADE: ServicoComposto

**Arquivo:** `base44/entities/ServicoComposto.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| codigo | string | Sim | - | - | - | schema |
| descricao | string | Sim | - | - | - | schema |
| itens_mao_obra | array | Não | - | - | - | schema |
| itens_pecas_sugeridas | array | Não | - | - | - | schema |
| tipo_valor | string | Sim | calculado | calculado, manual | - | schema |
| valor_total | number | Não | 0 | - | - | schema |
| status | string | Não | ativo | ativo, inativo | - | schema |

### ENTIDADE: TarefaOperacional

**Arquivo:** `base44/entities/TarefaOperacional.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| titulo | string | Sim | - | - | - | schema |
| descricao | string | Não | - | - | - | schema |
| tipo | string | Não | tarefa | tarefa, manutencao, limpeza, inspecao, vencimento, reuniao, outro | - | schema |
| prioridade | string | Não | media | baixa, media, alta | - | schema |
| data_prevista | string | Não | - | - | - | schema |
| hora_prevista | string | Não | - | - | - | schema |
| responsavel_id | string | Não | - | - | Inferido | schema |
| responsavel_nome | string | Não | - | - | - | schema |
| checklist | array | Não | - | - | - | schema |
| recorrencia | object | Não | - | - | - | schema |
| modelo_id | string | Não | - | - | Inferido | schema |
| referencia | object | Não | - | - | - | schema |
| status | string | Não | pendente | pendente, em_andamento, concluida, cancelada | - | schema |
| concluida_em | string | Não | - | - | - | schema |
| concluida_por_nome | string | Não | - | - | - | schema |
| filial_id | string | Não | - | - | Inferido | schema |
| empresa_id | string | Não | - | - | Inferido | schema |
| observacoes | string | Não | - | - | - | schema |

### ENTIDADE: TemplateMensagem

**Arquivo:** `base44/entities/TemplateMensagem.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| nome | string | Sim | - | - | - | schema |
| descricao | string | Não | - | - | - | schema |
| evento | string | Não | manual | manual, os_finalizada, orcamento_enviado, orcamento_sem_resposta, so_perguntou, os_etapa, lead_novo, pos_venda, lembrete_retorno | - | schema |
| etapa_os | string | Não | - | - | - | schema |
| atraso_valor | number | Não | 0 | - | - | schema |
| atraso_unidade | string | Não | dias | minutos, horas, dias | - | schema |
| canal | string | Não | auto | whatsapp, instagram, messenger, email, sms, auto | - | schema |
| texto | string | Sim | - | - | - | schema |
| midia_url | string | Não | - | - | - | schema |
| midia_tipo | string | Não | - | imagem, video, arquivo | - | schema |
| ativo | boolean | Não | true | - | - | schema |
| empresa_id | string | Não | - | - | Inferido | schema |
| filial_id | string | Não | - | - | Inferido | schema |

### ENTIDADE: TransacaoBancaria

**Arquivo:** `base44/entities/TransacaoBancaria.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| conta_bancaria_id | string | Não | - | - | Inferido | schema |
| data | string | Sim | - | - | - | schema |
| descricao | string | Não | - | - | - | schema |
| documento | string | Não | - | - | - | schema |
| tipo | string | Não | credito | credito, debito | - | schema |
| valor | number | Sim | 0 | - | - | schema |
| status | string | Não | pendente | pendente, conciliado, ignorado | - | schema |
| conciliado_tipo | string | Não | - | conta_pagar, conta_receber, lancamento_caixa, manual | - | schema |
| conciliado_id | string | Não | - | - | Inferido | schema |
| observacoes | string | Não | - | - | - | schema |

### ENTIDADE: User

**Arquivo:** `base44/entities/User.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| role | string | Sim | - | admin, user | - | schema |

### ENTIDADE: Veiculo

**Arquivo:** `base44/entities/Veiculo.jsonc`

| Campo | Tipo | Obrigatório | Default | Enum | Relacionamento | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| cliente_id | string | Não | - | - | Inferido | schema |
| placa | string | Sim | - | - | - | schema |
| renavam | string | Não | - | - | - | schema |
| marca | string | Não | - | - | - | schema |
| modelo | string | Não | - | - | - | schema |
| versao | string | Não | - | - | - | schema |
| ano | number | Não | - | - | - | schema |
| ano_modelo | number | Não | - | - | - | schema |
| motorizacao | string | Não | - | - | - | schema |
| cor | string | Não | - | - | - | schema |
| chassi | string | Não | - | - | - | schema |
| combustivel | string | Não | - | gasolina, etanol, flex, diesel, eletrico, hibrido, gnv | - | schema |
| categoria | string | Não | - | - | - | schema |
| municipio | string | Não | - | - | - | schema |
| uf | string | Não | - | - | - | schema |
| situacao | string | Não | - | - | - | schema |
| quilometragem | number | Não | 0 | - | - | schema |
| proprietario_nome | string | Não | - | - | - | schema |
| proprietario_documento | string | Não | - | - | - | schema |
| origem_dados | string | Não | manual | manual, consulta_placa | - | schema |
| historico_clientes | array | Não | - | - | - | schema |
| observacoes | string | Não | - | - | - | schema |
| status | string | Não | ativo | ativo, inativo | - | schema |

