# Backlog do MVP — Mosaic Gestão

> **Papel deste documento:** referência versionada da decomposição do `projeto.prd` v0.1 em épicos, histórias, critérios de aceite e direção técnica. Ele existe para preservar contexto arquitetural e apoiar pessoas e agentes de IA.
>
> **Fonte de verdade operacional:** o Jira controla prioridade, status, responsável, sprint, comentários e execução. Essas informações não devem ser reproduzidas aqui.
>
> **Manutenção:** atualize este arquivo apenas quando mudar o escopo estrutural do MVP, uma regra, um critério de aceite ou a estratégia técnica. Mudanças de andamento acontecem somente no Jira. A stack efetivamente instalada no repositório prevalece sobre sugestões antigas do PRD.

## Convenções

- Épicos: `EP-01` a `EP-08`.
- Histórias: `US-001` em diante, em ordem recomendada de execução.
- As tarefas listadas em cada história devem ser criadas como subtarefas no Jira quando o projeto suportar esse nível de hierarquia.
- Prioridade P0: necessária para operar o MVP; P1: necessária para completar o MVP; P2: pode ser refinada após o fluxo principal.
- Histórias futuras de CRM, propostas, projetos, suporte, integrações bancárias, emissão fiscal e multi-tenant ficam fora deste backlog.

## Definition of Ready

Uma história está pronta para desenvolvimento quando possui regra de negócio suficiente, critérios de aceite verificáveis, dependências identificadas e decisões abertas que possam alterar o modelo resolvidas.

## Definition of Done

Uma história está concluída quando:

- Critérios de aceite estão atendidos.
- Regras de negócio relevantes possuem testes unitários.
- Persistência e endpoints relevantes possuem testes de integração/API.
- Jornada crítica afetada possui ou atualiza teste Playwright quando aplicável.
- Build, lint, typecheck e testes passam no CI.
- Migrations e documentação operacional foram atualizadas quando necessário.
- Estados de carregamento, vazio e erro foram tratados no frontend.
- Autorização, auditoria e exposição de dados foram avaliadas.
- Não existem segredos, dados pessoais reais ou logs sensíveis no código.

---

## EP-01 — Fundação tecnológica, segurança e qualidade

**Objetivo:** entregar uma base reproduzível, autenticada e protegida, com qualidade automatizada. Parte da interface e do monorepo já está pronta.

**Critério do épico:** um usuário interno autorizado acessa o sistema, enquanto alterações passam por verificações automáticas confiáveis.

### US-001 — Concluir ambiente local e persistência [P0]

**História:** Como pessoa desenvolvedora, quero iniciar toda a base local de forma reproduzível para desenvolver e testar com segurança.

**Critérios de aceite:**

- Um checkout limpo instala dependências com `pnpm install --frozen-lockfile`.
- Docker Compose inicia PostgreSQL com healthcheck e volume persistente.
- Prisma usa PostgreSQL, possui configuração versionada e uma migration inicial reproduzível.
- A API valida variáveis obrigatórias e expõe healthcheck de aplicação e banco.
- Arquivos `.env.example` documentam as configurações sem conter segredos.
- Valores monetários, datas e convenções de IDs são registrados como decisões técnicas.

**Tarefas:**

- T-001.1 Criar Docker Compose do PostgreSQL com healthcheck e volume nomeado.
- T-001.2 Criar o pacote compartilhado de banco e instalar Prisma na versão estável compatível.
- T-001.3 Configurar schema, client, migrations e scripts de banco no pnpm/Turbo.
- T-001.4 Integrar Prisma ao NestJS com ciclo de conexão controlado.
- T-001.5 Criar configuração tipada de ambiente e arquivos `.env.example`.
- T-001.6 Implementar endpoints de health e readiness, incluindo consulta ao banco.
- T-001.7 Adicionar teste de integração da conexão com PostgreSQL.
- T-001.8 Atualizar README com bootstrap, migrations e troubleshooting.

### US-002 — Automatizar qualidade no GitHub Actions [P0]

**História:** Como equipe, quero validar cada mudança automaticamente para impedir regressões na branch principal.

**Critérios de aceite:**

