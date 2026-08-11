// Camada de dados — Neon (Postgres serverless), conectado via a integração "Neon" do Marketplace do Vercel.
// Necessário porque o Vercel roda funções serverless sem disco persistente — um arquivo local não sobrevive.
const { neon } = require('@neondatabase/serverless');

// A integração Neon do Vercel injeta DATABASE_URL. Se um dia trocar pro produto nativo
// "Vercel Postgres" (que usa POSTGRES_URL), este fallback continua funcionando sem mudar código.
const CONNECTION_STRING = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!CONNECTION_STRING) {
  console.warn(
    'Aviso: DATABASE_URL (ou POSTGRES_URL) não configurado — ' +
    'o backend não vai conseguir ler nem salvar cadastros até isso ser definido (ver PRIMEIROS-PASSOS.md).'
  );
}

const sql = CONNECTION_STRING ? neon(CONNECTION_STRING) : null;

function erroBancoNaoConfigurado() {
  const erro = new Error('Banco de dados não configurado (defina DATABASE_URL nas variáveis de ambiente).');
  erro.codigo = 'BANCO_NAO_CONFIGURADO';
  return erro;
}

function exigirBanco() {
  if (!sql) throw erroBancoNaoConfigurado();
  return sql;
}

async function codigoJaExiste(codigo) {
  const query = exigirBanco();
  const linhas = await query`select 1 from cadastros where codigo_indicacao = ${codigo} limit 1`;
  return linhas.length > 0;
}

async function indicadoPorValido(codigo) {
  if (!codigo) return null;
  const query = exigirBanco();
  const linhas = await query`select 1 from cadastros where codigo_indicacao = ${codigo} limit 1`;
  return linhas.length > 0 ? codigo : null;
}

async function inserirCadastro(registro) {
  const query = exigirBanco();
  const linhas = await query`
    insert into cadastros
      (nome, whatsapp, cidade, bairro, aniversario, sexo, campanha, origem, subcanal, codigo_indicacao, indicado_por)
    values
      (${registro.nome}, ${registro.whatsapp}, ${registro.cidade}, ${registro.bairro}, ${registro.aniversario},
       ${registro.sexo}, ${registro.campanha}, ${registro.origem}, ${registro.subcanal},
       ${registro.codigo_indicacao}, ${registro.indicado_por})
    returning *
  `;
  return linhas[0];
}

async function calcularRanking(limite = 10) {
  const query = exigirBanco();
  return query`
    select a.nome, a.cidade, count(b.indicado_por)::int as indicacoes
    from cadastros a
    join cadastros b on b.indicado_por = a.codigo_indicacao
    group by a.codigo_indicacao, a.nome, a.cidade
    order by indicacoes desc
    limit ${limite}
  `;
}

async function calcularStats() {
  const query = exigirBanco();
  const linhas = await query`
    select count(*)::int as total_apoiadores, count(distinct cidade)::int as total_cidades
    from cadastros
  `;
  return linhas[0];
}

async function listarTodosParaExport() {
  const query = exigirBanco();
  return query`
    select nome, whatsapp, cidade, bairro, aniversario, sexo, campanha, origem, subcanal, data_captura, codigo_indicacao, indicado_por
    from cadastros
    order by data_captura asc
  `;
}

module.exports = {
  codigoJaExiste,
  indicadoPorValido,
  inserirCadastro,
  calcularRanking,
  calcularStats,
  listarTodosParaExport,
};
