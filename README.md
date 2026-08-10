# Desapega UNIFOR — Marketplace de Economia Circular do Campus

Plataforma web/mobile (PWA) que permite a estudantes anunciar itens para **doação ou venda** (livros, calculadoras, componentes eletrônicos, jalecos, móveis, etc.), facilitando o acesso a materiais para quem está ingressando na universidade.

Projeto desenvolvido para o Desafio Técnico do Processo Seletivo — Laboratório Vortex (UNIFOR).

## Arquitetura

Monorepo com duas aplicações:

| Pasta       | Aplicação                                    | Stack                                        |
| ----------- | -------------------------------------------- | -------------------------------------------- |
| `backend/`  | API RESTful                                  | NestJS, TypeScript, Prisma, PostgreSQL (Supabase) |
| `frontend/` | Landing page (desktop) + App mobile (PWA)    | Next.js (App Router), TypeScript, Tailwind CSS |

```
Frontend (Next.js PWA)  ──HTTP/JSON──▶  Backend (NestJS)  ──Prisma──▶  PostgreSQL (Supabase)
```

- **Autenticação**: JWT emitido pela própria API (`@nestjs/jwt` + Passport + bcrypt), com login social opcional via **Google (OAuth/Google Identity Services)**.
- **Negociação**: sem chat interno — o comprador preenche um formulário de interesse (curso, matrícula, dia/local de encontro e proposta de valor), o vendedor aceita/recusa pelo painel de pedidos e a combinação final acontece no **WhatsApp**. Pagamento é sempre combinado para acontecer só após a conferência presencial do item no campus.
- **Moderação/Admin**: dashboard interno (`/dashboard`) para banir/suspender contas, remover ou excluir anúncios, responder tickets de suporte e consultar o log de auditoria.
- **Notificações**: painel no header com contagem de não lidas, atualizado por polling (sem WebSocket) — avisa o vendedor quando alguém se interessa e avisa outros interessados quando o status do anúncio muda.
- **PWA**: `manifest.json` + Service Worker escrito à mão (`frontend/public/sw.js`), cadastro de anúncio offline (fila em IndexedDB + Background Sync) e navegação stale-while-revalidate para assets estáticos.

## Funcionalidades implementadas

### Marketplace (público / estudante)

- Cadastro e login por e-mail/senha (bcrypt) ou **Google Identity Services**; onboarding guiado no primeiro acesso e tela de "completar perfil" (WhatsApp, curso, matrícula) quando faltam dados obrigatórios.
- Feed de anúncios com busca por texto, filtro por categoria e paginação simples, tanto na landing pública (`/`) quanto no app autenticado (`/app`).
- CRUD de anúncios: criação com até 5 fotos (upload com validação de tipo/tamanho), edição de status (`ATIVO` → `NEGOCIANDO` → `CONCLUIDO`) e exclusão pelo dono.
- Fluxo de interesse/pedido: formulário com curso, matrícula, dia/horário e bloco do campus para encontro, aceitando o preço anunciado ou propondo outro valor; o vendedor decide quem aceitar e o pedido aceito vira uma negociação com WhatsApp liberado.
- Avaliações (0–5 estrelas + comentário) do vendedor após a entrega, exibidas no perfil público do usuário junto com o histórico de vendas/doações.
- Itens salvos ("favoritos"), itens vistos recentemente (cache local) e central de notificações com contagem de não lidas.
- Central de suporte: abertura de chamado pelo usuário e acompanhamento do status.
- Perfil público por usuário (`/perfil/:id`) com reputação, anúncios ativos e histórico de negociações concluídas.
- Interface 100% responsiva: navegação por abas + bottom tab bar no mobile, header completo no desktop.

### Dashboard administrativo (`/dashboard`, roles `ADMIN`/`SUPER_ADMIN`)

