// Rede de Apoio — backend (Express + Neon/Postgres)
// Local: npm install && npm start (precisa de DATABASE_URL no ambiente)
// Vercel: este arquivo é importado por api/index.js como função serverless.

// Carrega variáveis de um arquivo .env quando ele existir (uso local). No Vercel, as variáveis
// já vêm prontas em process.env — este require simplesmente não encontra .env e não faz nada.
try { require('dotenv').config(); } catch { /* dotenv ausente — segue com o que já estiver no ambiente */ }

const express = require('express');
const path = require('path');
const crypto = require('crypto');
const db = require('./db');

const app = express();
app.disable('x-powered-by');
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const PUBLIC_SITE_URL = (process.env.PUBLIC_SITE_URL || '').replace(/\/$/, '');

// O Vercel roda o app atrás de um proxy — sem isso, req.protocol sempre volta "http",
// mesmo quando o visitante acessou por https (o link de indicação saía errado por causa disso).
app.set('trust proxy', true);

// ---------- Utilidades ----------
function slugify(str) {
  return (str || '')
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40);
}

async function gerarCodigoUnico(nome) {
  const base = slugify(nome) || 'apoiador';
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const sufixo = crypto.randomBytes(3).toString('hex').slice(0, 4);
    const codigo = `${base}-${sufixo}`;
    if (!(await db.codigoJaExiste(codigo))) return codigo;
  }
  // extremamente improvável de chegar aqui, mas garante um código sempre único
  return `${base}-${crypto.randomBytes(6).toString('hex')}`;
}

function limpar(valor, max = 200) {
  return typeof valor === 'string' ? valor.trim().slice(0, max) : '';
}

// Rate limit simples por IP: no máximo 5 cadastros por minuto por IP.
// (Em serverless cada instância tem sua própria memória — isso é uma proteção best-effort,
// não uma garantia global. Pra limite rígido de verdade, mover pro banco ou um serviço dedicado.)
const tentativasPorIp = new Map();
function estaComRateLimit(ip) {
  const agora = Date.now();
  const janelaMs = 60 * 1000;
  const limite = 5;
  const registros = (tentativasPorIp.get(ip) || []).filter((t) => agora - t < janelaMs);
  registros.push(agora);
  tentativasPorIp.set(ip, registros);
  return registros.length > limite;
}

// ---------- Middlewares ----------
app.use(express.json({ limit: '16kb' }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (req.path.startsWith('/api/')) res.setHeader('Cache-Control', 'no-store');
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

// ---------- API ----------
app.post('/api/cadastro', async (req, res) => {
  const ip = req.ip;
  if (estaComRateLimit(ip)) {
    return res.status(429).json({ erro: 'Muitos cadastros em pouco tempo. Tente novamente em alguns instantes.' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const nome = limpar(body.nome, 120);
  const whatsapp = limpar(body.whatsapp, 20).replace(/\D/g, '');
  const cidade = limpar(body.cidade, 80);
  // Mantidos como valores vazios apenas por compatibilidade com o schema legado.
  // O formulário público não coleta mais bairro, aniversário ou sexo.
  const bairro = '';
  const aniversario = null;
  const sexo = null;
  const campanha = limpar(body.campanha, 60) || 'geral';
  const origem = limpar(body.origem, 30) || 'site';
  const subcanal = limpar(body.subcanal, 40) || 'form_home';
  const indicadoPorBruto = limpar(body.indicado_por, 60) || null;

  if (nome.length < 2 || !whatsapp || cidade.length < 2) {
    return res.status(400).json({ erro: 'Preencha nome, WhatsApp e cidade.' });
  }
  if (whatsapp.length < 10 || whatsapp.length > 13) {
    return res.status(400).json({ erro: 'WhatsApp inválido — inclua DDD.' });
  }

  try {
    const [indicadoPor, codigo] = await Promise.all([
      db.indicadoPorValido(indicadoPorBruto),
      gerarCodigoUnico(nome),
    ]);

    await db.inserirCadastro({
      nome, whatsapp, cidade, bairro, aniversario, sexo,
      campanha, origem, subcanal,
      codigo_indicacao: codigo,
      indicado_por: indicadoPor,
    });

    const baseUrl = PUBLIC_SITE_URL || `${req.protocol}://${req.get('host')}`;
    const link = `${baseUrl}/?ref=${encodeURIComponent(codigo)}`;
    res.json({ codigo, link });
  } catch (err) {
    console.error('Erro ao salvar cadastro:', err);
    const status = err.codigo === 'BANCO_NAO_CONFIGURADO' ? 503 : 500;
    res.status(status).json({ erro: 'Erro ao salvar o cadastro. Tente novamente em instantes.' });
  }
});

app.get('/api/ranking', (req, res) => {
  // A versão pública não expõe nomes, cidades ou contagens individuais.
  // Mantemos a rota para que integrações antigas recebam uma resposta segura.
  res.status(410).json({
    publico_desativado: true,
    mensagem: 'O ranking nominal foi desativado para proteger a privacidade dos apoiadores.',
  });
});

app.get('/api/stats', async (req, res) => {
  try {
    res.json(await db.calcularStats());
  } catch (err) {
    console.error('Erro ao calcular estatísticas:', err);
    res.status(err.codigo === 'BANCO_NAO_CONFIGURADO' ? 503 : 500).json({ total_apoiadores: 0, total_cidades: 0 });
  }
});

// Exportação em CSV — uso interno da campanha apenas. Protegida por token
// (defina ADMIN_TOKEN no ambiente). Sem o token configurado, fica desativada.
app.get('/api/export.csv', async (req, res) => {
  const tokenEnviado = req.query.token || (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!ADMIN_TOKEN || tokenEnviado !== ADMIN_TOKEN) {
    return res.status(403).send('Acesso negado.');
  }
  try {
    const lista = await db.listarTodosParaExport();
    const colunas = [
      'nome', 'whatsapp', 'cidade', 'bairro', 'aniversario', 'sexo',
      'campanha', 'origem', 'subcanal', 'data_captura', 'codigo_indicacao', 'indicado_por',
    ];
    const linhas = [colunas.join(',')];
    lista.forEach((c) => {
      linhas.push(colunas.map((col) => `"${(c[col] ?? '').toString().replace(/"/g, '""')}"`).join(','));
    });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="cadastros.csv"');
    res.send(linhas.join('\n'));
  } catch (err) {
    console.error('Erro ao exportar CSV:', err);
    res.status(500).send('Erro ao exportar.');
  }
});

// No Vercel, este arquivo é importado como módulo por api/index.js (função serverless) —
// só sobe um servidor de verdade quando rodado diretamente (`npm start`, localmente ou noutra hospedagem).
if (require.main === module) {
  const PORT = process.env.PORT || 3010; // 3000 já está ocupado pelo EVE OS nesta máquina
  app.listen(PORT, () => {
    console.log(`Rede de Apoio rodando em http://localhost:${PORT}`);
    if (!ADMIN_TOKEN) {
      console.log('Aviso: ADMIN_TOKEN não definido — /api/export.csv fica desativado até você configurar essa variável de ambiente.');
    }
  });
}

module.exports = app;
