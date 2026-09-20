# Base App

Base reutilizável para aplicações administrativas com monorepo pnpm/Turborepo, frontend Next.js, API NestJS, PostgreSQL, Prisma e Better Auth.

## Requisitos

- Node.js 24.14 ou superior
- pnpm 12.3.4
- Docker com Docker Compose

## Início rápido

```bash
pnpm install --frozen-lockfile
cp .env.example .env
pnpm db:up
pnpm db:deploy
pnpm auth:create-admin
pnpm dev
```

O arquivo `.env` deve conter um `BETTER_AUTH_SECRET` com pelo menos 32 caracteres. Gere um valor local com `openssl rand -hex 32`.

| Serviço | Endereço |
| --- | --- |
| Frontend | http://localhost:3000 |
| Login | http://localhost:3000/login |
| Dashboard | http://localhost:3000/dashboard |
| API | http://localhost:3001 |
| Liveness | http://localhost:3001/health |
| Readiness | http://localhost:3001/health/ready |
| Prisma Studio | http://localhost:5555 |
| PostgreSQL | `localhost:5432` |

## Estrutura

```text
apps/
├── api/       # API NestJS
├── e2e/       # jornadas Playwright
└── web/       # frontend Next.js
packages/
├── auth/      # configuração compartilhada do Better Auth
└── database/  # Prisma e PostgreSQL
```

As páginas internas ficam em `apps/web/src/app/(system)` e são protegidas por sessão. A base inclui dashboard de referência, login, logout e administração de usuários com papéis `admin` e `collaborator`.

## Comandos

| Comando | Finalidade |
| --- | --- |
| `pnpm dev` | inicia web, API e Prisma Studio |
| `pnpm build` | compila os workspaces |
| `pnpm lint` | executa análise estática |
| `pnpm typecheck` | valida os tipos |
| `pnpm test` | executa testes unitários |
| `pnpm test:integration` | executa testes com PostgreSQL |
| `pnpm test:e2e` | executa E2E da API e do navegador |
| `pnpm test:e2e:web` | executa Playwright |
| `pnpm db:up` | inicia o PostgreSQL local |
| `pnpm db:down` | encerra os contêineres sem apagar o volume |
| `pnpm db:deploy` | aplica migrations existentes |
| `pnpm db:migrate --name nome` | cria uma migration de desenvolvimento |
| `pnpm db:studio` | abre o Prisma Studio |
| `pnpm auth:create-admin` | cria um administrador por prompt seguro |

## Validação

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm build
```

Para a jornada completa de navegador:

```bash
pnpm test:e2e:install
pnpm test:e2e:web
```

Os testes de integração e E2E exigem o PostgreSQL iniciado e migrado.
