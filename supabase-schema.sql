-- Rede de Apoio — schema da tabela de cadastros no Supabase.
-- Rode isto uma vez no SQL Editor do painel do Supabase (Project → SQL Editor → New query).

create table if not exists cadastros (
  id bigint generated always as identity primary key,
  nome text not null,
  whatsapp text not null,
  cidade text not null,
  bairro text not null,
  aniversario date,
  sexo text,
  campanha text not null default 'geral',
  origem text not null default 'site',
  subcanal text not null default 'form_home',
  data_captura timestamptz not null default now(),
  codigo_indicacao text not null unique,
  indicado_por text references cadastros (codigo_indicacao)
);

create index if not exists idx_cadastros_indicado_por on cadastros (indicado_por);
create index if not exists idx_cadastros_codigo on cadastros (codigo_indicacao);

-- Row Level Security ligado, sem nenhuma policy de leitura/escrita pra chaves públicas (anon).
-- Só a service_role key (usada pelo backend, nunca pelo navegador) consegue ler ou gravar aqui.
-- Isso impede que alguém use a chave pública do Supabase pra baixar a lista de WhatsApps direto do navegador.
alter table cadastros enable row level security;
