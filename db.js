// Camada de dados — Vercel Postgres. Substitui o antigo armazenamento em arquivo JSON,
// necessário porque o Vercel roda funções serverless sem disco persistente.
const { sql } = require('@vercel/postgres');

if (!process.env.POSTGRES_URL) {
  console.warn(
    'Aviso: POSTGRES_URL não configurado — o backend não vai conseguir ler nem salvar cadastros até isso ser definido (ver PRIMEIROS-PASSOS.md).'
  );
}

function erroBancoNaoConfigurado() {
  const erro = new Error('Banco de dados não configurado (defina POSTGRES_URL nas variáveis de ambiente).');
  erro.codigo = 'BANCO_NAO_CONFIGURADO';
  return erro;
}

function exigirBanco() {
  if (!process.env.POSTGRES_URL) throw erroBancoNaoConfigurado();
}

async function codigoJaExiste(codigo) {
  exigirBanco();
  const { rows } = await sql`select 1 from cadastros where codigo_indicacao = ${codigo} limit 1`;
  return rows.length > 0;
}

async function indicadoPorValido(codigo) {
  if (!codigo) return null;
  exigirBanco();
  const { rows } = await sql`select 1 from cadastros where codigo_indicacao = ${codigo} limit 1`;
  return rows.length > 0 ? codigo : null;
}

async function inserirCadastro(registro) {
  exigirBanco();
  const { rows } = await sql`
    insert into cadastros
      (nome, whatsapp, cidade, bairro, aniversario, sexo, campanha, origem, subcanal, codigo_indicacao, indicado_por)
    values
      (${registro.nome}, ${registro.whatsapp}, ${registro.cidade}, ${registro.bairro}, ${registro.aniversario},
       ${registro.sexo}, ${registro.campanha}, ${registro.origem}, ${registro.subcanal},
       ${registro.codigo_indicacao}, ${registro.indicado_por})
    returning *
  `;
  return rows[0];
}

async function calcularRanking(limite = 10) {
  exigirBanco();
  const { rows } = await sql`
    select a.nome, a.cidade, count(b.indicado_por)::int as indicacoes
    from cadastros a
    join cadastros b on b.indicado_por = a.codigo_indicacao
    group by a.codigo_indicacao, a.nome, a.cidade
    order by indicacoes desc
    limit ${limite}
  `;
  return rows;
}

async function calcularStats() {
  exigirBanco();
  const { rows } = await sql`
    select count(*)::int as total_apoiadores, count(distinct cidade)::int as total_cidades
    from cadastros
  `;
  return rows[0];
}

async function listarTodosParaExport() {
  exigirBanco();
  const { rows } = await sql`
    select nome, whatsapp, cidade, bairro, aniversario, sexo, campanha, origem, subcanal, data_captura, codigo_indicacao, indicado_por
    from cadastros
    order by data_captura asc
  `;
  return rows;
}

module.exports = {
  codigoJaExiste,
  indicadoPorValido,
  inserirCadastro,
  calcularRanking,
  calcularStats,
  listarTodosParaExport,
};
