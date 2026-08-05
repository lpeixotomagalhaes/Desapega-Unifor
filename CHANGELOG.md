# Changelog

Todas as mudanças relevantes do projeto são documentadas neste arquivo.
Formato inspirado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

## [Unreleased]

### Segurança

- Removidos os endpoints de diagnóstico `GET /debug/items` e `GET /debug/user-schema`, que não exigiam autenticação e expunham dados de usuários (e-mail, `googleId`) e o schema do banco.
- `GET /` (health check) não retorna mais detalhes internos do erro de conexão com o banco (apenas loga no servidor).
- Login com e-mail/senha agora normaliza o e-mail (trim + lowercase) antes de consultar o banco, evitando falhas de login por diferença de caixa.
- Login com Google passou a rejeitar contas com `email_verified: false` e a normalizar o e-mail antes de vincular/criar o usuário.
- `CORS_ORIGIN` não definido em produção agora emite um aviso explícito nos logs em vez de refletir qualquer origem silenciosamente.
- Upload de imagens exige simultaneamente mimetype **e** extensão permitidos (antes bastava um dos dois).
- Adicionado rate limiting (`@nestjs/throttler`): 120 req/min por IP no geral e limites mais baixos (5–15 req/min) nas rotas de `/auth/*`.
- A fila de anúncios offline (IndexedDB) agora é isolada por usuário e é apagada no logout, evitando que um rascunho (e o JWT salvo junto) vaze para outra conta usada no mesmo aparelho.
- O Service Worker parou de cachear respostas de API cross-origin — a Cache API ignora o header `Authorization`, então cachear essas respostas podia expor dados de outra conta no mesmo aparelho.

### Corrigido

- Banimento/suspensão de conta usava o status `CONCLUIDO` (vendido/doado) para tirar anúncios do feed; agora usa `SUSPENSO` e a reativação da conta restaura automaticamente os anúncios suspensos.
- Corrigida condição de corrida em que dois pedidos concorrentes podiam ambos "ganhar" a negociação de um mesmo anúncio, sobrescrevendo silenciosamente o comprador em negociação.
- Reenviar um pedido (`POST /items/:id/orders`) já em `NEGOCIANDO` não reseta mais o status para `PENDENTE`, e reenviar um pedido `ENTREGUE`/`NEGOCIANDO` retorna erro claro em vez de sobrescrever.
- Corrigida corrida na criação de pedidos (`P2002`) quando dois requests simultâneos criavam o mesmo par comprador/anúncio.
- Usuários banidos/suspensos não conseguem mais comentar em anúncios ou avaliar vendedores (o bloqueio já existia para criar/negociar anúncios, mas não para essas ações).
- Paginação do dashboard admin (`page`/`limit`) não quebra mais silenciosamente com `NaN` quando o parâmetro de query não é um número válido.
- Anúncios salvos (`saved-items`) não podem mais ser salvos quando o anúncio está `SUSPENSO`.
- Removida rota duplicada `GET /items/mine/orders` (idêntica a `GET /items/mine/interests`) e o endpoint legado e quebrado `POST /items/:id/interest`.
- **Landing page**: o estado de erro do feed de anúncios nunca era limpo entre buscas, então uma falha de rede pontual deixava a mensagem de erro presa mesmo depois de a API voltar a responder; a busca também não cancelava respostas antigas (condição de corrida ao trocar de categoria rapidamente).
- **Fila offline de anúncios**: itens que ficavam com status "publicando" (`syncing`) quando a aba era fechada/recarregada no meio do envio ficavam presos nesse estado para sempre; agora voltam para "pendente" automaticamente na próxima tentativa de sincronização.
- **Tela de criar anúncio**: ao salvar offline, a tela ficava presa em "aguardando conexão" mesmo depois de o item ser publicado com sucesso (ou falhar) em segundo plano; agora ela observa a fila e avança para sucesso/erro automaticamente.
- Reenvio de fotos após falha de publicação offline duplicava o upload; agora as URLs já enviadas são reaproveitadas.
- **`ImageDropzone`**: corrigido vazamento de memória (blob URLs de preview não eram revogadas corretamente ao desmontar o componente ou ao o formulário pai substituir a lista de imagens).
- **Bottom tab bar (mobile)**: navegar para Início/Buscar/Anunciar não fechava mais o menu ou o painel de suporte se estivessem abertos; o ícone "Buscar" também acendia incorretamente quando o usuário estava em "Meus anúncios" ou "Salvos" (agora acende "Menu", de onde essas telas são acessadas no mobile).
- Dashboard admin (usuários e anúncios): busca por texto disparava uma requisição por tecla digitada; agora usa debounce de ~350ms.

### Adicionado

- Cadastro de anúncio 100% funcional offline: rascunho salvo em IndexedDB, publicação automática ao reconectar (evento `online` + Background Sync) e esteira de progresso visual.
- Cache local (por usuário) de "Meus anúncios" e das estatísticas do dashboard admin para exibição quando a API está inacessível.
- Banner global de conectividade com contagem de itens pendentes/publicando/com falha.
- Perfil público de usuário com reputação, anúncios ativos e histórico de negociações.

## Como este changelog é mantido

Este é um projeto de desafio técnico desenvolvido em ciclo curto (~15 dias) com forte apoio de IA generativa (ver "Diário de Bordo da IA" no [README](README.md)); o changelog documenta principalmente a rodada final de revisão de código e correções de segurança/bugs antes da entrega, além dos marcos funcionais mais relevantes do desenvolvimento.
