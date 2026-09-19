# LACUNAS DE ENTENDIMENTO (GAPS) - STATUS FINAL

### GAP-001: Integrações Financeiras (DDA e Boletos)
* **Status:** RESOLVIDO
* **Descoberta:** Não existe API de Open Banking nativa implementada no código. A função `syncDda` na verdade é um **Parser de CNAB 240** que lê a string `cnab_content` (provavelmente enviada via upload de arquivo no frontend) ou recebe um array de boletos manuais (`inputBoletos`). A automação `DDADailySync.jsonc` existe, mas no momento ela executa "no vazio" (mock) e apenas registra no `IntegracaoLog` se não receber os dados.

### GAP-002: Gatilhos do "Motor Operacional"
* **Status:** RESOLVIDO
* **Descoberta:** O `motorOperacional/entry.ts` é uma função síncrona/seqüencial (`await handler()`). **Não existe fila real (Queue/Worker), não existe retry e não existe paralelismo.**
* **Risco de Loop:** Baixo. Ele apenas mapeia um `evento` (ex: `os_aprovada`) para módulos e executa atualizações estritas (ex: update `Patrimonio`). Ele *não* dispara novos eventos recursivamente.
* **Idempotência:** PARCIAL. Os handlers tentam checar o status antes de atualizar (`if (os && !os.etapa_fluxo)`), mas se ocorrer um timeout na metade da execução, o log `EventoOperacional` não será criado e o motor pode rodar pela metade.

### GAP-003: Limites de Invocações Serverless (Timeout)
* **Status:** NÃO RESOLVIDO (NÃO DETERMINÁVEL)
* **Descoberta:** O repositório não contém arquivos de configuração de infraestrutura (ex: `serverless.yml`, `terraform`, etc) nem parâmetros no `Deno.serve` que indiquem timeout, memória ou retries nativos. Esse limite é imposto arbitrariamente pela nuvem da Base44.

### GAP-004: Autenticação
* **Status:** RESOLVIDO
* **Fluxo Descoberto:** A autenticação é no formato **SSO Redirect**.
  1. O usuário é redirecionado para um portal de login externo da Base44 (`base44.auth.redirectToLogin`).
  2. O retorno acontece via URL contendo um query parameter: `?access_token=...`
  3. O arquivo `src/lib/app-params.js` intercepta a URL, lê o `access_token`, limpa a URL (usando `window.history.replaceState` para esconder o token) e salva no `localStorage` como `base44_access_token`.
  4. O arquivo `AuthContext.jsx` lê o token da RAM/localStorage, injeta no Axios e chama a rota `/api/apps/public/.../prod/public-settings` e `base44.auth.me()`.