- Visão geral com métricas (usuários, anúncios ativos, negociações, pedidos concluídos), com cache local para consulta rápida offline.
- Gestão de usuários: busca por e-mail (com debounce), filtro por role/status, banir, suspender por N dias ou reativar conta — reativar também restaura automaticamente os anúncios que haviam sido suspensos junto com a moderação.
- Gestão de anúncios: busca por título/vendedor, suspender (reversível) ou excluir (permanente) qualquer anúncio.
- Central de suporte administrativa: listar e responder tickets abertos pelos usuários.
- Log de auditoria: histórico de todas as ações administrativas (quem, quando, o quê).
- Gestão de administradores (somente `SUPER_ADMIN`): promover/revogar acesso admin.

### PWA e modo offline

- App instalável (`manifest.json`, ícones, tema) com Service Worker versionado (`frontend/public/sw.js`).
- **Cadastro de anúncio offline**: o formulário salva o rascunho (dados + fotos) no IndexedDB e mostra uma esteira de progresso ("Dados salvos" → "Aguardando conexão" → "Publicado"); ao reconectar, a fila é publicada automaticamente (evento `online` + Background Sync no Chrome/Android) e a foto já enviada não é reenviada em caso de nova tentativa.
- A fila offline é isolada por usuário logado (nada de um rascunho vazar para a próxima conta que usar o mesmo aparelho) e é limpa no logout.
- **Itens vistos recentemente** ficam disponíveis offline (IndexedDB) e aparecem como fallback na aba Explorar quando a rede cai.
- "Meus anúncios" e as estatísticas do dashboard guardam o último snapshot bem-sucedido (por usuário) para exibição quando a API está inacessível.
- Indicador global de conectividade (banner) mostrando: offline com N itens na fila, publicando N itens, ou N itens com falha ao publicar.
- Chamadas de API **nunca** são cacheadas pelo Service Worker (evita servir dados de outra conta no mesmo aparelho) — só o app-shell e assets estáticos usam cache.

## Como rodar localmente

### Pré-requisitos

- Node.js 20+ e npm
- Um banco PostgreSQL (o projeto usa Supabase, mas qualquer Postgres funciona)

### 1. Backend

```bash
cd backend
npm install
# copie .env.example para .env e preencha DATABASE_URL, DIRECT_URL, JWT_SECRET e (opcional) GOOGLE_CLIENT_ID
npx prisma db push     # sincroniza o schema com o banco (no-op se já estiver criado)
npx prisma generate
npm run seed        # opcional: popula o banco com dados de exemplo
npm run start:dev   # API em http://localhost:3002 (evita conflito com Prisma Streams na 3001)
```

> **Dica — rodar sem o Supabase:** para desenvolver offline, rode `npx prisma dev`
> em outro terminal (sobe um Postgres local sem Docker) e use a `DATABASE_URL`
> que ele imprime no `.env` (nas duas variáveis). Depois é só repetir os
> comandos `db push`, `seed` e `start:dev`.

### 2. Frontend

```bash
cd frontend
npm install
# copie .env.example para .env.local (aponta para a API local por padrão)
npm run dev         # app em http://localhost:3000
```

### Login com Google (opcional)

O login com Google usa **Google Identity Services** (frontend) + **`google-auth-library`**
(backend) para verificar o ID token — não é necessário client secret.

