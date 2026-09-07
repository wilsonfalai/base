# Testes E2E

Este workspace contém os testes Playwright das jornadas críticas do sistema. O projeto usa Chromium e inicia automaticamente o Next.js na porta 3000 e a API NestJS na porta 3001. O PostgreSQL precisa estar disponível e com as migrations aplicadas.

## Comandos

Execute a partir da raiz do monorepo:

```bash
pnpm db:up
pnpm db:deploy
pnpm test:e2e:install
pnpm test:e2e:web
pnpm --filter @mosaicgestao/e2e test:e2e:ui
pnpm --filter @mosaicgestao/e2e test:e2e:debug
```

Variáveis suportadas:

- `E2E_BASE_URL`: frontend testado; padrão `http://localhost:3000`.
- `E2E_API_BASE_URL`: API usada pelas fixtures; padrão `http://localhost:3001`.
- `E2E_USER_EMAIL`, `E2E_USER_NAME` e `E2E_USER_PASSWORD`: permitem substituir as credenciais descartáveis da fixture.

## Quando criar um teste E2E

Use Playwright para jornadas que atravessam interface, API e persistência ou cujo comportamento no navegador seja essencial. Validações isoladas, regras de domínio e respostas individuais da API devem permanecer em testes unitários ou de integração mais rápidos.

Cada funcionalidade crítica deve cobrir pelo menos o caminho principal e o erro com maior impacto. Evite repetir no navegador todas as combinações já cobertas em níveis inferiores.

## Seletores e asserções

- Priorize `getByRole`, `getByLabel`, `getByText` e outros seletores percebidos pelo usuário.
- Não selecione classes CSS, estrutura interna do shadcn/ui ou índices de elementos.
- Valide resultados observáveis, como URL, mensagem, estado de botão e conteúdo apresentado.
- Não use esperas com tempo fixo; aguarde uma condição observável do sistema.
- Nunca envie `test.only` para o repositório. A CI rejeita testes exclusivos.

## Isolamento e limpeza

Importe `test` e `expect` de `fixtures/test.ts`. A fixture oferece:

- `runId`: identificador único para nomes, e-mails e referências criados pelo teste.
- `api`: contexto HTTP isolado apontando para `E2E_API_BASE_URL`.
- `registerCleanup`: registra exclusões pela API e executa-as em ordem inversa ao final do teste.

Um teste não deve depender dos dados ou da ordem de outro teste. Cadastre apenas o necessário e registre a limpeza imediatamente após cada criação. Não limpe tabelas inteiras nem acesse o banco diretamente quando a API permitir remover o dado.

## Autenticação

O `global-setup.ts` cria um usuário descartável pela API oficial do Better Auth antes da suíte e o remove ao final. O cadastro público continua desabilitado na aplicação; ele só é liberado na instância isolada usada para preparar o teste.

Os testes devem autenticar pela tela como um usuário real. Para validar a mesma sessão na API, use `page.context().request`, que compartilha os cookies do navegador. As credenciais padrão pertencem exclusivamente ao banco local ou efêmero da CI; nunca use uma conta ou senha real.

## Falhas na CI

O job `Browser tests` executa os testes no Chromium. Em falhas, o GitHub Actions armazena por sete dias o relatório HTML, traces, screenshots e vídeos em um artifact chamado `playwright-failure-*`.

Consulte a [documentação oficial do Playwright](https://playwright.dev/docs/best-practices) ao introduzir um padrão novo.
