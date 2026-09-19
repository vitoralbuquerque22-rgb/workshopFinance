# MOTOR OPERACIONAL MIGRATION

Comparativo entre o Motor Síncrono Legado e o Outbox Assíncrono Moderno.

| Comportamento Atual (Base44) | Implementação Atual | Nova Implementação | Mudança Observável? |
| :--- | :--- | :--- | :--- |
| **Gatilho de Eventos** | Frontend faz POST para o Backend chamando \`base44.functions.invoke\` | Backend NestJS salva o evento na tabela de \`EventOutbox\` no mesmo Commit do Banco de Dados. | NENHUMA. Continua ocorrendo automaticamente no término das operações (OS, etc). |
| **Sincronicidade** | SÍNCRONA. Usa \`await\` sequencial para atualizar Producao, Financeiro e CRM. Se der timeout, falha metade do processo. | ASSÍNCRONA (Worker). Um Deamon BullMQ engole o registro da tabela Outbox e processa num processo secundário Node.js isolado da requisição HTTP original. | SIM. A resposta da API finalizando a OS retornará em 200ms em vez de 3s (performance boost massivo). A inserção de Log Operacional poderá ter um delay invisível de ~500ms. |
| **Resiliência a Falhas** | ZERO. Apenas envia \`.catch(console.error)\`. Se o CRM estiver fora do ar, o card do Lead é simplesmente perdido para sempre. | ALTA. \`Retry\` com Exponential Backoff (3 tentativas: imediato, 1 min, 5 min). | NENHUMA p/ usuário. Nos bastidores: Paridade máxima garantida sem lixo. |
| **Registro Auditoria** | Salva na tabela \`EventoOperacional\`. | O Worker assíncrono finaliza a execução criando o MESMO log na tabela \`EventoOperacional\`. | NENHUMA. |
