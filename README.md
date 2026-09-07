# Mosaic Gestão

Sistema de gestão comercial e financeira da Mosaic. O projeto centraliza clientes, catálogo, vendas, contratos, contas a receber e pagar, assinaturas recorrentes e indicadores operacionais.

O desenvolvimento é orientado pelo [`projeto.prd`](projeto.prd). O [backlog de referência](docs/jira-backlog-mvp.md) traduz o PRD em épicos, histórias e critérios técnicos; o Jira é a fonte oficial de prioridade, status e execução.

## Arquitetura

O repositório é um monorepo pnpm coordenado pelo Turborepo:

```text
apps/
├── api/       API NestJS
├── e2e/       testes de navegador com Playwright
└── web/       aplicação Next.js
packages/
├── auth/      configuração compartilhada do Better Auth
└── database/  schema, migrations e client Prisma
docs/          referências técnicas e de planejamento
.github/       CI e automação de dependências
```

| Workspace           | Responsabilidade                                           |
| ------------------- | ---------------------------------------------------------- |
| `apps/web`          | Interface Next.js com App Router, Tailwind CSS e shadcn/ui |
| `apps/api`          | API NestJS, configuração de ambiente e regras de aplicação |
| `apps/e2e`          | Jornadas críticas executadas em Chromium pelo Playwright   |
| `packages/auth`     | Configuração server-side e tipos compartilhados de sessão  |
| `packages/database` | Acesso PostgreSQL, schema, migrations e client Prisma      |

## Stack

Versões instaladas no momento desta documentação:

| Camada       | Tecnologia                                                       |
| ------------ | ---------------------------------------------------------------- |
| Monorepo     | pnpm 12.3.4 e Turborepo 2.10.12                                  |
| Frontend     | Next.js 16.3.4, React 19.2.8, Tailwind CSS 4.3.3 e shadcn 4.21.0 |
| Backend      | NestJS 12.0.1, Zod 4.5.4 e RxJS 7.8.2                            |
| Autenticação | Better Auth 1.7.3                                               |
| Persistência | PostgreSQL 18.6 e Prisma 7.10.0                                  |
| Testes       | Vitest 5.0.0, Supertest 7.2.2 e Playwright 1.63.0                |
| Linguagem    | TypeScript 6.0.3 e Node.js 24.14 ou superior                     |

Os manifests e o `pnpm-lock.yaml` são a fonte de verdade das versões.

## Pré-requisitos

- Node.js 24.14 ou superior.
- pnpm 12.3.4.
- Docker com Docker Compose.
- WSLg ou ambiente gráfico equivalente para visualizar testes Playwright no Linux.

Se necessário, instale a versão esperada do pnpm:

```bash
npm install --global pnpm@12.3.4
```

## Início rápido

Na raiz do repositório:

```bash
pnpm install --frozen-lockfile
cp .env.example .env
pnpm db:up
pnpm db:deploy
pnpm dev
```

O `pnpm dev` inicia o frontend e a API, mas não inicia o PostgreSQL. O banco deve estar disponível com `pnpm db:up`.

| Serviço    | Endereço                           |
| ---------- | ---------------------------------- |
| Frontend   | http://localhost:3000              |
| Login      | http://localhost:3000/login        |
| Dashboard  | http://localhost:3000/dashboard    |
| API        | http://localhost:3001              |
| Liveness   | http://localhost:3001/health       |
| Readiness  | http://localhost:3001/health/ready |
| PostgreSQL | `localhost:5432`                   |

Encerre Next.js e NestJS com `Ctrl+C`. O PostgreSQL permanece em segundo plano até `pnpm db:down`.

## Variáveis de ambiente

Copie `.env.example` para `.env`. O arquivo real é ignorado pelo Git e nunca deve conter credenciais de produção versionadas.

| Variável            | Finalidade                                      |
| ------------------- | ----------------------------------------------- |
| `NODE_ENV`          | ambiente da aplicação                           |
| `PORT`              | porta da API; padrão `3001`                     |
| `DATABASE_URL`      | conexão PostgreSQL usada pela API e pelo Prisma |
| `BETTER_AUTH_URL`   | origem canônica do handler de autenticação      |
| `BETTER_AUTH_SECRET`| segredo compartilhado de sessão, mínimo 32 caracteres |
| `WEB_ORIGIN`        | origem permitida para chamadas do frontend      |
| `POSTGRES_DB`       | banco criado pelo Docker Compose                |
| `POSTGRES_USER`     | usuário local do PostgreSQL                     |
| `POSTGRES_PASSWORD` | senha exclusivamente local                      |
| `POSTGRES_PORT`     | porta publicada pelo contêiner                  |

