# Primeiros passos — colocando o site no ar (Vercel + Supabase)

O código já está pronto e commitado localmente. Faltam 3 contas: **Supabase** (banco), **GitHub** (onde o código fica hospedado) e **Vercel** (onde o site roda). Nessa ordem.

---

## Etapa 1 — Supabase (banco de dados)

1. Acesse [supabase.com](https://supabase.com) e entre (ou crie conta).
2. **New Project** → dê um nome (ex: "rede-de-apoio") → escolha uma senha de banco (guarde, mas não vai precisar dela diretamente) → escolha a região mais próxima (ex: São Paulo/`sa-east-1`, se disponível) → **Create new project**. Leva 1-2 minutos pra provisionar.
3. No menu lateral, vá em **SQL Editor → New query**.
4. Abra o arquivo `supabase-schema.sql` (nesta pasta), copie todo o conteúdo, cole no editor e clique **Run**. Isso cria a tabela `cadastros`.
5. Vá em **Project Settings → API**. Você vai precisar de dois valores:
   - **Project URL** (algo como `https://xxxxx.supabase.co`)
   - **service_role key** (na seção "Project API keys" — é a chave **secreta**, não a `anon public`. Clique em "Reveal" pra ver)

⚠️ **A `service_role key` dá acesso total ao banco, ignorando qualquer proteção.** Trate como uma senha — nunca cole ela em código que vai pro navegador, só em variáveis de ambiente do servidor (é exatamente o que vamos fazer na Etapa 3).

✅ **Termina esta etapa com:** Project URL + service_role key guardados.

---

## Etapa 2 — GitHub (onde o código mora)

1. Acesse [github.com/new](https://github.com/new).
2. Nome do repositório: algo como `rede-de-apoio-gabriela-dani`.
3. Marque **Private** (os dados de campanha e a estrutura do sistema não devem ficar públicos).
4. **Não** marque "Add a README" (o projeto já tem um) — deixe o repositório vazio.
5. Clique **Create repository**. O GitHub mostra uma URL tipo `https://github.com/SEU-USUARIO/rede-de-apoio-gabriela-dani.git` — copie ela.
6. No terminal, dentro da pasta do projeto:
   ```bash
   git remote add origin https://github.com/SEU-USUARIO/rede-de-apoio-gabriela-dani.git
   git push -u origin main
   ```
   (troque a URL pela que o GitHub te deu — se aparecer uma janela do navegador pedindo login, é o Git pedindo sua autorização, normal)

✅ **Termina esta etapa com:** o código no GitHub, no repositório privado.

---

## Etapa 3 — Vercel (hospedagem)

1. Acesse [vercel.com](https://vercel.com) e entre **com a mesma conta do GitHub** (facilita a conexão).
2. **Add New → Project**.
3. Encontre o repositório `rede-de-apoio-gabriela-dani` na lista (autorize o Vercel a acessar seus repositórios do GitHub, se pedir) → **Import**.
4. Antes de clicar em Deploy, abra **Environment Variables** e adicione, uma por uma:
   - `SUPABASE_URL` → a Project URL da Etapa 1
   - `SUPABASE_SERVICE_KEY` → a service_role key da Etapa 1
   - `ADMIN_TOKEN` → uma senha forte, inventada por você (ex: gere uma em [1password.com/password-generator](https://1password.com/password-generator))
5. Clique **Deploy**. Leva menos de um minuto.
6. Quando terminar, o Vercel mostra a URL do site (algo como `https://rede-de-apoio-gabriela-dani.vercel.app`) — clique e confira se abre.

✅ **Pronto — o site está no ar, com banco de dados real.**

---

## Etapa 4 — Testar de ponta a ponta

1. Abra o site publicado, preencha o formulário de cadastro com um teste seu.
2. Confirme que aparece a página de agradecimento com um link de indicação.
3. Volte no Supabase → **Table Editor → cadastros** e confirme que a linha apareceu lá.
4. Acesse `https://SEU-SITE.vercel.app/?ref=CODIGO-DO-TESTE` (o código que apareceu na Etapa 4.2) e cadastre uma segunda pessoa de teste — confirme que o ranking no site mostra 1 indicação pro primeiro cadastro.
5. Depois de confirmar que tudo funciona, **apague as linhas de teste** direto no Table Editor do Supabase (clique na linha → excluir), pra não sujar as estatísticas reais.

---

## Etapa 5 — Domínio próprio (opcional)

Se você comprar um domínio (ex: `redeapoiorj.com.br`), no projeto do Vercel vá em **Settings → Domains** e adicione o domínio — o Vercel te dá os registros DNS pra configurar onde você comprou o domínio.

---

## Etapa 6 — Revisão jurídica (não pule)

Antes de divulgar o link pra valer, mande `public/politica-privacidade.html` pra quem cuida do jurídico/compliance das duas campanhas. Ela tem um aviso destacado sobre um ponto que precisa de decisão formal: qual comitê financeiro é o responsável legal pelos dados desta rede de apoio compartilhada.

---

## Se algo der errado

- **Deploy falha no Vercel**: clique no deploy que falhou → "View Build Logs" — geralmente é uma variável de ambiente faltando ou digitada errada.
- **Site abre mas cadastro dá erro 503**: confira `SUPABASE_URL`/`SUPABASE_SERVICE_KEY` no Vercel (Settings → Environment Variables) — erro de digitação é a causa mais comum.
- **Ranking não aparece**: confira se a tabela `cadastros` foi criada mesmo (Supabase → Table Editor) — se `supabase-schema.sql` não rodou, os endpoints falham.
- **`git push` pede login toda hora**: normal na primeira vez; o Windows guarda a credencial depois (Git Credential Manager) — não digite sua senha do GitHub diretamente, sempre pela janela do navegador que abre.
- Qualquer erro específico, me manda a mensagem exata (print ou texto) que apareceu — dá pra debugar junto.
