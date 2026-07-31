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
- **Negociação**: sem chat interno — o botão "Tenho interesse" na página do produto registra o interesse no backend e abre uma conversa no **WhatsApp** com quem anunciou. Pagamento é sempre combinado para acontecer só após a conferência presencial do item no campus.
- **Notificações**: painel no header com contagem de não lidas, atualizado por polling (sem WebSocket) — avisa o vendedor quando alguém se interessa e avisa outros interessados quando o status do anúncio muda.
- **PWA**: `manifest.json` + Service Worker escrito à mão (`frontend/public/sw.js`) com cache-first para assets estáticos e network-first com fallback offline para dados da API.

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
npm run start:dev   # API em http://localhost:3001
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

- **Backend**: NestJS, Prisma ORM, PostgreSQL (Supabase), Passport JWT, class-validator, bcrypt
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **PWA**: Web App Manifest + Service Worker (Cache Storage API)

## Endpoints da API

| Método | Rota                        | Auth | Descrição                                                          |
| ------ | --------------------------- | ---- | ------------------------------------------------------------------- |
| POST   | `/auth/register`            | —    | Cria usuário (nome, e-mail, senha forte, WhatsApp) e retorna JWT     |
| POST   | `/auth/login`                | —    | Autentica e retorna JWT                                             |
| POST   | `/auth/google`               | —    | Login/cadastro via ID token do Google, retorna JWT                  |
| GET    | `/auth/check-email`          | —    | `?email=` → `{ exists }`, usado no cadastro para checar duplicidade |
| GET    | `/auth/me`                   | JWT  | Dados do usuário logado                                             |
| PATCH  | `/auth/me`                   | JWT  | Atualiza nome/WhatsApp/avatar (usado em `/completar-perfil`)         |
| PATCH  | `/auth/me/onboarding`        | JWT  | Marca o tour de onboarding como concluído                           |
| GET    | `/items`                     | —    | Lista anúncios ativos/em negociação (filtros `?category=&search=`)  |
| GET    | `/items/mine`                | JWT  | Anúncios do usuário logado (todos os status)                        |
| GET    | `/items/mine/interests`      | JWT  | Interesses recebidos nos anúncios do usuário logado                 |
| GET    | `/items/:id`                 | —    | Detalhe de um anúncio                                               |
| POST   | `/items`                     | JWT  | Cria anúncio (exige WhatsApp cadastrado)                            |
| POST   | `/uploads`                   | JWT  | Upload de imagem do anúncio (JPG/PNG/WEBP/GIF, máx. 5 MB)           |
| PATCH  | `/items/:id/status`          | JWT  | Muda status (`ATIVO`/`NEGOCIANDO`/`CONCLUIDO`), apenas o dono        |
| POST   | `/items/:id/interest`        | JWT  | Registra interesse e retorna `{ whatsappUrl }` para contato          |
| DELETE | `/items/:id`                 | JWT  | Remove anúncio (apenas o dono)                                      |
| GET    | `/notifications`             | JWT  | Últimas 30 notificações do usuário                                   |
| GET    | `/notifications/unread-count`| JWT  | Contagem de notificações não lidas                                   |
| PATCH  | `/notifications/:id/read`    | JWT  | Marca uma notificação como lida                                      |
| PATCH  | `/notifications/read-all`    | JWT  | Marca todas as notificações como lidas                               |
| GET    | `/stats`                     | —    | Estatísticas para a landing page                                    |

## Diário de Bordo da IA

> Seção obrigatória do desafio (Seção 3 do edital), documentando o uso de IA generativa durante o desenvolvimento.

### Ferramentas utilizadas

<!-- TODO: liste as IAs usadas ao longo dos 15 dias (ex: Cursor, ChatGPT, Claude, Copilot...) -->

- Cursor (agente de IA no editor)

### Estratégia de engenharia de prompts

<!-- TODO: cole aqui 2-3 prompts reais e complexos usados durante o desenvolvimento -->

**Prompt 1 — Estruturação inicial do projeto:**

```
(colar prompt aqui)
```

**Prompt 2 — Service Worker do PWA:**

```
(colar prompt aqui)
```

### Compartilhamento de histórico (opcional)

<!-- TODO: link de pelo menos um chat longo de desenvolvimento, se possível -->

### Reflexão crítica

<!-- TODO: descreva um momento em que a IA errou/alucinou, como você identificou e corrigiu -->

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

4. **Health Check Path:** `/`
5. Clique em **Create Web Service** e aguarde o deploy (logs verdes + `API rodando na porta ...`)
6. Anote a URL pública, ex.: `https://desapega-api.onrender.com`

Teste rápido: abra `https://SEU-API.onrender.com/` — deve retornar JSON com `"status":"ok"` e `"db":"up"`.

Se vier `"db":"down"`, a API subiu mas **não conecta no Supabase**. Confira:
1. `DATABASE_URL` é o **Transaction pooler** (6543 / `pooler.supabase.com`), senha correta (URL-encode caracteres especiais)
2. Em **Supabase → Database → Network Restrictions**, ou deixe aberto, ou libere os IPs outbound do Render (ex. `74.220.48.0/24` e `74.220.56.0/24` no Connect do serviço)
3. Veja o campo `dbError` no JSON do `/` e os logs do Render (`Falha ao conectar no Postgres`)

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
3. Se usar login Google, no [Google Cloud Console](https://console.cloud.google.com/apis/credentials) adicione em **Authorized JavaScript origins**:
   - `https://desapega-unifor-vert.vercel.app` (produção atual)
   - `http://localhost:3000` (local)
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