As credenciais fornecidas em `.env.example` são apenas para desenvolvimento local.

## Comandos principais

| Comando                 | Finalidade                              |
| ----------------------- | --------------------------------------- |
| `pnpm dev`              | inicia web e API com recarga automática |
| `pnpm build`            | compila todos os workspaces aplicáveis  |
| `pnpm start`            | inicia os aplicativos compilados        |
| `pnpm lint`             | executa as análises estáticas           |
| `pnpm typecheck`        | valida os tipos TypeScript              |
| `pnpm test`             | executa testes unitários                |
| `pnpm test:coverage`    | executa unitários e gera cobertura      |
| `pnpm test:integration` | testa a integração com PostgreSQL       |
| `pnpm test:e2e`         | executa E2E da API e do navegador       |
| `pnpm test:e2e:web`     | executa apenas Playwright               |
| `pnpm test:e2e:install` | instala o Chromium do Playwright        |
| `pnpm auth:schema`      | regenera o schema exigido pelo Better Auth |
| `pnpm auth:create-admin`| cria um usuário administrador por prompt seguro |

Para executar um aplicativo isoladamente:

```bash
pnpm --filter web dev
pnpm --filter api dev
```

## Banco de dados e Prisma

O PostgreSQL local roda em Docker, escuta apenas em `localhost` e persiste no volume nomeado `mosaicgestao_postgres_data`.

```bash
pnpm db:up
pnpm db:logs
pnpm db:down
```

O schema e as migrations ficam em `packages/database`. Não altere o banco manualmente e não edite uma migration que já tenha sido aplicada.

```bash
pnpm db:generate
pnpm db:migrate --name nome_da_mudanca
pnpm db:deploy
pnpm db:studio
```

- Use `db:migrate` para criar uma migration durante o desenvolvimento.
- Use `db:deploy` em checkout limpo, CI e produção.
- `db:down` preserva o volume; a remoção de dados deve ser manual e intencional.

### Decisões de persistência

- Entidades de domínio usam UUID v4 e coluna PostgreSQL `uuid`.
- Identificadores administrados por bibliotecas externas seguem seus contratos.
- Valores monetários usam `Decimal(19,4)` e moeda ISO 4217, inicialmente `BRL`.
- Cálculos monetários nunca usam ponto flutuante JavaScript.
- Instantes usam UTC em `timestamptz(3)` e trafegam em ISO 8601.
- Datas civis, como vencimentos, usam `date`.
- Conversões para `America/Sao_Paulo` acontecem na apresentação.

## Estratégia de testes

| Nível            | Localização                           | Cobertura atual                                 |
| ---------------- | ------------------------------------- | ----------------------------------------------- |
| Unitário         | `apps/api/src/**/*.spec.ts`           | configuração, serviços e controllers isolados   |
| Integração       | `apps/api/test/*.integration-spec.ts` | conexão real, PostgreSQL e migrations           |
| E2E da API       | `apps/api/test/*.e2e-spec.ts`         | aplicação NestJS e endpoints HTTP via Supertest |
| E2E do navegador | `apps/e2e/tests`                      | jornadas críticas no Chromium                   |

Os testes Playwright iniciam e encerram Next.js e NestJS automaticamente. O PostgreSQL deve estar disponível e atualizado. A suíte cria e remove seu próprio usuário descartável pelo Better Auth.

```bash
pnpm db:up
pnpm db:deploy
pnpm test:e2e:web
```

Para assistir à execução:

```bash
pnpm --filter @mosaicgestao/e2e test:e2e:ui
pnpm --filter @mosaicgestao/e2e test:e2e:debug
```

Em Linux, a primeira preparação completa do navegador pode exigir `sudo`:

```bash
pnpm --filter @mosaicgestao/e2e exec playwright install --with-deps chromium
```

As regras para novos testes estão em [`apps/e2e/README.md`](apps/e2e/README.md).

## Frontend

A rota `/login` não utiliza o layout administrativo. As telas internas ficam no route group `app/(system)` e herdam sidebar e cabeçalho sem acrescentar `(system)` à URL.

```text
apps/web/src/app/
├── login/page.tsx
└── (system)/
    ├── layout.tsx
    └── dashboard/page.tsx
```

