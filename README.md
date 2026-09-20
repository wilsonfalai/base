# Base App

Base reutilizável para aplicações administrativas com monorepo pnpm/Turborepo, frontend Next.js, API NestJS, PostgreSQL, Prisma e Better Auth.

## Ponto de partida desta base

Este repositório é um ponto inicial técnico, não um produto pronto. Ele foi preparado para receber diferentes sistemas administrativos sem carregar regras de negócio de um projeto anterior.

Já estão implementados e validados:

- monorepo com pnpm e Turborepo;
- frontend Next.js com layout administrativo, sidebar e dashboard de referência;
- API NestJS com configuração tipada e endpoints de saúde;
- PostgreSQL, Prisma, migrations e Prisma Studio;
- autenticação por e-mail e senha com Better Auth;
- login, logout, sessão compartilhada entre frontend e API e proteção das rotas internas;
- administração de usuários com papéis `admin` e `collaborator`;
- auditoria básica das operações de usuários;
- testes unitários, de integração, E2E da API e Playwright.

O banco contém somente os modelos genéricos de autenticação e auditoria. Não existem entidades, telas ou regras de um domínio de negócio. O nome `Base App`, o namespace `@base-app/*` e o banco `base_app` são identificadores provisórios.

## Como iniciar um produto novo

Antes de implementar funcionalidades, adicione na raiz um arquivo com a descrição do produto, preferencialmente `projeto.prd`, ou uma documentação equivalente em `docs/`. Esse documento deve registrar de forma objetiva:

- problema que o produto resolve e público-alvo;
- escopo inicial e funcionalidades prioritárias;
- principais entidades e regras de negócio;
- papéis de usuário e regras de autorização;
- integrações externas;
- critérios de aceite e requisitos não funcionais relevantes.

Com esse contexto disponível, a sequência recomendada é:

1. Ler o PRD e esclarecer decisões que alterem o modelo de dados ou o escopo.
2. Definir o nome do produto, o slug técnico e o nome do banco.
3. Substituir os identificadores provisórios `Base App`, `base-app`, `@base-app` e `base_app`.
4. Atualizar `.env.example`, `compose.yaml`, metadados, documentação e testes com a nova identidade.
5. Criar um `.env` local, gerar um novo `BETTER_AUTH_SECRET` e iniciar um banco exclusivo do produto.
6. Aplicar as migrations existentes e criar o primeiro administrador.
7. Implementar a primeira funcionalidade vertical do PRD, incluindo banco, API, interface e testes proporcionais.

Use esta busca para encontrar todos os identificadores provisórios durante a renomeação:

```bash
rg --hidden -n 'Base App|base-app|@base-app|base_app' \
  --glob '!.git/**' \
  --glob '!node_modules/**'
```

Crie o novo repositório remoto somente depois que a identidade do produto estiver definida. Até lá, esta base pode permanecer local e sem remoto configurado.

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
