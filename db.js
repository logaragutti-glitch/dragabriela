// Camada de dados — Supabase (Postgres). Substitui o antigo armazenamento em arquivo JSON,
// necessário porque o Vercel roda funções serverless sem disco persistente.
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.warn(
    'Aviso: SUPABASE_URL / SUPABASE_SERVICE_KEY não configurados — ' +
    'o backend não vai conseguir ler nem salvar cadastros até isso ser definido (ver PRIMEIROS-PASSOS.md).'
  );
}

// service_role key: só usada aqui, no servidor — ignora Row Level Security de propósito,
// porque é o próprio backend quem decide o que pode ser lido/escrito. Nunca exponha essa
// chave no frontend.
const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })
  : null;

function exigirSupabase() {
  if (!supabase) {
    const erro = new Error('Supabase não configurado (defina SUPABASE_URL e SUPABASE_SERVICE_KEY nas variáveis de ambiente).');
    erro.codigo = 'SUPABASE_NAO_CONFIGURADO';
    throw erro;
  }
  return supabase;
}

async function codigoJaExiste(codigo) {
  const db = exigirSupabase();
  const { data, error } = await db.from('cadastros').select('codigo_indicacao').eq('codigo_indicacao', codigo).maybeSingle();
  if (error) throw error;
  return !!data;
}

async function indicadoPorValido(codigo) {
  if (!codigo) return null;
  const db = exigirSupabase();
  const { data, error } = await db.from('cadastros').select('codigo_indicacao').eq('codigo_indicacao', codigo).maybeSingle();
  if (error) throw error;
  return data ? codigo : null;
}

async function inserirCadastro(registro) {
  const db = exigirSupabase();
  const { data, error } = await db.from('cadastros').insert(registro).select().single();
  if (error) throw error;
  return data;
}

async function calcularRanking(limite = 10) {
  const db = exigirSupabase();
  const { data, error } = await db.from('cadastros').select('nome, cidade, codigo_indicacao, indicado_por');
  if (error) throw error;

  const porCodigo = new Map(data.map((c) => [c.codigo_indicacao, c]));
  const contagem = new Map();
  data.forEach((c) => {
    if (c.indicado_por) contagem.set(c.indicado_por, (contagem.get(c.indicado_por) || 0) + 1);
  });

  return [...contagem.entries()]
    .map(([codigo, indicacoes]) => {
      const apoiador = porCodigo.get(codigo);
      return apoiador ? { nome: apoiador.nome, cidade: apoiador.cidade, indicacoes } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.indicacoes - a.indicacoes)
    .slice(0, limite);
}

async function calcularStats() {
  const db = exigirSupabase();
  const { count, error: erroCount } = await db.from('cadastros').select('*', { count: 'exact', head: true });
  if (erroCount) throw erroCount;

  const { data, error: erroCidades } = await db.from('cadastros').select('cidade');
  if (erroCidades) throw erroCidades;
  const cidades = new Set(data.map((c) => c.cidade).filter(Boolean));

  return { total_apoiadores: count || 0, total_cidades: cidades.size };
}

async function listarTodosParaExport() {
  const db = exigirSupabase();
  const { data, error } = await db
    .from('cadastros')
    .select('nome, whatsapp, cidade, bairro, aniversario, sexo, campanha, origem, subcanal, data_captura, codigo_indicacao, indicado_por')
    .order('data_captura', { ascending: true });
  if (error) throw error;
  return data;
}

module.exports = {
  codigoJaExiste,
  indicadoPorValido,
  inserirCadastro,
  calcularRanking,
  calcularStats,
  listarTodosParaExport,
};