O login usa e-mail e senha do Better Auth. O cadastro público está desabilitado: usuários internos são criados pelo administrador com `pnpm auth:create-admin`. As rotas do grupo `(system)` exigem sessão, e o mesmo cookie é validado pela API NestJS. O dashboard ainda mantém os dados visuais de referência do shadcn/ui.

Execute comandos do shadcn dentro do frontend para que componentes e dependências permaneçam no workspace correto:

```bash
cd apps/web
pnpm dlx shadcn@latest add nome-do-componente
```

Detalhes específicos do frontend estão em [`apps/web/README.md`](apps/web/README.md).

## API

A API valida as variáveis na inicialização, controla o ciclo de conexão do Prisma e expõe endpoints de saúde. Funcionalidades de negócio serão organizadas em módulos NestJS conforme o backlog.

Detalhes específicos estão em [`apps/api/README.md`](apps/api/README.md).

## Integração contínua

O workflow `.github/workflows/ci.yml` executa em pull requests e pushes para `main`:

- `Quality`: geração do Prisma Client, lint, typecheck, cobertura e build.
- `Database tests`: PostgreSQL isolado, migrations, integração e E2E da API.
- `Browser tests`: PostgreSQL efêmero, Chromium e jornada completa de autenticação no Playwright.

Em falhas do navegador, screenshots, vídeos, traces e relatório HTML são armazenados como artifact por sete dias. O Dependabot verifica semanalmente dependências pnpm e GitHub Actions.

## Fluxo Git

O repositório privado usa o plano GitHub Free, portanto a proteção automática da `main` não está disponível. O processo abaixo é uma regra operacional do projeto:

1. Atualizar a `main` local.
2. Criar uma branch para a história ou alteração.
3. Manter commits pequenos e identificáveis por task.
4. Abrir uma pull request para `main`.
5. Corrigir qualquer falha da CI na própria branch.
6. Fazer `Squash and merge` somente com todos os checks verdes.
7. Excluir a branch concluída.

Não desenvolver funcionalidades diretamente na `main`.

## Fontes de verdade

| Informação                                 | Fonte oficial                                          |
| ------------------------------------------ | ------------------------------------------------------ |
| Necessidades e regras do produto           | [`projeto.prd`](projeto.prd)                           |
| Prioridade, status, responsável e execução | Jira                                                   |
| Decomposição técnica estável do MVP        | [`docs/jira-backlog-mvp.md`](docs/jira-backlog-mvp.md) |
| Código e arquitetura implementada          | repositório Git                                        |
| Versões instaladas                         | manifests e `pnpm-lock.yaml`                           |

O backlog versionado não deve receber atualizações de status. Ele só muda quando houver alteração estrutural de escopo, critérios de aceite ou estratégia técnica. O andamento diário permanece exclusivamente no Jira.

## Política de dependências

- Novas bibliotecas devem usar a versão estável atual, consultada no momento da instalação.
- O lockfile deve ser atualizado e versionado junto com o manifest.
- Atualizações exigem lint, typecheck, testes e build.
- Dependências não devem ser rebaixadas sem uma incompatibilidade documentada.

Exceções atuais: TypeScript 6 é mantido enquanto a API de compilação exigida pelo Nest CLI não estiver disponível no TypeScript 7; ESLint 9 permanece enquanto os plugins do `eslint-config-next` não suportarem ESLint 10.

## Troubleshooting

- **`DATABASE_URL` ausente:** copie `.env.example` para `.env` e reinicie a API.
- **Porta 5432 ocupada:** altere `POSTGRES_PORT` e a porta correspondente em `DATABASE_URL`.
- **Client Prisma desatualizado:** execute `pnpm db:generate`.
- **Banco ainda iniciando:** aguarde `pnpm db:up`, que termina após o healthcheck.
- **Migration inconsistente:** execute `pnpm --filter @mosaicgestao/database exec prisma migrate status` antes de qualquer ação destrutiva.
- **Chromium sem bibliotecas Linux:** execute a instalação do Playwright com `--with-deps`.
- **Porta 3000 ou 3001 ocupada:** encerre a instância anterior antes de executar `pnpm dev`.

## Documentos relacionados

- [`projeto.prd`](projeto.prd): requisitos do produto.
- [`docs/jira-backlog-mvp.md`](docs/jira-backlog-mvp.md): decomposição estável do MVP.
- [`apps/e2e/README.md`](apps/e2e/README.md): padrões dos testes de navegador.
