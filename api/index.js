// Ponto de entrada da função serverless do Vercel — reaproveita o mesmo app Express de server.js.
// Tudo que bate em /api/* é roteado pra cá (ver vercel.json).
module.exports = require('../server.js');