- Pull requests e pushes em `main` executam instalação congelada, lint, typecheck, testes e build.
- Testes que usam banco executam contra PostgreSQL isolado e aplicam migrations.
- Falhas identificam claramente o aplicativo ou etapa responsável.
- Dependências são verificadas e atualizações seguras são propostas automaticamente.

**Tarefas:**

- T-002.1 Padronizar scripts `lint`, `typecheck`, `test`, `test:integration`, `test:e2e` e `build` no monorepo.
- T-002.2 Criar workflow de CI com pnpm, cache e PostgreSQL de serviço.
- T-002.3 Configurar cobertura apenas para regras críticas, sem meta artificial inicial.
- T-002.4 Configurar Dependabot semanal para pnpm e GitHub Actions.
- T-002.5 Configurar proteção de `main` exigindo CI após validar o workflow.

### US-003 — Validar jornadas críticas com Playwright [P0]

**História:** Como equipe, quero testes no navegador para garantir que os fluxos essenciais funcionem como o usuário espera.

**Critérios de aceite:**

- Playwright inicia web, API e dependências de forma reproduzível.
- Existe smoke test para `/login` e `/dashboard`.
- Testes rodam em Chromium no CI; trace, screenshot e vídeo são guardados somente em falhas.
- A suíte usa dados isolados e pode ser repetida sem depender de ordem.

**Tarefas:**

- T-003.1 Instalar e configurar Playwright no monorepo.
- T-003.2 Criar fixtures para API, autenticação futura e limpeza de dados.
- T-003.3 Implementar smoke tests iniciais das rotas existentes.
- T-003.4 Integrar Playwright ao workflow com artefatos de falha.
- T-003.5 Documentar critérios para adicionar E2E: apenas jornadas críticas e integrações entre camadas.

### US-004 — Autenticar usuários internos [P0]

**História:** Como usuário interno, quero entrar e sair com segurança para acessar apenas a área administrativa autorizada.

**Critérios de aceite:**

- Better Auth é a autoridade única de autenticação e persiste seus dados no PostgreSQL.
- Login por e-mail e senha apresenta erro genérico para credenciais inválidas.
- Sessão segura é reconhecida pelo frontend e backend.
- Rotas do grupo `(system)` redirecionam usuários anônimos para `/login`.
- Usuário autenticado em `/login` é encaminhado para `/dashboard`.
- Logout encerra a sessão e impede novo acesso às rotas protegidas.

**Tarefas:**

- T-004.1 Definir integração do Better Auth entre Next.js e NestJS conforme documentação da versão instalada.
- T-004.2 Criar schema/migration e seed controlado do primeiro administrador.
- T-004.3 Conectar o formulário visual existente ao login real.
- T-004.4 Implementar validação de sessão na API e proteção das rotas do sistema.
- T-004.5 Implementar logout e estados de erro/carregamento.
- T-004.6 Cobrir login, acesso protegido e logout com testes API e Playwright.

### US-005 — Administrar usuários e permissões básicas [P1]

**História:** Como administrador, quero gerenciar usuários internos e seus perfis para controlar o acesso ao sistema.

**Critérios de aceite:**

- Existem os perfis `administrador` e `colaborador`.
- Administrador pode listar, criar, visualizar, editar, ativar e inativar usuários.
- Colaborador não acessa ações exclusivas de administração.
- Usuário inativo perde acesso sem que seu histórico seja apagado.

**Tarefas:**

- T-005.1 Modelar status e perfil do usuário.
- T-005.2 Implementar políticas/guards e endpoints administrativos.
- T-005.3 Criar a listagem de usuários e os painéis laterais de criação, visualização e edição.
- T-005.4 Registrar autoria nas operações principais desde esta base.
- T-005.5 Testar matriz mínima de autorização.

---

## EP-02 — Gestão de clientes

**Objetivo:** centralizar clientes, dados de cobrança e contatos sem duplicar o cadastro ao longo do relacionamento.

### US-006 — Cadastrar e editar clientes [P0]

**História:** Como colaborador, quero cadastrar pessoa física ou jurídica para utilizá-la nas operações comerciais e financeiras.

**Critérios de aceite:** campos cadastrais e de cobrança são validados; CPF/CNPJ normalizado não se duplica; alterações preservam autoria e datas.

**Tarefas:** modelar Account e endereços; criar migration/repositório; implementar API CRUD; criar formulário responsivo; testar validações e duplicidade.

