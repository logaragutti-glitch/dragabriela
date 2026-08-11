# Arquitetura — Rede de Apoio (backend próprio)

Este sistema **não depende de Make.com nem Google Sheets**. É um site + API rodando no mesmo servidor Node.js, com os dados guardados em arquivo local (`data/cadastros.json`).

## Visão geral

```
Navegador (public/index.html)
        │
        │ POST /api/cadastro   → gera código de indicação, salva o registro, responde na hora
        │ GET  /api/ranking    → top 10 de quem mais indicou
        │ GET  /api/stats      → total de apoiadores e de cidades
        │
        ▼
   server.js (Express)
        │
        ▼
  data/cadastros.json   (todos os registros, em texto simples)
```

## Por que arquivo JSON em vez de um banco de dados "de verdade"?

Pro volume de uma rede de apoio de campanha (milhares de cadastros, não milhões), um arquivo JSON com escrita serializada é suficiente e não exige instalar/administrar um banco separado. Se o volume crescer muito (dezenas de milhares de cadastros) ou for preciso mais de um servidor rodando ao mesmo tempo, aí sim vale migrar pra um banco (Postgres/SQLite) — não antes disso.

## Endpoints da API

| Endpoint | Método | O que faz |
|---|---|---|
| `/api/cadastro` | POST | Recebe o formulário, valida campos obrigatórios, gera `codigo_indicacao` único, grava o registro, devolve `{ codigo, link }` |
| `/api/ranking` | GET | Calcula (na hora, a partir do arquivo) o top 10 de apoiadores por número de indicações |
| `/api/stats` | GET | Retorna `{ total_apoiadores, total_cidades }` |
| `/api/export.csv?token=SEU_TOKEN` | GET | Exporta todos os cadastros em CSV — **protegido por `ADMIN_TOKEN`**, uso interno da campanha |

## Como o código de indicação é gerado

`slugify(nome) + "-" + 4 caracteres aleatórios` (ex: `joao-silva-4f2a`), verificando que o código não colide com nenhum já existente antes de salvar.

## Como o ranking é calculado

Não existe uma coluna "total de indicações" salva — o `/api/ranking` conta, a cada chamada, quantos registros têm `indicado_por` igual a cada `codigo_indicacao`, ordena do maior pro menor e devolve os 10 primeiros. Isso evita qualquer inconsistência entre um contador salvo e a realidade.

## Proteções já implementadas

- **Rate limit**: no máximo 5 cadastros por minuto por IP (evita spam/bot básico).
- **Validação de campos**: nome, WhatsApp, cidade e bairro são obrigatórios; strings são limitadas em tamanho.
- **Fila de escrita**: cadastros simultâneos não corrompem o arquivo — são gravados um de cada vez, na ordem de chegada.
- **`indicado_por` validado**: só é aceito se corresponder a um `codigo_indicacao` que já existe na base — não dá pra inflar o ranking com códigos inventados.
- **Exportação de dados protegida por token**: sem `ADMIN_TOKEN` configurado no ambiente, `/api/export.csv` fica desativado. Nunca publique esse token.

## Limitações conhecidas (honestas, pra você decidir se aceita ou resolve)

- **Backup**: o arquivo `data/cadastros.json` não tem backup automático. Se o servidor perder o disco (comum em alguns planos gratuitos de hospedagem, que resetam o sistema de arquivos a cada novo deploy), os dados somem. Baixe `/api/export.csv` periodicamente e guarde uma cópia, ou hospede num lugar com disco persistente (ver `PRIMEIROS-PASSOS.md`).
- **Um servidor só**: não há replicação — se o processo cair, o site fica fora do ar até reiniciar. Pra uma campanha de porte regional, isso costuma ser aceitável; pra escala nacional, valeria migrar pra um banco de dados gerenciado com múltiplas réplicas.
- **`total_indicacoes` é recalculado a cada request**: com um arquivo muito grande (dezenas de milhares de linhas), isso pode ficar perceptivelmente lento. Não é um problema no volume esperado de uma campanha regional.
