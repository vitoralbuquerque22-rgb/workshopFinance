# SYNC / ASYNC BOUNDARIES

Definição estrita do que roda no loop principal (Request-Response) e o que é empurrado para Background Workers.

| Operação | Síncrono | Assíncrono | Motivo / Restrição |
| :--- | :--- | :--- | :--- |
| **Finalizar OS** (Update OS + Update Km) | SIM | Não | Consistência crítica. O usuário não pode ver a OS "Finalizada" mas a Km antiga. |
| **Criar ContaReceber / Parcela** | SIM | Não | Evitar fatura órfã. Obrigatório pela CRITICAL-BR-002. |
| **Snapshot de Deleção (OsExcluida)** | SIM | Não | Auditoria legal. Não pode ser assíncrono pois se o worker falhar, perde-se a prova do crime. |
| **Aproveitamento de Lead (Reprovar OS)** | SIM | Não | Usuário precisa ver no CRM o card movido imediatamente. Impacto transacional direto. |
| **Enviar E-mail de Exclusão (Admins)** | Não | SIM | Side-effect. Depende de SMTP de terceiro (ex: AWS SES, Resend). A exclusão não pode falhar só porque o e-mail deu erro 502. |
| **Notificação de WhatsApp (Cliente)** | Não | SIM | Side-effect. API de terceiros instável. |
| **Varredura DDA (Boleto CNAB)** | Não | SIM | Batch Processing. Parseamento pesado de arquivos texto. |
| **Atualização do Motor Operacional (BI/Dash)** | Não | SIM | Side-effect analítico. |