1. No [Google Cloud Console](https://console.cloud.google.com/apis/credentials), crie um
   **OAuth client ID** do tipo "Web application" e adicione `http://localhost:3000` em
   "Authorized JavaScript origins".
2. Copie o Client ID gerado para **as duas** variáveis abaixo (precisam ser o mesmo valor):
   - `backend/.env` → `GOOGLE_CLIENT_ID`
   - `frontend/.env.local` → `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
3. Reinicie backend e frontend.

Sem essas variáveis configuradas, o botão "Continuar com o Google" simplesmente não
aparece e o cadastro/login por e-mail e senha continua funcionando normalmente.

## Principais tecnologias

- **Backend**: NestJS, Prisma ORM, PostgreSQL (Supabase), Passport JWT, class-validator, bcrypt, `@nestjs/throttler` (rate limiting)
- **Frontend**: Next.js (App Router), React, TypeScript, Tailwind CSS
- **PWA**: Web App Manifest + Service Worker (Cache Storage API), IndexedDB (fila offline + itens vistos), Background Sync

Histórico completo de mudanças em [`CHANGELOG.md`](CHANGELOG.md).

## Endpoints da API

Limite de requisições (`@nestjs/throttler`): 120 req/min por IP no geral, com limites mais baixos em `/auth/*` (5–15 req/min) contra brute-force.

### Autenticação & perfil

| Método | Rota                   | Auth | Descrição                                                            |
| ------ | ---------------------- | ---- | --------------------------------------------------------------------- |
| POST   | `/auth/register`       | —    | Cria usuário (nome, e-mail, senha forte, WhatsApp) e retorna JWT       |
| POST   | `/auth/login`          | —    | Autentica e retorna JWT                                                |
| POST   | `/auth/google`         | —    | Login/cadastro via ID token do Google (exige e-mail verificado), retorna JWT |
| GET    | `/auth/check-email`    | —    | `?email=` → `{ exists }`, usado no cadastro para checar duplicidade    |
| GET    | `/auth/me`             | JWT  | Dados do usuário logado                                                |
| PATCH  | `/auth/me`             | JWT  | Atualiza nome/WhatsApp/avatar/bio/curso (usado em `/completar-perfil` e no perfil) |
| PATCH  | `/auth/me/onboarding`  | JWT  | Marca o tour de onboarding como concluído                              |
| GET    | `/users/:id/profile`   | —    | Perfil público (reputação, anúncios ativos, histórico de negociações) |

### Anúncios & pedidos

| Método | Rota                          | Auth | Descrição                                                                |
| ------ | ----------------------------- | ---- | --------------------------------------------------------------------------- |
| GET    | `/items`                      | —    | Lista anúncios ativos/em negociação (filtros `?category=&search=`)          |
| GET    | `/items/mine`                 | JWT  | Anúncios do usuário logado (todos os status)                                |
| GET    | `/items/mine/interests`       | JWT  | Pedidos recebidos nos anúncios do usuário logado                            |
| GET    | `/items/mine/purchases`       | JWT  | Pedidos que o usuário (comprador) enviou em anúncios de outros              |
| GET    | `/items/:id`                  | —    | Detalhe de um anúncio                                                       |
| POST   | `/items`                      | JWT  | Cria anúncio (exige WhatsApp cadastrado)                                    |
| PATCH  | `/items/:id/status`           | JWT  | Muda status (`ATIVO`/`NEGOCIANDO`/`CONCLUIDO`), apenas o dono               |
| DELETE | `/items/:id`                  | JWT  | Remove anúncio (apenas o dono)                                              |
| POST   | `/items/:id/orders`           | JWT  | Envia/atualiza um pedido de interesse (curso, matrícula, encontro, valor)   |
| PATCH  | `/items/orders/:orderId/status` | JWT | Vendedor aceita (`NEGOCIANDO`) ou confirma entrega (`ENTREGUE`) de um pedido |
| GET    | `/items/:id/comments`         | —    | Lista comentários/dúvidas públicas do anúncio                              |
| POST   | `/items/:id/comments`         | JWT  | Comenta em um anúncio (bloqueado para contas banidas/suspensas)            |
| POST   | `/uploads`                    | JWT  | Upload de imagem do anúncio (JPG/PNG/WEBP/GIF, máx. 5 MB, mimetype+extensão validados) |

### Avaliações, salvos, notificações e suporte

| Método | Rota                           | Auth | Descrição                                              |
| ------ | ------------------------------ | ---- | -------------------------------------------------------- |
| POST   | `/reviews`                     | JWT  | Avalia o vendedor após um pedido `ENTREGUE`               |
| GET    | `/reviews/pending`             | JWT  | Pedidos entregues aguardando avaliação do comprador       |
| GET    | `/saved-items`                 | JWT  | Anúncios salvos pelo usuário                              |
| GET    | `/saved-items/ids`             | JWT  | Apenas os ids salvos (para marcar o coração nos cards)     |
| POST   | `/saved-items/:itemId`         | JWT  | Salva um anúncio                                          |
| DELETE | `/saved-items/:itemId`         | JWT  | Remove um anúncio dos salvos                              |
| GET    | `/notifications`               | JWT  | Últimas 30 notificações do usuário                         |
| GET    | `/notifications/unread-count`  | JWT  | Contagem de notificações não lidas                         |
| PATCH  | `/notifications/:id/read`      | JWT  | Marca uma notificação como lida                            |
| PATCH  | `/notifications/read-all`      | JWT  | Marca todas as notificações como lidas                     |
| POST   | `/support/tickets`             | JWT  | Abre um chamado de suporte                                 |
| GET    | `/support/tickets/mine`        | JWT  | Chamados abertos pelo usuário logado                       |
| GET    | `/stats`                       | —    | Estatísticas para a landing page                          |

### Administração (`ADMIN` / `SUPER_ADMIN`)

| Método | Rota                            | Auth  | Descrição                                                        |
| ------ | ------------------------------- | ----- | ------------------------------------------------------------------- |
| GET    | `/admin/stats`                  | Admin | Métricas gerais para o dashboard                                     |
| GET    | `/admin/users`                  | Admin | Lista/filtra usuários (`page`, `limit`, `role`, `email`, `accountStatus`) |
| PATCH  | `/admin/users/:id/moderate`     | Admin | Banir, suspender (N dias) ou reativar uma conta                     |
| GET    | `/admin/items`                  | Admin | Lista/filtra anúncios (`page`, `limit`, `status`, `search`)          |
| PATCH  | `/admin/items/:id/take-down`    | Admin | Suspende um anúncio (reversível)                                     |
| PATCH  | `/admin/items/:id/restore`      | Admin | Reativa um anúncio suspenso                                          |
| DELETE | `/admin/items/:id`              | Admin | Exclui um anúncio permanentemente                                    |
| GET    | `/admin/support`                | Admin | Lista chamados de suporte (`?status=`)                               |
| PATCH  | `/admin/support/:id`            | Admin | Responde/atualiza status de um chamado                               |
| GET    | `/admin/admins`                 | Super admin | Lista administradores                                         |
| POST   | `/admin/admins`                 | Super admin | Promove um usuário a `ADMIN`                                  |
| PATCH  | `/admin/admins/:id/revoke`      | Super admin | Revoga o acesso admin de um usuário                            |
| GET    | `/admin/audit`                  | Admin | Log de auditoria das ações administrativas (`page`, `limit`, `action`) |

## Diário de Bordo da IA

> Seção obrigatória do desafio (Seção 3 do edital), documentando o uso de IA generativa durante o desenvolvimento.

### Ferramentas utilizadas

- **Cursor** (agente de IA no editor, modo Agent) foi a ferramenta principal usada do dia 1 ao dia 15: geração de código, refatorações grandes, debugging interativo (lendo logs/erros de terminal em tempo real), varredura de code review e escrita desta documentação.
- Subagentes especializados do próprio Cursor (`explore`) foram usados para auditar backend e frontend em paralelo em busca de bugs, código morto e falhas de segurança antes da entrega final.
- Modelos de linguagem por trás do agente (família Claude/GPT, conforme configurado no Cursor) para geração de código; nenhuma ferramenta de IA foi usada para gerar texto de commit/PR sem revisão humana.

### Estratégia de engenharia de prompts

O fluxo foi **especificação → plano → diff → validação empírica**: descrever o comportamento esperado (contrato de UX + restrições técnicas), revisar a proposta do agente antes de aplicar, rodar a aplicação e devolver evidência real (stack trace, status HTTP, estado do IndexedDB) para a correção — em vez de assumir a causa raiz no primeiro pedido.

Em linhas gerais, os três prompts abaixo cobrem o ciclo completo de uso da IA neste projeto: (1) **feature nova com escopo aberto** (PWA offline), (2) **diagnóstico a partir de sintoma em produção** (fila offline vs. erro genérico de rede), (3) **auditoria transversal** antes da entrega (segurança, domínio e documentação).

**Prompt 1 — Implementação do modo offline (PWA) do zero:**

```
Preciso implementar suporte offline (PWA) no Desapega UNIFOR.

Requisitos:
1. Service Worker com estratégias de cache por tipo de recurso
   (app-shell / assets estáticos). Não cachear respostas da API
   autenticada.
2. Permitir criar anúncio offline: persistir formulário + imagens
   em IndexedDB e publicar automaticamente ao reconectar
   (Background Sync quando disponível).
3. Cache local de itens visualizados recentemente para fallback
   na navegação offline.
4. Sugira e implemente caches auxiliares no dashboard admin
   (ex.: último snapshot de métricas), desde que não vazem dados
   entre contas no mesmo dispositivo.

Antes de codar, proponha um plano em etapas para eu revisar.
```

Prompt **aberto no “como”** (estratégias e escopo do dashboard) e **fechado no “o quê”** (fila offline, viewed cache, isolamento de dados). Resultado: plano com SW (network-first em navegações, stale-while-revalidate em assets, bypass cross-origin), IndexedDB (`pendingItems` / `viewedItems`), flush via `online` + Background Sync, e snapshot de stats no admin — revisado antes da implementação.

**Prompt 2 — Refinamento de UX guiado por bug real em produção:**

```
Bug no fluxo PWA de publicação: ao criar anúncio sem rede, a UI
trata como falha genérica de carregamento em “Meus anúncios”.

Esperado:
- Distinguir “API inacessível” de “item enfileirado localmente”.
- Feedback visual da esteira: dados salvos → aguardando conexão
  → publicando → publicado (ou erro recuperável com retry).
- Revisar os demais estados offline do PWA (banner global, fila,
  empty states) para consistência.

Diagnostique a causa no front (cache/fila vs. fetch) e corrija
sem alterar o contrato da API.
```

Partiu de um **sintoma**, não de um arquivo-alvo. O agente identificou que a aba “Meus anúncios” colapsava qualquer rejeição de `getMyItems` em erro genérico, mesmo com pendências válidas no IndexedDB, e passou a modelar estados explícitos da fila (salvo → aguardando → sincronizando → ok/erro).

**Prompt 3 — Varredura de qualidade/segurança em todo o projeto:**

```
Faça uma auditoria do monorepo (NestJS + Next.js) antes da entrega.

Prioridade: segurança > corretude de domínio > UX responsiva
(web/mobile, marketplace e /dashboard) > código morto/redundante.

Verifique em especial: rotas sem auth, vazamento de PII, inconsistência
entre enums Prisma e fluxos de moderação, race conditions em pedidos,
e isolamento da fila offline por usuário.

Corrija os achados em lotes pequenos com typecheck/build. Ao final,
atualize o README com funcionalidades reais e o Diário de Bordo da IA
(ferramentas, prompts representativos, reflexão crítica).
```

Pedido de **fechamento**: dois subagentes `explore` (backend/frontend) mapearam issues em paralelo; a priorização foi humana; cada lote foi validado com `build`/`typecheck` antes do próximo.

### Reflexão crítica

Durante a varredura final (Prompt 3 acima), a auditoria automatizada encontrou **dois problemas que a própria IA havia introduzido em iterações anteriores** e que passariam despercebidos em uma revisão superficial:

1. **Endpoints de debug esquecidos em produção.** Ao investigar um erro de serialização de `Decimal` do Prisma dias antes, o agente criou `GET /debug/items` e `GET /debug/user-schema` em `app.controller.ts` para inspecionar o banco em produção — úteis naquele momento, mas **sem nenhuma autenticação** e devolvendo e-mail, `googleId` e schema completo da tabela `User`. O comentário `/** Diagnóstico temporário (remover depois) */` deixado pela própria IA é exatamente o tipo de "alucinação de escopo" que só aparece numa revisão dedicada: o agente resolveu o problema imediato mas não fechou o loop de segurança. Corrigido removendo os dois endpoints por completo.
2. **Moderação destrutiva por engano.** Ao implementar banimento/suspensão de contas, o agente reaproveitou o status `CONCLUIDO` (usado para "vendido/doado") para tirar anúncios do feed em vez de introduzir o status `SUSPENSO` que já existia no schema para esse fim — um erro de raciocínio, não de digitação: o efeito visual (some do feed) era o esperado, mas a ação virava **irreversível** (reativar a conta não trazia os anúncios de volta, e eles ficavam marcados como "vendidos" incorretamente no histórico do vendedor). Identificado ao comparar o enum `ItemStatus` do schema com o código de moderação; corrigido para usar `SUSPENSO` e restaurar os itens automaticamente ao reativar a conta.

O aprendizado prático: pedir à IA para "resolver o bug X" tende a produzir uma correção pontual e plausível à primeira vista, mas só uma segunda passada com foco em *consistência do domínio* (schema, enums, ciclo de vida dos dados) revela esse tipo de efeito colateral. Por isso a etapa de varredura final foi tratada como obrigatória e não como polimento opcional.

## Deploy (produção) — Render + Supabase

O banco continua no **Supabase**. A **API NestJS** sobe no **Render**; o **frontend Next.js** sobe na **Vercel**. O arquivo [`render.yaml`](render.yaml) descreve a API (e opcionalmente um frontend no Render, se preferir).

> No plano **free**, o serviço “dorme” após ~15 min sem tráfego — a primeira requisição depois disso pode demorar 30–60s (cold start).

### 0. Pré-requisitos

1. Conta no [Render](https://render.com) conectada ao GitHub `lpeixotomagalhaes/Desapega-Unifor`
2. Projeto Supabase com `DATABASE_URL` (pooler, porta **6543**) e `DIRECT_URL` (porta **5432**)
3. Código desta branch já no GitHub (faça push se ainda não fez)

### 1. Subir a API (`desapega-api`)

1. No Render: **New → Web Service** → selecione o repositório
2. Configure:
   - **Name:** `desapega-api`
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install --include=dev && npm run build`
   - **Start Command:** `npm run start:prod`
   - **Instance type:** Free
3. Em **Environment**, adicione:

| Variável | Valor |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | **Transaction pooler** Supabase (host `*.pooler.supabase.com`, porta **6543**) com `?pgbouncer=true` — **não** use `db.*.supabase.co` |
| `DIRECT_URL` | Session pooler ou Direct (porta **5432**) |
| `JWT_SECRET` | string longa e aleatória (Generate no Render) |
| `CORS_ORIGIN` | URL do frontend (ex. `https://desapega-web.onrender.com`) — pode preencher depois do passo 2 |
| `GOOGLE_CLIENT_ID` | (opcional) mesmo Client ID do Google Cloud |
| `SUPER_ADMIN_EMAIL` | (opcional) e-mail de um usuário já cadastrado para promover a SUPER_ADMIN no seed |

4. **Health Check Path:** `/`
5. **Start Command** (se criar manualmente): `npx prisma migrate deploy && npm run start:prod` — aplica migrations no Supabase antes de subir a API
6. Clique em **Create Web Service** e aguarde o deploy (logs verdes + `API rodando na porta ...`)
7. Anote a URL pública, ex.: `https://desapega-api.onrender.com`

Teste rápido: abra `https://SEU-API.onrender.com/` — deve retornar JSON com `"status":"ok"` e `"db":"up"`.

Se vier `"db":"down"`, a API subiu mas **não conecta no Supabase**. Confira:
1. `DATABASE_URL` é o **Transaction pooler** (6543 / `pooler.supabase.com`), senha correta (URL-encode caracteres especiais)
2. Em **Supabase → Database → Network Restrictions**, ou deixe aberto, ou libere os IPs outbound do Render (ex. `74.220.48.0/24` e `74.220.56.0/24` no Connect do serviço)
3. Veja os **logs do Render** (`Health check: Postgres down — ...`) — o motivo do erro não é exposto na resposta pública por segurança, só no log do servidor

### 2. Subir o frontend na Vercel

1. No [Vercel](https://vercel.com): **Add New → Project** → importe `lpeixotomagalhaes/Desapega-Unifor`
2. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Next.js
   - **Build Command:** `npm run build` (padrão)
   - **Install Command:** `npm install` (padrão)
3. Em **Environment Variables**:

| Variável | Valor |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | URL da API no Render, **sem barra no final** (ex. `https://desapega-unifor-nvt5.onrender.com`) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | (opcional) mesmo Client ID do backend |

> `NEXT_PUBLIC_*` é embutido no **build**. Se mudar a URL da API depois, faça um novo deploy na Vercel.

4. Deploy e anote a URL, ex.: `https://desapega-unifor.vercel.app`

Alternativa via CLI (na pasta `frontend/`):

```bash
npx vercel --prod --yes \
  --build-env NEXT_PUBLIC_API_URL=https://desapega-unifor-nvt5.onrender.com
```

### 3. Ajustes finais (obrigatórios)

1. No Render (**desapega-api → Environment**), defina:
   - `CORS_ORIGIN=https://SEU-APP.vercel.app` (URL exata da Vercel, sem barra no final)
2. Redeploy da API (Manual Deploy → Deploy latest commit) — ou aguarde o restart automático ao salvar env
3. Se usar login Google, no [Google Cloud Console](https://console.cloud.google.com/apis/credentials) adicione:
   - **Authorized JavaScript origins:** `https://desapega-unifor-vert.vercel.app` e `http://localhost:3000`
   - **Authorized redirect URIs:** `https://desapega-unifor-vert.vercel.app/auth/google/callback` e `http://localhost:3000/auth/google/callback`
4. No **Render** (`desapega-api` → Environment), confirme `GOOGLE_CLIENT_ID` com o **mesmo** Client ID do Google (sem isso `/auth/google` falha em produção).

### Cloudflare (opcional — precisa de domínio próprio)

O proxy “nuvem laranja” do Cloudflare **não** se aplica direto em `*.vercel.app`: você não controla o DNS da Vercel. Sem domínio próprio, use a segurança nativa da Vercel (HTTPS + edge) — já basta para o desafio.

Com domínio (ex. `desapega.seudominio.com`):
1. Registrar o domínio e adicionar no Cloudflare (nameservers do registrador → Cloudflare)
2. No Cloudflare DNS: `CNAME` `@` ou `www` → `cname.vercel-dns.com` (proxy laranja ok)
3. Na Vercel: **Project → Settings → Domains** → adicionar o domínio e seguir a validação
4. Atualizar `CORS_ORIGIN` no Render e **Authorized JavaScript origins** no Google com a URL do domínio
5. **Não** coloque a API Nest do Render atrás do mesmo hostname do front sem proxy reverso bem configurado — mantenha API no Render e front no domínio

Não use Worker/proxy improvisado apontando para `*.vercel.app` só “por segurança”: quebra cookies, cache e preview da Vercel.

### 4. (Opcional) Deploy via Blueprint

1. Push do `render.yaml` no repositório
2. No Render: **New → Blueprint** → escolha o repo
3. Preencha as env vars pedidas (`DATABASE_URL`, `DIRECT_URL`, `CORS_ORIGIN`, `NEXT_PUBLIC_API_URL`, etc.)
4. Aplique

### Limitações importantes no free tier

- **Uploads de imagem** ficam no disco efêmero do container da API: somem após redeploy/restart. URLs externas (ex. Picsum no seed) continuam ok.
- Cold start: espere a API “acordar” antes de testar login/anúncios.
- Banco: use sempre o **pooler** do Supabase em `DATABASE_URL` (evita estourar conexões).

### Links de produção

- API (Render): `https://desapega-unifor-nvt5.onrender.com`
- Frontend (Vercel): `https://desapega-unifor-vert.vercel.app`
- Banco: Supabase projeto `desapega-unifor` (`txztxdcunjwfnkxoxamh`)
