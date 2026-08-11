# Primeiros passos — colocando o site no ar (Vercel + Vercel Postgres)

O código já está pronto e commitado localmente. Faltam 2 contas: **GitHub** (onde o código fica hospedado) e **Vercel** (onde o site *e* o banco de dados rodam — os dois no mesmo painel, sem precisar de um terceiro serviço).

---

## Etapa 1 — GitHub (onde o código mora)

1. Acesse [github.com/new](https://github.com/new).
2. Nome do repositório: algo como `rede-de-apoio-gabriela-dani`.
3. Marque **Private** (os dados de campanha e a estrutura do sistema não devem ficar públicos).
4. **Não** marque "Add a README" — deixe o repositório vazio.
5. Clique **Create repository**. Copie a URL que aparece (`https://github.com/SEU-USUARIO/rede-de-apoio-gabriela-dani.git`).
6. No terminal, dentro da pasta do projeto:
   ```bash
   git remote add origin https://github.com/SEU-USUARIO/rede-de-apoio-gabriela-dani.git
   git push -u origin main
   ```
   (troque a URL pela que o GitHub te deu — se aparecer uma janela do navegador pedindo login, é normal)

✅ **Termina com:** o código no GitHub, no repositório privado.

---

## Etapa 2 — Vercel (site + banco, tudo no mesmo lugar)

1. Acesse [vercel.com](https://vercel.com) e entre **com a mesma conta do GitHub**.
2. **Add New → Project**.
3. Encontre `rede-de-apoio-gabriela-dani` na lista (autorize o Vercel a acessar seus repositórios, se pedir) → **Import**.
4. Pode clicar **Deploy** direto — ainda não tem banco, então o site vai subir mas o cadastro/ranking vão dar erro por enquanto. Isso é esperado, é só pra criar o projeto; resolvemos no próximo passo.

### Criando o banco

5. Dentro do projeto que acabou de criar, vá na aba **Storage** (menu superior).
6. **Create Database → Postgres** → dê um nome (ex: `rede-de-apoio-db`) → escolha a região mais próxima → **Create**.
7. Na tela seguinte, confirme a opção de **conectar esse banco ao projeto** (normalmente já vem marcada) — isso injeta a variável `POSTGRES_URL` automaticamente nas Environment Variables do projeto, sem você precisar copiar/colar nada.
8. Ainda na aba do banco, procure a sub-aba **Query** (ou "SQL Editor", dependendo da versão da interface).
9. Abra o arquivo `schema.sql` (nesta pasta), copie todo o conteúdo, cole ali e execute. Isso cria a tabela `cadastros`.

### Configurando o ADMIN_TOKEN

10. Vá em **Settings → Environment Variables** do projeto.
11. Adicione `ADMIN_TOKEN` com uma senha forte inventada por você (ex: gere uma em [1password.com/password-generator](https://1password.com/password-generator)).

### Redeploy

12. Vá na aba **Deployments**, clique nos "..." do deploy mais recente → **Redeploy** (precisa disso pra pegar as variáveis de ambiente que acabaram de ser criadas).
13. Quando terminar, clique na URL do projeto (algo como `https://rede-de-apoio-gabriela-dani.vercel.app`) e confira se abre.

✅ **Pronto — o site está no ar, com banco de dados real, tudo dentro de uma única conta.**

---

## Etapa 3 — Testar de ponta a ponta

1. Abra o site publicado, preencha o formulário de cadastro com um teste seu.
2. Confirme que aparece a página de agradecimento com um link de indicação.
3. No Vercel, volte em **Storage → seu banco → Data** (ou Query, rodando `select * from cadastros;`) e confirme que a linha apareceu.
4. Acesse `https://SEU-SITE.vercel.app/?ref=CODIGO-DO-TESTE` (o código que apareceu no passo 2) e cadastre uma segunda pessoa de teste — confirme que o ranking no site mostra 1 indicação pro primeiro cadastro.
5. Depois de confirmar que tudo funciona, **apague as linhas de teste** (rodando `delete from cadastros where whatsapp = 'SEU-NUMERO-DE-TESTE';` na aba Query), pra não sujar as estatísticas reais.

---

## Etapa 4 — Rodar localmente depois disso (opcional)

Se quiser testar mudanças no seu computador antes de publicar:
```bash
npx vercel link          # conecta esta pasta ao projeto que você acabou de criar
npx vercel env pull .env # baixa POSTGRES_URL real pro arquivo .env
```
Depois adicione manualmente uma linha `ADMIN_TOKEN=` nesse `.env` (essa variável não é baixada automaticamente por segurança — é a mesma senha que você definiu no passo 11) e rode `npm start` normalmente.

---

## Etapa 5 — Domínio próprio (opcional)

Se você comprar um domínio (ex: `redeapoiorj.com.br`), no projeto do Vercel vá em **Settings → Domains** e adicione o domínio — o Vercel te dá os registros DNS pra configurar onde você comprou o domínio.

---

## Etapa 6 — Revisão jurídica (não pule)

Antes de divulgar o link pra valer, mande `public/politica-privacidade.html` pra quem cuida do jurídico/compliance das duas campanhas. Ela tem um aviso destacado sobre um ponto que precisa de decisão formal: qual comitê financeiro é o responsável legal pelos dados desta rede de apoio compartilhada.

---

## Se algo der errado

- **Deploy falha no Vercel**: clique no deploy que falhou → "View Build Logs" — geralmente é uma variável de ambiente faltando.
- **Site abre mas cadastro dá erro 503**: o banco provavelmente ainda não foi criado/conectado, ou falta fazer o Redeploy depois de criar o banco (Etapa 2, passos 5-12).
- **Ranking não aparece**: confira se `schema.sql` foi executado mesmo (Storage → seu banco → Query → rode `select * from cadastros;` pra ver se a tabela existe).
- **`git push` pede login toda hora**: normal na primeira vez; o Windows guarda a credencial depois (Git Credential Manager) — não digite sua senha do GitHub diretamente, sempre pela janela do navegador que abre.
- Qualquer erro específico, me manda a mensagem exata (print ou texto) que apareceu — dá pra debugar junto.
