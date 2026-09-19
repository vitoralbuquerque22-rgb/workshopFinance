# AUTH IMPLEMENTATION BLUEPRINT

1. **Next.js Server Actions / API Routes** cuidam do formulário.
2. Pedem um token para a **NestJS Auth API**.
3. NestJS retorna o JWT dentro de um cabeçalho `Set-Cookie: Authorization=Bearer...; HttpOnly; Secure; SameSite=Strict`.
4. Browser armazena e envia passivamente. Fim do LocalStorage.
