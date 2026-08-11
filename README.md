# Rede de Apoio — Dra. Gabriela & Dani Cunha

Sistema completo (site + backend + banco) de "rede de apoio" para a campanha conjunta de **Dra. Gabriela** (candidata a Deputada Estadual, RJ) e **Dani Cunha** (Deputada Federal, RJ, candidata à reeleição): cadastro de apoiadores, link de indicação pessoal e ranking público de quem mais indica.

Stack: **Express** (backend) + **Neon/Postgres** (dados, via integração Marketplace do Vercel) + **Vercel** (hospedagem) — tudo gerenciado a partir do mesmo painel do Vercel.

## Rodando localmente

1. Crie o projeto no Vercel e o banco (ver `PRIMEIROS-PASSOS.md` — resumindo: Vercel → Storage → Browse Storage → Neon).
2. Rode o conteúdo de `schema.sql` na aba **Query** do banco, dentro do painel do Vercel (cria a tabela `cadastros`).
3. Puxe as variáveis de ambiente reais pro seu computador:
   ```bash
   npx vercel link
   npx vercel env pull .env
   ```
4. Abra `.env` e adicione uma linha `ADMIN_TOKEN=` com uma senha à sua escolha (não vem do Vercel automaticamente).
5. Instale e rode:
   ```bash
   npm install
   npm start
   ```
6. Acesse **http://localhost:3010** (porta 3010 porque a 3000 já está em uso por outro projeto nesta máquina).

Passo a passo detalhado, com cliques explicados: `PRIMEIROS-PASSOS.md`.

## Arquivos

| Arquivo/pasta | O que é |
|---|---|
| `server.js` | App Express: rotas do site + API de cadastro/ranking/estatísticas |
| `db.js` | Camada de acesso ao banco Neon (única parte que fala com o banco) |
| `api/index.js` | Ponto de entrada da função serverless no Vercel (reexporta `server.js`) |
| `vercel.json` | Roteia toda requisição pra `api/index.js` no Vercel |
| `schema.sql` | SQL pra criar a tabela `cadastros` — rode uma vez no banco |
| `.env.example` | Variáveis de ambiente necessárias (copie pra `.env` local, ou use `vercel env pull`) |
| `public/index.html` | Landing: hero, sobre as duas candidatas, trajetória, como funciona, cadastro, ranking |
| `public/obrigado.html` | Página pós-cadastro — link de indicação pessoal + compartilhar no WhatsApp |
| `public/politica-privacidade.html` | Política de privacidade LGPD |
| `ARQUITETURA.md` | Como o backend funciona por dentro |
| `schema-cadastro-indicacao.md` | Formato dos dados de cada cadastro |
| `PRIMEIROS-PASSOS.md` | Passo a passo completo pra colocar no ar (GitHub + Vercel + banco) |

## Como funciona (visão geral)

1. Apoiador se cadastra em `public/index.html` (ou chega via `?ref=CODIGO` de outro apoiador).
2. O formulário envia os dados pra `POST /api/cadastro`, que gera um `codigo_indicacao` único, grava no banco e devolve `{ codigo, link }` na mesma resposta.
3. O site redireciona pra `obrigado.html`, mostrando o link pessoal do apoiador pra ele compartilhar.
4. `GET /api/ranking` e `GET /api/stats` consultam o banco a cada chamada — sempre atualizados.

## Variáveis de ambiente

| Variável | Obrigatória? | Pra que serve |
|---|---|---|
| `DATABASE_URL` | Sim | String de conexão com o banco — injetada automaticamente pelo Vercel quando o banco está linkado ao projeto |
| `ADMIN_TOKEN` | Não | Libera `/api/export.csv`. Sem ela, a exportação fica desativada |
| `PORT` | Não | Só usada localmente (padrão 3010). O Vercel define a porta sozinho |

## Checklist antes de publicar pra valer

1. ~~**Conteúdo**~~ — já preenchido: nomes, cargos, bios e trajetória das duas candidatas, contatos (WhatsApp, e-mail, Instagram/site oficial).
2. **Cores** — ajuste as variáveis CSS em `:root` (mesmo bloco nos 3 arquivos HTML): `--tinta`, `--acento`, `--verde`.
3. **Banco** — conecte o Neon pelo painel do Vercel (Storage → Browse Storage) e rode `schema.sql`.
4. **`ADMIN_TOKEN`** — defina um valor forte no projeto do Vercel antes de publicar.
5. **Jurídico** — revise `public/politica-privacidade.html` com quem cuida disso nas duas campanhas (há um aviso destacado sobre definir o "controlador" dos dados).

## Limitações conhecidas

Documentadas em detalhe em `ARQUITETURA.md`.
