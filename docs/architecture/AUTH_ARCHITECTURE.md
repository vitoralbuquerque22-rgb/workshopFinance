# AUTH ARCHITECTURE

- A transição do Base44 exigirá o rompimento do SSO genérico atual, que deixava o access token visível na URL.
- **Nova Abordagem:** OIDC (OAuth 2.1). O Backend (NestJS) exporá endpoints de Login que emitirão um JWT criptografado em cookie **HTTPOnly, Secure e SameSite=Strict**.
- O Next.js agirá como consumidor, dependendo do cookie de sessão que o browser anexará automaticamente às requisições do BFF (Backend for Frontend).
