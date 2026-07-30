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

O banco continua no **Supabase**. No Render você sobe **dois Web Services** (API NestJS + frontend Next.js). O arquivo [`render.yaml`](render.yaml) na raiz descreve esses serviços (Blueprint).

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
| `DATABASE_URL` | connection string do Supabase (pooler / 6543), com `?pgbouncer=true` |
| `DIRECT_URL` | connection string do Supabase (5432) |
| `JWT_SECRET` | string longa e aleatória (Generate no Render) |
| `CORS_ORIGIN` | URL do frontend (ex. `https://desapega-web.onrender.com`) — pode preencher depois do passo 2 |
| `GOOGLE_CLIENT_ID` | (opcional) mesmo Client ID do Google Cloud |

4. **Health Check Path:** `/`
5. Clique em **Create Web Service** e aguarde o deploy (logs verdes + `API rodando na porta ...`)
6. Anote a URL pública, ex.: `https://desapega-api.onrender.com`

Teste rápido: abra `https://SEU-API.onrender.com/` — deve retornar JSON `{ "status": "ok", ... }`.

### 2. Subir o frontend (`desapega-web`)

1. **New → Web Service** de novo no mesmo repositório
2. Configure:
   - **Name:** `desapega-web`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install --include=dev && npm run build`
   - **Start Command:** `npm start`
   - **Instance type:** Free
3. Em **Environment**:

| Variável | Valor |
| --- | --- |
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_API_URL` | URL da API do passo 1, **sem barra no final** (ex. `https://desapega-api.onrender.com`) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | (opcional) mesmo Client ID do backend |

> `NEXT_PUBLIC_*` é embutido no **build**. Se mudar a URL da API depois, force um **Clear build cache & deploy** no frontend.

4. Crie o serviço e anote a URL, ex.: `https://desapega-web.onrender.com`

### 3. Ajustes finais (obrigatórios)

1. Volte em **desapega-api → Environment** e defina:
   - `CORS_ORIGIN=https://desapega-web.onrender.com`
2. Redeploy da API (Manual Deploy → Deploy latest commit)
3. Se usar login Google, no [Google Cloud Console](https://console.cloud.google.com/apis/credentials) adicione em **Authorized JavaScript origins**:
   - `https://desapega-web.onrender.com`
   - (e mantenha `http://localhost:3000` para local)

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

- API: (preencher após o deploy)
- Frontend: (preencher após o deploy)
- Banco: Supabase (`txztxdcunjwfnkxoxamh` ou o projeto que você estiver usando)
