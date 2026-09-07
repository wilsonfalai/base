# Mosaic Gestão

Base mínima com pnpm workspaces e Turborepo:

- `apps/web`: Next.js com App Router, TypeScript e Tailwind CSS; página inicial oficial em http://localhost:3000.
- `apps/api`: NestJS com TypeScript; `Hello World!` em http://localhost:3001.

## Executar

Use Node.js 24.14 ou superior e pnpm 12.3.4 (`npm install -g pnpm@12.3.4`).

```bash
pnpm install --frozen-lockfile
cp .env.example .env
pnpm db:up
pnpm db:deploy
pnpm dev
```

O `pnpm dev` prepara o pacote compartilhado e inicia os dois aplicativos com recarga automática. Acesse:

- Frontend: http://localhost:3000
- API: http://localhost:3001
- Liveness: http://localhost:3001/health
- Readiness com banco: http://localhost:3001/health/ready

Encerre Next.js e NestJS com Ctrl+C. O PostgreSQL roda em segundo plano até `pnpm db:down`.

## Banco de dados local

O ambiente local usa PostgreSQL 18.6 em Docker, disponível somente em `localhost:5432`. Para iniciar e aguardar o healthcheck:

```bash
pnpm db:up
```

As credenciais padrão servem apenas para desenvolvimento local:

```text
database: mosaicgestao
user: mosaicgestao
password: mosaicgestao_dev
host: localhost
port: 5432
```

É possível sobrescrever `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` e `POSTGRES_PORT` pelo ambiente. Os dados persistem no volume Docker nomeado `mosaicgestao_postgres_data`.

```bash
pnpm db:logs   # acompanha os logs do PostgreSQL
pnpm db:down   # encerra o contêiner preservando os dados
```

Remover o volume apaga o banco local e deve ser uma ação manual e intencional.

## Prisma e migrations

O schema, o client e o histórico de migrations ficam em `packages/database`. Não altere o banco manualmente nem edite migrations que já tenham sido aplicadas.

```bash
pnpm db:generate            # regenera o client após alterar o schema
pnpm db:migrate -- --name nome_da_mudanca
pnpm db:deploy              # aplica migrations existentes sem criar novas
pnpm db:studio              # abre o Prisma Studio
pnpm test:integration       # valida conexão e migrations no banco local
```

Use `db:migrate` durante o desenvolvimento ao alterar o schema. Use `db:deploy` em checkout limpo, CI e produção.

```bash
pnpm build       # Compila os dois aplicativos
pnpm start       # Inicia ambos em produção após o build
pnpm lint        # Verifica os dois aplicativos
pnpm test        # Teste unitário oficial do NestJS
pnpm test:integration # Teste real do PostgreSQL
pnpm test:e2e    # Teste HTTP oficial do NestJS
```

Para executar apenas um aplicativo: `pnpm --filter web dev` ou `pnpm --filter api dev`.

## Dependências

Frameworks e dependências consultados no registro npm durante a configuração: Next.js 16.3.4, NestJS 12.0.1, React 19.2.8 e Turborepo 2.10.12. O lockfile compartilhado torna a instalação reproduzível.

Exceções de compatibilidade: TypeScript 6.0.3 é necessário porque o TypeScript 7.0.2 não oferece a API de compilação exigida pelo Nest CLI. ESLint 9.39.5 é a última versão da série suportada pelos plugins incluídos no `eslint-config-next`; eles ainda não suportam ESLint 10. Revisar essas restrições ao atualizar, executando build, lint e testes.

O Prisma 7.10.0 está configurado com o driver PostgreSQL. Better Auth fica para uma etapa posterior. Nenhuma funcionalidade de negócio foi adicionada.

## Decisões de persistência

- **IDs:** entidades de domínio usarão UUID v4 gerado pela aplicação e coluna PostgreSQL `uuid`. IDs administrados por bibliotecas externas, como autenticação, seguem o contrato da biblioteca e permanecem strings quando necessário.
- **Dinheiro:** valores usam `Decimal(19,4)` no banco e código de moeda ISO 4217 separado, inicialmente `BRL`. Nunca usar ponto flutuante (`number`) para cálculos monetários; transportar valores como string decimal.
- **Data e hora:** instantes usam UTC em `timestamptz(3)` e trafegam em ISO 8601. Datas civis sem horário, como vencimento, usam `date`. Conversão para `America/Sao_Paulo` acontece apenas na apresentação.

## Troubleshooting

- **Porta 5432 ocupada:** altere `POSTGRES_PORT` no `.env` e ajuste a porta da `DATABASE_URL` para o mesmo valor.
- **`DATABASE_URL` ausente ou inválida:** copie novamente `.env.example` para `.env` e reinicie a API.
- **Client Prisma desatualizado:** execute `pnpm db:generate` e depois `pnpm build`.
- **Banco ainda iniciando:** aguarde `pnpm db:up`; o comando só termina após o healthcheck ficar saudável.
- **Migration inconsistente:** confira `pnpm --filter @mosaicgestao/database exec prisma migrate status`. Não apague o volume nem use reset se houver dados importantes.
- **Recriar o banco local:** somente quando a perda for aceitável, execute `pnpm db:down`, remova manualmente o volume `mosaicgestao_postgres_data`, suba o banco e rode `pnpm db:deploy`.

## Login e shadcn/ui

A rota http://localhost:3000/login contém o bloco oficial `login-01`, apenas visual, sem autenticação. A configuração fica em `apps/web/components.json` e os componentes em `apps/web/src/components`.

Execute os comandos do shadcn dentro do frontend:

```bash
cd apps/web
pnpm dlx shadcn@latest add login-01
```

Para outros componentes, substitua `login-01` pelo nome desejado. O pnpm mantém as dependências no aplicativo web e o lockfile na raiz do monorepo.

## Dashboard e layout do sistema

A rota http://localhost:3000/dashboard usa o bloco oficial `dashboard-01`, com os dados fictícios originais.

- `apps/web/src/app/(system)/layout.tsx`: estrutura compartilhada, sidebar e cabeçalho.
- `apps/web/src/app/(system)/dashboard/page.tsx`: conteúdo do dashboard (cards, gráfico e tabela).
- `apps/web/src/app/(system)/dashboard/data.json`: dados de exemplo da tabela.
- `apps/web/src/app/login/page.tsx`: login independente, sem sidebar.

Crie as próximas telas dentro de `app/(system)/` para herdar o layout. Por exemplo, `app/(system)/clientes/page.tsx` terá a URL `/clientes`; `(system)` não aparece na URL. O grupo organiza o layout, mas não protege as rotas: autenticação e redirecionamento após login ainda não foram implementados. O destino previsto após autenticar é `/dashboard`.

O bloco foi instalado em `apps/web` com `pnpm dlx shadcn@latest add dashboard-01` e depois separado em layout e página. Os demais itens de menu continuam como exemplos.

Templates oficiais: [Next.js](https://nextjs.org/docs/app/getting-started/installation) e [NestJS](https://docs.nestjs.com/first-steps).