### US-007 — Gerenciar contatos do cliente [P0]

**História:** Como colaborador, quero manter vários contatos por cliente e identificar os principais para falar com a pessoa correta.

**Critérios de aceite:** contatos possuem nome, e-mail, telefone, função e flags principal/financeiro; pertencem a um cliente; regras de contato principal são consistentes.

**Tarefas:** modelar Contact; implementar API; criar seção de contatos; testar vínculos e regras das flags.

### US-008 — Localizar e inativar clientes [P0]

**História:** Como colaborador, quero pesquisar, filtrar e inativar clientes para manter a base útil sem apagar histórico.

**Critérios de aceite:** listagem pagina e filtra por texto, tipo e status; inativação pede confirmação; registros com histórico não são apagados pela interface.

**Tarefas:** criar consulta paginada; construir tabela e filtros; implementar inativação; cobrir busca e estados vazio/erro.

### US-009 — Consultar visão inicial do cliente [P1]

**História:** Como colaborador, quero uma página consolidada do cliente para acessar dados, contatos e módulos relacionados.

**Critérios de aceite:** a página apresenta dados e contatos reais; áreas ainda não entregues aparecem vazias e sem números fictícios; links evoluem com os épicos seguintes.

**Tarefas:** criar endpoint agregado inicial; construir cabeçalho e navegação da visão 360; integrar clientes/contatos; testar acesso e cliente inexistente.

---

## EP-03 — Catálogo de produtos e serviços

**Objetivo:** manter itens reutilizáveis com preços de referência e cobrança pontual ou recorrente.

### US-010 — Gerenciar categorias [P1]

**História:** Como administrador, quero organizar produtos e serviços por categoria para facilitar pesquisa e relatórios.

**Critérios de aceite:** categorias podem ser criadas, editadas e inativadas; nomes ativos não se duplicam; categoria em uso não é excluída fisicamente.

**Tarefas:** modelar Category; criar API; criar interface; testar unicidade e inativação.

### US-011 — Cadastrar produtos, serviços e preços [P0]

**História:** Como colaborador, quero cadastrar ofertas pontuais ou recorrentes com preço de referência para reutilizá-las nas vendas.

**Critérios de aceite:** item registra nome, código opcional, descrição, categoria, tipo, modelo de cobrança, moeda BRL e status; recorrentes aceitam intervalo e vigência sugerida; preço histórico será separável do produto.

**Tarefas:** decidir e registrar modelo `Product`/`Price`; criar migrations e API; criar formulário condicional; testar combinações de cobrança.

### US-012 — Pesquisar e inativar itens do catálogo [P1]

**História:** Como colaborador, quero localizar ofertas ativas e retirar itens antigos de uso futuro sem afetar vendas passadas.

**Critérios de aceite:** busca e filtros por categoria, tipo, cobrança e status; itens inativos não entram em novas vendas; histórico permanece consultável.

**Tarefas:** implementar consulta e filtros; criar tabela; implementar inativação; testar seleção em vendas futuras.

---

## EP-04 — Vendas

**Objetivo:** registrar o acordo comercial central, com itens negociados e desdobramentos controlados.

### US-013 — Criar e editar venda em rascunho [P0]

**História:** Como colaborador, quero preparar uma venda para um cliente antes de assumir efeitos financeiros.

**Critérios de aceite:** rascunho possui número interno, cliente, data, responsável e condições; pode ser editado sem gerar cobrança; cliente inativo não pode receber nova venda.

**Tarefas:** modelar Order e status; criar API de rascunho; criar fluxo de cadastro; testar transições permitidas.

### US-014 — Negociar itens, descontos e totais [P0]

**História:** Como colaborador, quero ajustar itens e valores da venda para refletir exatamente o acordo fechado.

**Critérios de aceite:** venda aceita itens pontuais e recorrentes; quantidade, descrição, preço e desconto são ajustáveis; totais usam precisão monetária; OrderItem guarda snapshot imutável do catálogo ao confirmar.

**Tarefas:** modelar OrderItem/snapshot; implementar cálculo no domínio; criar editor de itens; testar arredondamento, descontos e alteração posterior do catálogo.

### US-015 — Configurar plano de cobrança da venda [P0]

**História:** Como colaborador, quero definir parcelas e condições recorrentes antes da confirmação para representar o combinado com o cliente.

