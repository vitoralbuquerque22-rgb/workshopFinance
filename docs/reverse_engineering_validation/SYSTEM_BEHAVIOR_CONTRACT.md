# CONTRATO DE COMPORTAMENTO DO SISTEMA (AGNOSTIC)

Contrato independente de tecnologia. A nova implementação deve aceitar e retornar exatamente os efeitos estipulados aqui, não importa se usará Prisma, RabbitMQ, NestJS, ou Go.

### DOMÍNIO: FINANCEIRO - CONCILIAÇÃO DDA
**ENTRADA:** Array de Objetos CNAB Parser `{ valor, vencimento, pagador_cnpj }`
**REGRA:** Comparação Linear (Valor exato com margem 0.01 + Vencimento string igual)
**PROCESSAMENTO:** 
 - Se encontrar um Título `ContaPagar` pendente no banco: Update para `dda_confirmado = true`.
 - Se NÃO encontrar: Create novo `ContaPagar` com status `pendente`.
**SAÍDA:** JSON `{ status, boletos_match, boletos_criados, log_id }`
**EFEITOS:** Gravação do registro transacional final na tabela `IntegracaoLog`.

### DOMÍNIO: OPERACIONAL - SINALIZAÇÃO DE ESTADO
**ENTRADA:** Objeto Evento via POST `{ evento: "os_aprovada", ordem_servico_id: UUID }`
**REGRA:** Despacho condicional baseado no nome do evento.
**PROCESSAMENTO:**
 - Update Tabela `OrdemServico` `etapa_fluxo` = "recepcao".
**SAÍDA:** JSON `{ status: "sucesso", modulos_atualizados: ["producao", "financeiro", ...] }`
**EFEITOS:** Cria registro imutável em `EventoOperacional` contendo o payload e a descrição para alimentar o Dashboard Executivo. (O motor funciona como a "Cola" entre os microsserviços do ERP).

### DOMÍNIO: AUTENTICAÇÃO - BOOTSTRAP DE ACESSO
**ENTRADA:** URL Request `https://app.com/?access_token=XYZ123`
**REGRA:** Limpeza visual de rota.
**PROCESSAMENTO:** O Javascript tira o token da URL pelo history pushState e salva em Storage Local.
**SAÍDA:** Header de Requisição Automático: `Authorization: Bearer XYZ123`.
**EFEITOS:** Libera o roteamento privado do React. Em caso de 401 Unauthorized do servidor, limpa o Cache e chama redirecionamento para o Provider de Identidade Central.
