# DEPLOYMENT ARCHITECTURE

- **Infraestrutura:** Docker Containers gerenciados por ECS/Fargate (AWS) ou Kubernetes.
- **CI/CD:** GitHub Actions.
- **Pipeline:** Valida linting, roda Testes de Paridade obrigatórios e executa build de imagens.
- Migrações do banco gerenciadas obrigatoriamente por `npx prisma migrate deploy` no boot da API principal.
