# Rede de Apoio — Dra. Gabriela & Dani Cunha

Sistema completo (site + backend + banco) de "rede de apoio" para a campanha conjunta de **Dra. Gabriela** (candidata a Deputada Estadual, RJ) e **Dani Cunha** (Deputada Federal, RJ, candidata à reeleição): cadastro de apoiadores, link de indicação pessoal e ranking público de quem mais indica.

Stack: **Express** (backend) + **Supabase** (Postgres, dados) + **Vercel** (hospedagem).

## Rodando localmente

1. Crie um projeto no [Supabase](https://supabase.com) e rode o conteúdo de `supabase-schema.sql` no SQL Editor dele (cria a tabela `cadastros`).
2. Copie `.env.example` para `.env` e preencha `SUPABASE_URL` e `SUPABASE_SERVICE_KEY` (em Project Settings → API, no painel do Supabase) e um `ADMIN_TOKEN` à sua escolha.
3. Instale e rode:
   ```bash
   npm install
   npm start
   ```
4. Acesse **http://localhost:3010** (porta 3010 porque a 3000 já está em uso por outro projeto nesta máquina).

Passo a passo detalhado, com cliques explicados: `PRIMEIROS-PASSOS.md`.

## Arquivos

| Arquivo/pasta | O que é |
|---|---|
| `server.js` | App Express: rotas do site + API de cadastro/ranking/estatísticas |
| `db.js` | Camada de acesso ao Supabase (única parte que fala com o banco) |
| `api/index.js` | Ponto de entrada da função serverless no Vercel (reexporta `server.js`) |
| `vercel.json` | Roteia toda requisição pra `api/index.js` no Vercel |
| `supabase-schema.sql` | SQL pra criar a tabela `cadastros` — rode uma vez no Supabase |
| `.env.example` | Variáveis de ambiente necessárias (copie pra `.env` local) |
| `public/index.html` | Landing: hero, sobre as duas candidatas, trajetória, como funciona, cadastro, ranking |
| `public/obrigado.html` | Página pós-cadastro — link de indicação pessoal + compartilhar no WhatsApp |
| `public/politica-privacidade.html` | Política de privacidade LGPD |
| `ARQUITETURA.md` | Como o backend funciona por dentro |
| `schema-cadastro-indicacao.md` | Formato dos dados de cada cadastro |
| `PRIMEIROS-PASSOS.md` | Passo a passo completo pra colocar no ar (Supabase + GitHub + Vercel) |

## Como funciona (visão geral)

1. Apoiador se cadastra em `public/index.html` (ou chega via `?ref=CODIGO` de outro apoiador).
2. O formulário envia os dados pra `POST /api/cadastro`, que gera um `codigo_indicacao` único, grava no Supabase e devolve `{ codigo, link }` na mesma resposta.
3. O site redireciona pra `obrigado.html`, mostrando o link pessoal do apoiador pra ele compartilhar.
4. `GET /api/ranking` e `GET /api/stats` consultam o Supabase a cada chamada — sempre atualizados.

## Variáveis de ambiente

| Variável | Obrigatória? | Pra que serve |
|---|---|---|
| `SUPABASE_URL` | Sim | URL do projeto Supabase (Project Settings → API) |
| `SUPABASE_SERVICE_KEY` | Sim | Chave `service_role` do Supabase — **nunca exponha no frontend** |
| `ADMIN_TOKEN` | Não | Libera `/api/export.csv`. Sem ela, a exportação fica desativada |
| `PORT` | Não | Só usada localmente (padrão 3010). O Vercel define a porta sozinho |

## Checklist antes de publicar pra valer

1. ~~**Conteúdo**~~ — já preenchido: nomes, cargos, bios e trajetória das duas candidatas, contatos (WhatsApp, e-mail, Instagram/site oficial).
2. **Cores** — ajuste as variáveis CSS em `:root` (mesmo bloco nos 3 arquivos HTML): `--tinta`, `--acento`, `--verde`.
3. **Supabase** — rode `supabase-schema.sql`, copie as chaves.
4. **Vercel** — importe o repositório do GitHub, configure as variáveis de ambiente (mesmas do `.env.example`).
5. **`ADMIN_TOKEN`** — defina um valor forte antes de publicar.
6. **Jurídico** — revise `public/politica-privacidade.html` com quem cuida disso nas duas campanhas (há um aviso destacado sobre definir o "controlador" dos dados).

## Limitações conhecidas

Documentadas em detalhe em `ARQUITETURA.md`.
