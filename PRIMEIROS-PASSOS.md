# Primeiros passos — colocando o site no ar

Boa notícia: como o sistema agora tem backend próprio, sumiram as etapas de Google Sheets e Make.com. Sobrou muito menos coisa pra fazer.

---

## Etapa 1 — Rodar no seu computador (pra testar)

1. Instale o [Node.js](https://nodejs.org) (versão 18 ou mais recente) — baixe o instalador "LTS" e siga o padrão.
2. Abra o Prompt de Comando (ou PowerShell) dentro da pasta do projeto.
3. Rode:
   ```
   npm install
   npm start
   ```
4. Abra o navegador em **http://localhost:3010** (usamos a porta 3010 porque a 3000 já está ocupada por outro projeto seu, o EVE OS). O site já funciona por completo: cadastro, link de indicação, ranking e os números do hero.

✅ **Se isso funcionou, o sistema está pronto.** As próximas etapas são só sobre colocá-lo num endereço público, pra qualquer pessoa acessar.

---

## Etapa 2 — Colocar o site no ar (hospedagem)

Como agora existe um servidor de verdade rodando (não é só HTML estático), a hospedagem precisa **rodar Node.js** e, de preferência, ter **disco persistente** (pra não perder os cadastros a cada atualização). Duas opções boas e simples:

### Opção A — Railway (recomendado, tem plano gratuito com créditos)

1. Crie conta em [railway.app](https://railway.app) (dá pra entrar com GitHub).
2. **New Project → Deploy from GitHub repo** (ou **Empty Project** e depois conectar) — você vai precisar subir esta pasta pro GitHub primeiro (veja Etapa 3 abaixo se nunca fez isso).
3. O Railway detecta que é um projeto Node e roda `npm install` + `npm start` sozinho.
4. Em **Settings → Variables**, adicione `ADMIN_TOKEN` com um valor forte (ex: uma senha longa e aleatória).
5. Em **Settings → Volumes**, adicione um volume persistente apontando pra pasta `/app/data` — isso garante que os cadastros não somem quando você atualizar o código depois.
6. O Railway te dá uma URL pública (`https://algo.up.railway.app`) — o site já está no ar.

### Opção B — Render

1. Crie conta em [render.com](https://render.com).
2. **New → Web Service**, conecte o repositório do GitHub.
3. Build command: `npm install` — Start command: `npm start`.
4. Em **Environment**, adicione `ADMIN_TOKEN`.
5. Em **Disks**, adicione um disco persistente montado em `/opt/render/project/src/data` (o plano gratuito do Render tem disco limitado/pode não incluir; se não tiver essa opção no seu plano, veja o aviso abaixo).

> **Sobre perder dados:** hospedagem sem disco persistente apaga a pasta `data/` a cada novo deploy. Enquanto isso não estiver resolvido, baixe os cadastros regularmente em `https://SEU-SITE/api/export.csv?token=SEU_ADMIN_TOKEN` e guarde uma cópia.

---

## Etapa 3 — Subir o projeto pro GitHub (se ainda não fez)

A maioria das hospedagens pede que o código esteja no GitHub.

1. Crie uma conta em [github.com](https://github.com) se ainda não tiver.
2. Crie um repositório novo (botão **New**), marque como **privado** (os dados de campanha não devem ficar públicos).
3. No Prompt de Comando, dentro da pasta do projeto:
   ```
   git init
   git add .
   git commit -m "Rede de apoio - primeira versão"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
   git push -u origin main
   ```
   (o `.gitignore` já garante que `node_modules/` e `data/` — que tem dados pessoais — não sobem pro GitHub)

---

## Etapa 4 — Domínio próprio (opcional)

Se você comprar um domínio (ex: `redeapoiorj.com.br`), tanto Railway quanto Render têm uma tela de **Custom Domain** onde você aponta o domínio pro serviço. Sem isso, o endereço gerado automaticamente (`.railway.app` / `.onrender.com`) já funciona normalmente.

---

## Etapa 5 — Revisão jurídica (não pule)

Antes de divulgar o link pra valer, mande `public/politica-privacidade.html` pra quem cuida do jurídico/compliance das duas campanhas. Ela já tem um aviso destacado no texto sobre um ponto que precisa de decisão formal: qual comitê financeiro é o responsável legal pelos dados desta rede de apoio compartilhada.

---

## Se algo der errado

- **`npm install` dá erro**: confirme que instalou o Node.js (rode `node --version` no terminal — se não reconhecer o comando, reinstale).
- **O site abre mas o cadastro não funciona**: abra o Console do navegador (F12) e veja se aparece algum erro — geralmente é o servidor não estar rodando, ou a porta errada.
- **Depois de hospedar, os cadastros somem a cada atualização**: falta configurar o disco persistente (Etapa 2) — sem isso, é esperado que o arquivo `data/cadastros.json` resete a cada deploy.
- **Esqueci o `ADMIN_TOKEN` e preciso exportar os dados**: acesse a hospedagem (Railway/Render) e confira o valor em "Environment Variables" — se não configurou nenhum, a exportação está desativada por segurança.
- Qualquer erro específico, me chame com a mensagem exata que apareceu — dá pra debugar junto.
