# Arquitetura — Rede de Apoio (Vercel + Supabase)

```
Navegador (public/index.html, obrigado.html, politica-privacidade.html)
        │
        │ POST /api/cadastro   → gera código de indicação, salva no Supabase, responde na hora
        │ GET  /api/ranking    → top 10 de quem mais indicou
        │ GET  /api/stats      → total de apoiadores e de cidades
        │
        ▼
api/index.js  →  server.js (Express)
        │
        ▼
   db.js (@supabase/supabase-js, service_role key)
        │
        ▼
  Supabase (Postgres) — tabela "cadastros"
```

## Por que Supabase em vez de arquivo local

O sistema já rodou com armazenamento em arquivo JSON local — funcionava bem rodando com `npm start` numa máquina/servidor fixo. Mas o Vercel roda o backend como **função serverless**: sem disco persistente, sem garantia de que duas requisições caiam na mesma instância. Um arquivo local nesse ambiente se comporta como memória temporária — pode sumir a qualquer redeploy ou nem persistir entre duas chamadas seguidas. Por isso o armazenamento foi migrado pro Supabase (Postgres gerenciado), que é compartilhado entre todas as instâncias da função.

## server.js roda em dois lugares diferentes

- **Local** (`npm start`): `server.js` chama `app.listen(...)` diretamente e sobe um servidor de verdade na porta 3010.
- **Vercel**: `api/index.js` só faz `module.exports = require('../server.js')` — o Vercel importa esse módulo e chama o app Express a cada requisição, sem `app.listen`. O `vercel.json` redireciona **toda** rota (`/`, `/obrigado.html`, `/api/*` etc.) pra essa mesma função, que internamente decide se serve um arquivo estático (`express.static`) ou processa uma chamada de API — exatamente a mesma lógica nos dois ambientes.

## Endpoints da API

| Endpoint | Método | O que faz |
|---|---|---|
| `/api/cadastro` | POST | Valida campos obrigatórios, gera `codigo_indicacao` único, grava no Supabase, devolve `{ codigo, link }` |
| `/api/ranking` | GET | Calcula o top 10 de apoiadores por número de indicações, direto do banco |
| `/api/stats` | GET | Retorna `{ total_apoiadores, total_cidades }` |
| `/api/export.csv?token=SEU_TOKEN` | GET | Exporta todos os cadastros em CSV — **protegido por `ADMIN_TOKEN`**, uso interno da campanha |

## Como o código de indicação é gerado

`slugify(nome) + "-" + 4 caracteres aleatórios` (ex: `joao-silva-4f2a`). Antes de gravar, o backend consulta o Supabase pra garantir que esse código ainda não existe (repete a geração até 5 vezes em caso de colisão — extremamente raro).

## Como o ranking é calculado

Não existe uma coluna "total de indicações" salva. `/api/ranking` busca todos os registros (`nome`, `cidade`, `codigo_indicacao`, `indicado_por`), conta em memória quantos têm `indicado_por` igual a cada código, ordena e devolve os 10 primeiros. Pro volume esperado de uma campanha regional, isso é rápido o bastante sem precisar de uma função SQL dedicada.

## Segurança dos dados

- A tabela `cadastros` tem **Row Level Security ligado, sem nenhuma policy** — ou seja, só quem tem a `service_role key` (o próprio backend) consegue ler ou escrever. A chave pública do Supabase (`anon key`) **nunca é usada aqui e nunca deve ir pro frontend**.
- `/api/export.csv` só funciona com o `ADMIN_TOKEN` correto — sem essa variável configurada, o endpoint fica bloqueado.
- `indicado_por` só é aceito se corresponder a um `codigo_indicacao` que já existe no banco — não dá pra inflar o ranking com códigos inventados.
- Rate limit de 5 cadastros/minuto por IP (proteção básica contra spam — em serverless isso é por instância, não é um limite global rígido; para tráfego grande valeria um serviço dedicado de rate limiting).

## Limitações conhecidas (honestas)

- **Rate limit não é global**: cada instância serverless tem sua própria memória, então o limite de 5/min é "por instância", não "por IP no mundo todo". Suficiente contra bots simples, não contra um ataque coordenado.
- **Sem função SQL dedicada pro ranking**: busca todos os registros e agrega em JavaScript. Funciona bem até algumas dezenas de milhares de linhas; se a campanha crescer muito além disso, vale migrar o cálculo pra uma view/RPC do Postgres.
- **Backup**: o Supabase free tier faz backup automático por um período limitado — para retenção mais longa ou point-in-time recovery, é preciso um plano pago. Enquanto isso, `/api/export.csv` serve como backup manual.