**Critérios de aceite:** parcelas pontuais aceitam valores e vencimentos; soma é validada; itens recorrentes geram configuração de assinatura pendente; nada é faturado no rascunho.

**Tarefas:** refinar BillingSchedule/Invoice/Receivable; modelar plano; criar editor e prévia; testar somas e datas.

### US-016 — Confirmar venda de forma transacional [P0]

**História:** Como colaborador, quero confirmar uma venda para gerar seus desdobramentos uma única vez.

**Critérios de aceite:** confirmação valida dados, fixa snapshots e gera cobranças/assinaturas em uma transação; repetição não duplica registros; venda confirmada restringe alterações financeiras.

**Tarefas:** implementar serviço de domínio transacional; adicionar chave de idempotência; expor ação explícita com confirmação; testar rollback e repetição.

### US-017 — Consultar e cancelar venda [P1]

**História:** Como colaborador, quero consultar o histórico e cancelar uma venda conforme regras para preservar rastreabilidade.

**Critérios de aceite:** detalhes exibem itens e desdobramentos; cancelamento não apaga pagamentos; impactos existentes são informados antes da confirmação; autoria é registrada.

**Tarefas:** criar detalhe agregado; definir regra inicial de cancelamento; implementar interface; testar venda com e sem pagamentos.

---

## EP-05 — Contratos

**Objetivo:** registrar formalizações opcionais vinculadas ao cliente e à venda.

### US-018 — Cadastrar e associar contratos [P1]

**História:** Como colaborador, quero registrar um contrato e associá-lo ao cliente e à venda quando aplicável.

**Critérios de aceite:** contrato registra referência, tipo, datas, status e observações; venda pode existir sem contrato; vigência do contrato é independente do serviço.

**Tarefas:** decidir cardinalidade inicial; modelar Contract; criar API/formulário; testar associações opcionais.

### US-019 — Anexar documento assinado com segurança [P1]

**História:** Como colaborador, quero anexar o documento do contrato para recuperá-lo com controle de acesso.

**Critérios de aceite:** tipos e tamanho são limitados; arquivo não fica público; download exige autorização; metadados e autoria são registrados.

**Tarefas:** decidir armazenamento do MVP; implementar upload/download; validar conteúdo e tamanho; testar autorização e falhas.

### US-020 — Consultar e atualizar ciclo do contrato [P1]

**História:** Como colaborador, quero localizar contratos e atualizar seu status para acompanhar sua vigência.

**Critérios de aceite:** filtros por cliente, venda, status e vigência; detalhe apresenta serviços/cobranças relacionados disponíveis; mudanças preservam histórico básico.

**Tarefas:** criar consultas; construir lista/detalhe; implementar transições; testar filtros e auditoria.

---

## EP-06 — Faturamento e financeiro básico

**Objetivo:** separar valores previstos dos realizados e controlar receitas, despesas e pagamentos.

### US-021 — Gerenciar contas a receber [P0]

**História:** Como responsável financeiro, quero consultar e criar títulos a receber para saber o que a Mosaic tem a receber.

**Critérios de aceite:** títulos podem vir de vendas ou cadastro manual; possuem origem, cliente, valor, saldo, vencimento e status; filtros identificam abertos e vencidos.

**Tarefas:** modelar Receivable e status derivados; implementar geração por parcela e criação manual; criar tabela/filtros; testar origem, saldo e atraso.

### US-022 — Registrar recebimentos totais e parciais [P0]

**História:** Como responsável financeiro, quero registrar recebimentos para atualizar corretamente saldo e histórico.

**Critérios de aceite:** pagamento registra valor, data, método, observação e referência; baixa parcial mantém saldo; total encerra título; excesso é rejeitado; pagamento não é apagado silenciosamente.

**Tarefas:** modelar Payment/PaymentAllocation; implementar transação de baixa; criar formulário/histórico; testar parcial, total, concorrência e rollback.

### US-023 — Gerenciar credores e contas a pagar [P0]

**História:** Como responsável financeiro, quero registrar despesas para acompanhar obrigações da empresa.

**Critérios de aceite:** conta registra credor, categoria, descrição, valor e vencimento; lista filtra período, categoria e status; vencidas são identificadas claramente.

