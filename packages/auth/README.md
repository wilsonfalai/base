# `@mosaicgestao/auth`

Configuração compartilhada do Better Auth para o frontend Next.js e a API NestJS.

## Contrato de integração

- O Next.js hospeda o handler HTTP oficial em `/api/auth/[...all]`. Login, logout e renovação de sessão permanecem na mesma origem do frontend.
- Este pacote é a única fonte de configuração server-side do Better Auth e recebe o `PrismaClient` compartilhado por injeção.
- O NestJS não hospeda uma segunda instância HTTP de autenticação. Ele usa `auth.api.getSession` para validar o cookie recebido e proteger endpoints.
- O cliente React usa `createAuthClient` e acessa `/api/auth` na mesma origem.
- O cookie de sessão é `HttpOnly`; componentes e APIs nunca persistem tokens em `localStorage`.
- `BETTER_AUTH_URL` é sempre explícita e `BETTER_AUTH_SECRET` deve ter pelo menos 32 caracteres. Os dois aplicativos devem usar os mesmos valores.

Essa separação evita configuração duplicada e dependência do adaptador comunitário de NestJS, enquanto mantém frontend e API capazes de reconhecer a mesma sessão persistida no PostgreSQL.

## Responsabilidades por workspace

| Workspace | Responsabilidade |
| --- | --- |
| `packages/auth` | fábrica e tipos compartilhados do Better Auth |
| `packages/database` | modelos, migration e client Prisma |
| `apps/web` | handler `/api/auth`, cliente React e proteção das páginas internas |
| `apps/api` | validação da sessão e proteção dos endpoints NestJS |

O schema de autenticação, o seed do primeiro usuário e os adaptadores de framework são adicionados pelas tarefas seguintes da US-004.

## Schema e primeiro administrador

Depois de alterar opções ou plugins do Better Auth, regenere o schema e crie uma migration Prisma revisável:

```bash
pnpm auth:schema
pnpm db:migrate --name descricao_da_alteracao
```

Com o PostgreSQL disponível e as migrations aplicadas, crie o primeiro administrador pelo prompt seguro do CLI oficial:

```bash
pnpm auth:create-admin --email voce@empresa.com --name "Seu nome"
```

A senha é solicitada interativamente e não fica registrada no shell nem no repositório. O comando bloqueia por padrão uma nova criação quando já existem usuários; não use `--force` sem revisar previamente o banco.
