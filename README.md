# Rede de Apoio — Dra. Gabriela & Dani Cunha

Sistema completo (site + backend próprio) de "rede de apoio" para a campanha conjunta de **Dra. Gabriela** (candidata a Deputada Estadual, RJ) e **Dani Cunha** (Deputada Federal, RJ, candidata à reeleição): cadastro de apoiadores, link de indicação pessoal e ranking público de quem mais indica.

Não depende de Make.com nem Google Sheets — é um servidor Node.js que serve o site e guarda os dados sozinho.

## Rodando localmente

```bash
npm install
npm start
```

Depois acesse **http://localhost:3010** no navegador (porta 3010 porque a 3000 já está em uso por outro projeto nesta máquina — ajustável via variável de ambiente `PORT`). Pronto — cadastro, ranking e estatísticas já funcionam de verdade, sem nenhuma configuração extra.

## Arquivos

| Arquivo/pasta | O que é |
|---|---|
| `server.js` | Backend (Express): serve o site e a API de cadastro/ranking/estatísticas |
| `package.json` | Dependências do projeto (só o Express) |
| `public/index.html` | Landing principal: hero, sobre as duas candidatas, trajetória, como funciona, cadastro, ranking |
| `public/obrigado.html` | Página pós-cadastro — link de indicação pessoal + compartilhar no WhatsApp |
| `public/politica-privacidade.html` | Política de privacidade LGPD |
| `data/cadastros.json` | Onde os cadastros ficam guardados (criado sozinho na primeira execução — **não é versionado no git**) |
| `ARQUITETURA.md` | Como o backend funciona por dentro (endpoints, geração de código, ranking, limitações) |
| `schema-cadastro-indicacao.md` | Formato dos dados de cada cadastro |
| `PRIMEIROS-PASSOS.md` | Passo a passo pra colocar o site no ar, sem economês |

## Como funciona (visão geral)

1. Apoiador se cadastra em `public/index.html` (ou chega via `?ref=CODIGO` de outro apoiador).
2. O formulário envia os dados pra `POST /api/cadastro`, que gera um `codigo_indicacao` único, salva o registro e devolve `{ codigo, link }` na mesma resposta.
3. O site redireciona pra `obrigado.html`, mostrando o link pessoal do apoiador pra ele compartilhar.
4. `GET /api/ranking` e `GET /api/stats` calculam o ranking e os números do hero direto do arquivo de dados, a cada chamada — sempre atualizados, sem planilha nem cache manual.

## Variáveis de ambiente (opcionais)

| Variável | Padrão | Pra que serve |
|---|---|---|
| `PORT` | `3010` | Porta em que o servidor escuta (3000 está reservada pro EVE OS nesta máquina) |
| `ADMIN_TOKEN` | (vazio) | Token pra liberar `/api/export.csv` (exportação dos cadastros). Sem definir, o endpoint fica desativado |

Exemplo (Linux/Mac): `PORT=8080 ADMIN_TOKEN=algo-bem-dificil-de-adivinhar npm start`

## Checklist antes de publicar pra valer

1. ~~**Conteúdo**~~ — já preenchido: nomes, cargos, bios e trajetória das duas candidatas, contatos (WhatsApp, e-mail, Instagram/site oficial).
2. **Cores** — ajuste as variáveis CSS em `:root` (mesmo bloco nos 3 arquivos HTML): `--tinta`, `--acento`, `--verde`.
3. **`ADMIN_TOKEN`** — defina um valor forte antes de publicar, se quiser poder exportar os cadastros em CSV depois.
4. **Hospedagem** — siga `PRIMEIROS-PASSOS.md` (recomendo um serviço com disco persistente, já que os dados ficam num arquivo local).
5. **Backup** — sem banco de dados gerenciado, vale baixar `/api/export.csv` periodicamente e guardar uma cópia à parte.
6. **Jurídico** — revise `public/politica-privacidade.html` com quem cuida disso nas duas campanhas antes de publicar (há um aviso destacado no próprio texto sobre definir o "controlador" dos dados).

## Limitações conhecidas

Documentadas em detalhe em `ARQUITETURA.md` — resumindo: armazenamento em arquivo (não banco gerenciado), um único processo/servidor, sem backup automático. Adequado pro volume de uma campanha regional; se crescer muito além disso, vale migrar pra um banco de dados de verdade.