**Tarefas:** refinar credor/categorias; modelar Payable; criar CRUD e filtros; testar inativação e vencimento.

### US-024 — Registrar pagamento de despesas [P0]

**História:** Como responsável financeiro, quero dar baixa em despesas para distinguir previsto e realizado.

**Critérios de aceite:** pagamentos totais e parciais atualizam saldo/status; histórico e autoria permanecem; valor pago não ultrapassa saldo sem fluxo explícito de ajuste.

**Tarefas:** implementar alocação de saída; criar ação de baixa; incluir histórico; testar regras financeiras e concorrência.

### US-025 — Organizar cobranças em faturas internas [P2]

**História:** Como responsável financeiro, quero agrupar cobranças em faturas internas para consultar o que foi cobrado sem confundir com nota fiscal.

**Critérios de aceite:** fatura possui cliente, itens, valor, vencimento e status; mantém vínculo com receivable; interface declara que não é documento fiscal.

**Tarefas:** fechar decisão Invoice/Receivable; modelar e gerar fatura; criar detalhe; testar consistência de valores.

---

## EP-07 — Assinaturas e recorrências

**Objetivo:** controlar serviços recorrentes e gerar competências sem duplicidade.

### US-026 — Criar assinatura pendente a partir da venda [P0]

**História:** Como colaborador, quero que um item recorrente confirmado origine uma assinatura pendente para ativá-la na entrega do serviço.

**Critérios de aceite:** assinatura referencia cliente, OrderItem e produto; preserva valor, intervalo e vigência negociados; começa pendente sem cobrança indevida.

**Tarefas:** modelar Subscription; integrar confirmação da venda; criar lista/detalhe; testar snapshot e origem.

### US-027 — Ativar assinatura com competência e vencimento [P0]

**História:** Como colaborador, quero informar a data real de início para calcular corretamente o primeiro ciclo.

**Critérios de aceite:** venda, assinatura, competência, emissão, vencimento e pagamento são datas distintas; ativação calcula primeiro período; prévia é mostrada antes de confirmar.

**Tarefas:** decidir política inicial de período e vencimento; implementar cálculo puro; criar ação de ativação; testar limites de mês e fuso horário.

### US-028 — Gerar cobranças recorrentes sem duplicidade [P0]

**História:** Como responsável financeiro, quero gerar mensalidades automaticamente e sob demanda sem repetir uma competência.

**Critérios de aceite:** job é idempotente; restrição no banco impede duplicidade; execução manual controlada está disponível; falha parcial pode ser repetida; cobranças antigas não mudam com a assinatura.

**Tarefas:** criar chave única de competência; implementar gerador transacional; configurar scheduler sem Redis inicialmente; criar ação administrativa; testar concorrência/reexecução.

### US-029 — Encerrar e consultar histórico da assinatura [P1]

**História:** Como colaborador, quero encerrar uma assinatura e consultar cobranças geradas para acompanhar o serviço recorrente.

**Critérios de aceite:** encerramento impede novos ciclos após a data válida; cobranças anteriores permanecem; status e histórico são visíveis; pausa, reajuste e proporcionalidade ficam explicitamente fora desta entrega.

**Tarefas:** definir transições mínimas; implementar encerramento; criar timeline de cobranças; testar datas-limite.

---

## EP-08 — Dashboard, relatórios e visão consolidada

**Objetivo:** substituir consultas dispersas por uma visão operacional e financeira clara.

### US-030 — Exibir dashboard operacional real [P1]

**História:** Como usuário interno, quero ver indicadores e próximos compromissos para decidir prioridades do dia.

**Critérios de aceite:** exibe previsto a receber, vencido, recebido no mês, previsto/pago de despesas, próximos vencimentos, clientes e assinaturas ativas; cada indicador explica período e natureza; dados fake são removidos.

**Tarefas:** definir consultas e timezone; criar endpoints agregados; conectar cards/gráficos/listas existentes; testar cálculos com cenários representativos.

### US-031 — Consultar relatórios básicos [P1]

**História:** Como responsável pela gestão, quero filtrar relatórios essenciais para acompanhar a operação sem planilhas paralelas.

**Critérios de aceite:** relatórios cobrem recebíveis, pagáveis, recebimentos, receita por cliente, assinaturas e vendas; filtros por período são consistentes; totais conciliam com registros de origem.

