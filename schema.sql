-- Rede de Apoio — schema da tabela de cadastros no Vercel Postgres.
-- Rode isto uma vez na aba "Query" do banco, dentro do painel do Vercel (Storage → seu banco → Query),
-- ou via qualquer cliente Postgres conectado usando a POSTGRES_URL.

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
