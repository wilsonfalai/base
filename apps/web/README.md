# Frontend

Aplicação web do Mosaic Gestão, construída com Next.js App Router, React, Tailwind CSS e shadcn/ui.

## Execução

A partir da raiz do monorepo:

```bash
pnpm --filter web dev
pnpm --filter web build
pnpm --filter web start
pnpm --filter web lint
pnpm --filter web typecheck
```

O frontend de desenvolvimento fica disponível em http://localhost:3000.

## Estrutura

```text
src/
├── app/
│   ├── login/       rota pública sem sidebar
│   └── (system)/    rotas que compartilham o layout administrativo
├── components/
│   ├── ui/          componentes shadcn/ui
│   └── *.tsx        componentes da aplicação
├── hooks/
└── lib/
```

O route group `(system)` organiza o layout sem aparecer na URL. Ele ainda não representa proteção de acesso; a sessão será implementada com Better Auth.

## shadcn/ui

Execute a CLI neste workspace:

```bash
cd apps/web
pnpm dlx shadcn@latest add nome-do-componente
```

Revise sempre o diff da CLI: componentes do shadcn passam a fazer parte do código do projeto e podem ser adaptados, desde que acessibilidade e testes sejam preservados.

## Convenções

- Componentes são Server Components por padrão; use `"use client"` apenas quando necessário.
- Novas páginas administrativas pertencem a `src/app/(system)`.
- Prefira componentes existentes em `src/components/ui` antes de adicionar dependências.
- Preserve seletores acessíveis usados pelo Playwright, como labels, roles e textos estáveis.
- Variáveis expostas ao navegador devem usar o prefixo `NEXT_PUBLIC_` e nunca conter segredos.

Consulte o [`README` raiz](../../README.md) para bootstrap, stack, testes e fluxo Git.
