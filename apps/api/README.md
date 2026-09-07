# API

Backend do Mosaic Gestão, construído com NestJS e integrado ao PostgreSQL pelo pacote compartilhado `@mosaicgestao/database`.

## Execução

Inicie antes o PostgreSQL e aplique as migrations a partir da raiz:

```bash
pnpm db:up
pnpm db:deploy
pnpm --filter api dev
```

A API fica disponível em http://localhost:3001.

## Endpoints atuais

| Método | Rota            | Finalidade                     |
| ------ | --------------- | ------------------------------ |
| `GET`  | `/`             | resposta inicial da aplicação  |
| `GET`  | `/health`       | liveness da API                |
| `GET`  | `/health/ready` | readiness incluindo PostgreSQL |

## Comandos

```bash
pnpm --filter api dev
pnpm --filter api build
pnpm --filter api lint
pnpm --filter api typecheck
pnpm --filter api test
pnpm --filter api test:coverage
pnpm --filter api test:integration
pnpm --filter api test:e2e
```

Testes de integração e E2E da API precisam de `DATABASE_URL` válido e PostgreSQL com as migrations aplicadas.

## Organização

```text
src/
├── config/      validação tipada do ambiente
├── database/    ciclo de conexão com Prisma
├── health/      liveness e readiness
└── main.ts      bootstrap da aplicação
test/            integração e E2E HTTP
```

Novas funcionalidades devem ser agrupadas por módulo de domínio, mantendo controller, aplicação e persistência com responsabilidades separadas. Regras críticas devem ser testadas no nível mais baixo adequado, e endpoints devem ter cobertura de integração quando acessarem o banco.

Consulte o [`README` raiz](../../README.md) para bootstrap, decisões de persistência, stack e fluxo Git.
