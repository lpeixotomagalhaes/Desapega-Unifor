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

- **Autenticação**: JWT emitido pela própria API (`@nestjs/jwt` + Passport + bcrypt).
- **PWA**: `manifest.json` + Service Worker escrito à mão (`frontend/public/sw.js`) com cache-first para assets estáticos e network-first com fallback offline para dados da API.

## Como rodar localmente

### Pré-requisitos

- Node.js 20+ e npm
- Um banco PostgreSQL (o projeto usa Supabase, mas qualquer Postgres funciona)

### 1. Backend

```bash
cd backend
npm install
# copie .env.example para .env e preencha DATABASE_URL, DIRECT_URL e JWT_SECRET
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

## Principais tecnologias

- **Backend**: NestJS, Prisma ORM, PostgreSQL (Supabase), Passport JWT, class-validator, bcrypt
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **PWA**: Web App Manifest + Service Worker (Cache Storage API)

## Endpoints da API

| Método | Rota             | Auth | Descrição                                        |
| ------ | ---------------- | ---- | ------------------------------------------------ |
| POST   | `/auth/register` | —    | Cria usuário e retorna JWT                       |
| POST   | `/auth/login`    | —    | Autentica e retorna JWT                          |
| GET    | `/auth/me`       | JWT  | Dados do usuário logado                          |
| GET    | `/items`         | —    | Lista anúncios (filtros `?category=&search=`)    |
| GET    | `/items/mine`    | JWT  | Anúncios do usuário logado                       |
| GET    | `/items/:id`     | —    | Detalhe de um anúncio                            |
| POST   | `/items`         | JWT  | Cria anúncio                                     |
| DELETE | `/items/:id`     | JWT  | Remove anúncio (apenas o dono)                   |
| GET    | `/stats`         | —    | Estatísticas para a landing page                 |

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

## Deploy (produção)

<!-- TODO: preencher quando o deploy for feito -->

- API: (Render)
- Frontend: (Vercel)
- Banco: Supabase