**Tarefas:** definir queries e contratos; criar páginas e filtros; adicionar exportação CSV apenas se validada como necessária; testar conciliação e timezone.

### US-032 — Completar visão 360º do cliente [P1]

**História:** Como colaborador, quero consultar vendas, contratos, assinaturas, cobranças e pagamentos de um cliente em um lugar só.

**Critérios de aceite:** visão consolida todos os módulos entregues; respeita permissões; totais e status correspondem às origens; listas grandes paginam.

**Tarefas:** criar consultas agregadas eficientes; completar abas da interface; otimizar índices; testar isolamento entre clientes e estados vazios.

### US-033 — Migrar dados existentes e validar o MVP [P1]

**História:** Como responsável pela Mosaic, quero carregar os dados atuais e validar os fluxos para substituir os controles paralelos com confiança.

**Critérios de aceite:** formato de importação é acordado; importação valida e relata erros sem duplicar dados; ensaio ocorre antes da carga final; fluxos principais do PRD são aceitos com dados representativos; existe plano de rollback e backup.

**Tarefas:** inventariar fontes atuais; definir mapeamento e regras de deduplicação; implementar importador idempotente; ensaiar em ambiente não produtivo; executar roteiro de aceite; documentar backup/recuperação e pendências pós-MVP.

---

## Estratégia mínima de testes recomendada

### Unitários

Priorizar funções e serviços com regras: dinheiro, descontos, totais, snapshots, transições de status, competências, vencimentos, saldos, alocações e idempotência. Evitar testes que apenas repetem DTOs ou detalhes do framework.

### Integração e API

Executar contra PostgreSQL real isolado. Cobrir constraints, transactions, migrations, autorização e endpoints principais com Supertest. Cada teste controla seus próprios dados e não depende de ordem.

### Playwright

Manter poucos testes completos e valiosos:

1. Login, acesso protegido e logout.
2. Cadastrar cliente com contato e encontrá-lo na listagem.
3. Cadastrar catálogo, criar venda com item pontual/recorrente e confirmar.
4. Registrar recebimento parcial e depois total.
5. Ativar assinatura e gerar competência uma única vez.
6. Registrar despesa e pagamento.
7. Conferir indicadores principais do dashboard.

Não replicar todos os cenários de validação no navegador; regras combinatórias ficam nos testes unitários e de API.

### GitHub Actions

Pipeline mínimo em pull request e `main`:

1. Instalação com lockfile congelado.
2. Lint e typecheck.
3. Testes unitários.
4. PostgreSQL + migrations + testes de integração/API.
5. Build de web e API.
6. Playwright em Chromium com artefatos apenas em falha.

Adicionar Dependabot semanal. CodeQL não está incluído para este repositório privado no plano pessoal gratuito; como alternativa inicial, manter Dependabot, revisão de dependências, CI, proteção de branch e uma ação gratuita de detecção de segredos após avaliar a ferramenta escolhida.

## Decisões que bloqueiam apenas seus respectivos épicos

- EP-03: `Price` separado desde o início. Recomendação: sim, pois preço é referência e OrderItem precisa de snapshot.
- EP-05: cardinalidade venda/contrato. Recomendação inicial: uma venda pode ter zero ou um contrato, com modelo preparado para evolução.
- EP-06: relação Invoice/Receivable. Refinar antes da US-021 e decidir se US-025 permanece no MVP.
- EP-07: cobrança antecipada/pós-paga, regra de vencimento e limites de mês. Refinar antes da US-027.
- EP-06: categorias financeiras, centros de custo e contas bancárias. Incluir apenas categorias no primeiro fluxo de despesas.
- EP-05: provedor de armazenamento de documentos. Escolher antes da US-019.
- EP-08: fontes e formato da migração. Inventariar antes da US-033.

## Sequência de releases sugerida

- R0 — Fundação: US-001 a US-005.
- R1 — Cadastros utilizáveis: US-006 a US-012.
- R2 — Venda ponta a ponta: US-013 a US-017, US-021 e US-026.
- R3 — Operação financeira: US-022 a US-024.
- R4 — Contratos e recorrência: US-018 a US-020 e US-027 a US-029.
- R5 — Gestão e entrada em operação: US-030 a US-033.
