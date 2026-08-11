# Schema de Cadastro e Indicação — Rede de Apoio (template)

Objetivo: todo cadastro que entra pela rede de apoio carrega os mesmos campos-base — venha do formulário do site, de um link de indicação compartilhado por outro apoiador, ou de captação presencial (evento/comício). Isso permite montar o ranking de indicações e o funil de mensagens sem retrabalho depois.

## Campos-base (presentes em todo cadastro, qualquer origem)

| Campo | Tipo | Exemplo | Observação |
|---|---|---|---|
| `campanha` | string fixa | `"gabriela-dani-2026"` | Isola os cadastros desta campanha caso o mesmo sistema atenda mais de uma |
| `origem` | enum | `"site"`, `"indicacao"`, `"presencial"`, `"trafego_pago"`, `"organico_social"` | Canal de entrada |
| `subcanal` | string | ver por origem abaixo | Detalha a `origem` |
| `data_captura` | timestamp ISO 8601 | `2026-07-28T14:32:00-03:00` | Sempre no fuso da campanha |
| `nome` | string | — | Nome completo |
| `whatsapp` | string | `"5522999999999"` | Chave primária de deduplicação |
| `cidade` | string | — | — |
| `bairro` | string | — | — |
| `aniversario` | date (opcional) | `"1990-04-12"` | Coleta opcional, ver política de privacidade |
| `sexo` | enum (opcional) | `"F"` \| `"M"` \| `"outro"` \| `"prefiro_nao_informar"` | Coleta opcional |
| `codigo_indicacao` | string, gerado no cadastro | `"joao-silva-4f2a"` | Código próprio deste apoiador — usado no link que ele compartilha depois |
| `indicado_por` | string, nullable | `"maria-souza-9c1b"` | `codigo_indicacao` de quem indicou. Vazio quando o cadastro chegou direto (sem link de indicação) |
| `total_indicacoes` | número, calculado | `12` | Não é salvo em lugar nenhum — o endpoint `/api/ranking` conta na hora quantos registros têm `indicado_por` igual a este `codigo_indicacao` (ver `ARQUITETURA.md`) |

## Campos específicos por origem

### 1. Site — formulário de cadastro direto
```
origem: "site"
subcanal: "form_home"
indicado_por: null
```

### 2. Link de indicação (alguém chegou via `?ref=CODIGO` de outro apoiador)
```
origem: "indicacao"
subcanal: "link_compartilhado"
indicado_por: "[codigo_indicacao de quem indicou]"
```
> O `ref` da URL é capturado no carregamento da página e vai junto no payload enviado para `/api/cadastro` — ver captura de `ref` em `public/index.html`.

### 3. Presencial (captação em evento, comício, ponto de rua)
```
origem: "presencial"
subcanal: "captacao_evento" | "captacao_rua"
indicado_por: preenchido manualmente se a pessoa citar quem a levou; senão null
```
> Se usar tablet/formulário físico no evento, o ideal é que rode o mesmo formulário do site — garante que os campos batem 1:1 com os digitais.

### 4. Tráfego pago / social orgânico
```
origem: "trafego_pago" | "organico_social"
subcanal: nome da campanha ou post (ex: "ig_reels_julho_seguranca")
indicado_por: null (a menos que o próprio anúncio carregue um `ref` — caso de campanha de indicação paga)
```

## Fluxo real (backend próprio, `server.js`)

1. O formulário do site envia o payload acima (com ou sem `indicado_por`) para `POST /api/cadastro`.
2. O servidor gera o `codigo_indicacao` deste novo apoiador (slug do nome + sufixo aleatório, checando que não colide com nenhum existente) e grava o registro em `data/cadastros.json`.
3. O servidor **responde na mesma requisição** com `{ codigo, link }`, e o site redireciona o apoiador pra página de agradecimento com o link dele — ver `ARQUITETURA.md`.
4. `total_indicacoes` **não é salvo** — `GET /api/ranking` conta, a cada chamada, quantos registros têm `indicado_por` igual ao `codigo_indicacao` de cada apoiador. Isso evita qualquer problema de concorrência entre cadastros simultâneos.

## Pergunta em aberto pro jurídico da campanha

`aniversario` e `sexo` são campos opcionais no formulário — vale confirmar se o texto de consentimento precisa deixar explícito que esses dois são opcionais e que o cadastro funciona sem eles (a política de privacidade já assume isso, mas o formulário deve refletir visualmente).
