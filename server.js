const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Simple hash function
function hashPass(pass) {
  return crypto.createHash('sha256').update(pass + 'axios2026').digest('hex');
}

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL,
      perfil TEXT DEFAULT 'vendedor',
      ativo BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS sessoes (
      id TEXT PRIMARY KEY,
      usuario_id INTEGER REFERENCES usuarios(id),
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS estoque (
      id SERIAL PRIMARY KEY,
      grupo TEXT, cota TEXT, adm TEXT, investidor TEXT,
      credito NUMERIC DEFAULT 0, parcela NUMERIC DEFAULT 0, pago NUMERIC DEFAULT 0,
      categoria TEXT, situacao TEXT, vcto TEXT,
      meses INTEGER DEFAULT 0, atraso INTEGER DEFAULT 0, obs TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS vendas (
      id SERIAL PRIMARY KEY,
      adm TEXT, grupo TEXT, cota TEXT, credito NUMERIC DEFAULT 0,
      vpago NUMERIC DEFAULT 0, lance NUMERIC DEFAULT 0, agil NUMERIC DEFAULT 0,
      entrada NUMERIC DEFAULT 0, parc_ant NUMERIC DEFAULT 0, parc_nova NUMERIC DEFAULT 0,
      pertence TEXT, cliente TEXT, pago_cli NUMERIC DEFAULT 0,
      data TEXT, banco TEXT, vcto TEXT, status TEXT DEFAULT 'PENDENTE',
      vendedor TEXT, obs TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS vendas_sem (
      id SERIAL PRIMARY KEY,
      grupo TEXT, cota TEXT, investidor TEXT, adm TEXT,
      credito NUMERIC DEFAULT 0, parcela NUMERIC DEFAULT 0,
      categoria TEXT, vendedor TEXT, meses INTEGER DEFAULT 0, vcto TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS caixa (
      id SERIAL PRIMARY KEY,
      tipo TEXT, data TEXT, descricao TEXT, cat TEXT,
      valor NUMERIC DEFAULT 0, status TEXT, mes TEXT, obs TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS investidores (
      id SERIAL PRIMARY KEY,
      nome TEXT, contrato TEXT, adm TEXT, grupo TEXT, cota TEXT,
      credito NUMERIC DEFAULT 0, parcela NUMERIC DEFAULT 0, prazo INTEGER DEFAULT 0,
      lance NUMERIC DEFAULT 0, comissao NUMERIC DEFAULT 0.02,
      status TEXT DEFAULT 'ATIVO', obs TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS agenda (
      id SERIAL PRIMARY KEY,
      titulo TEXT, descricao TEXT, data TEXT, hora TEXT,
      tipo TEXT, status TEXT DEFAULT 'PENDENTE',
      grupo TEXT, cota TEXT, cliente TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS contratos (
      id SERIAL PRIMARY KEY,
      numero TEXT, cliente TEXT, tipo TEXT,
      grupo TEXT, cota TEXT, adm TEXT,
      valor NUMERIC DEFAULT 0, data_assinatura TEXT,
      status TEXT DEFAULT 'ATIVO', obs TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  const uc = await pool.query('SELECT COUNT(*) FROM usuarios');
  if (parseInt(uc.rows[0].count) === 0) {
    await pool.query(`
      INSERT INTO usuarios (nome, email, senha, perfil) VALUES
      ('Administrador', 'admin@axios.com', '${hashPass('admin123')}', 'admin'),
      ('Daniel', 'daniel@axios.com', '${hashPass('daniel123')}', 'vendedor'),
      ('Financeiro', 'financeiro@axios.com', '${hashPass('financeiro123')}', 'financeiro');
    `);
    console.log('Usuarios padrao criados.');
  }

  const ec = await pool.query('SELECT COUNT(*) FROM estoque');
  if (parseInt(ec.rows[0].count) === 0) {
    await pool.query(`
      INSERT INTO estoque (grupo,cota,adm,investidor,credito,parcela,pago,categoria,situacao,vcto,meses,atraso,obs) VALUES
      ('9010','767','YAMAHA','DANIEL',28425,722.29,1441.38,'MOTO','CONTEMPLADA','2026-03-12',50,0,''),
      ('9024','130','YAMAHA','ANAJAIRA',170000,2118.57,4237.14,'CARRO','S/ CONTEM','2026-03-12',68,2,''),
      ('9052','733','YAMAHA','WENDEL',18925,883.63,1769.81,'MOTO','CONTEMPLADA','2026-03-20',24,0,''),
      ('8095','207','YAMAHA','DANIEL',41514,1055.84,2111.68,'CARRO','CONTEMPLADA','2026-03-20',44,0,''),
      ('9005','490','YAMAHA','ALINE',23112,584.08,1752.48,'MOTO','S/ CONTEM','2026-03-20',48,0,'');
      INSERT INTO vendas (adm,grupo,cota,credito,vpago,lance,agil,entrada,parc_ant,parc_nova,pertence,cliente,pago_cli,data,banco,vcto,status,vendedor,obs) VALUES
      ('YAMAHA','8088','450',21769.35,873.41,8363.46,500,9736.87,873.41,529.69,'DANIEL','JOSE',8363.46,'2025-07-16','ITAU','7','PENDENTE','DANIEL',''),
      ('YAMAHA','8086','762',17680.85,708.55,6497.55,1000,8206.10,709.37,439.58,'ALINE','AFONSO',8200,'2025-07-18','ITAU','12','QUITADO','ALINE','');
      INSERT INTO caixa (tipo,data,descricao,cat,valor,status,mes,obs) VALUES
      ('RECEITA','2025-12-04','COMISSAO YAMAHA','COMISSAO',11207.64,'PG','DEZ/2025',''),
      ('RECEITA','2025-12-08','VENDA CARTA','VENDA CARTA',22890,'PG','DEZ/2025',''),
      ('DESPESA','2025-12-05','SALARIO PAULO','FIXO',2000,'PG','DEZ/2025',''),
      ('RECEITA','2026-01-06','COMISSAO YAMAHA','COMISSAO',30315.64,'PG','JAN/2026',''),
      ('DESPESA','2026-01-22','SALARIO PAULO','FIXO',2500,'PG','JAN/2026',''),
      ('RECEITA','2026-02-05','COMISSAO YAMAHA','COMISSAO',19454.28,'PG','FEV/2026',''),
      ('DESPESA','2026-02-02','ALUGUEL','FIXO',5000,'PG','FEV/2026',''),
      ('RECEITA','2026-03-05','COMISSAO YAMAHA','COMISSAO',12354.93,'PG','MAR/2026',''),
      ('DESPESA','2026-03-05','ALUGUEL','FIXO',5000,'PG','MAR/2026','');
      INSERT INTO investidores (nome,contrato,adm,grupo,cota,credito,parcela,prazo,lance,comissao,status,obs) VALUES
      ('ALINE','20534149','YAMAHA','8084','112',46000,1466.42,36,0,0.02,'ATIVO',''),
      ('DANIEL','20533859','YAMAHA','8099','102',46000,1195.23,45,0,0.02,'ATIVO','');
      INSERT INTO agenda (titulo,descricao,data,hora,tipo,status,grupo,cota,cliente) VALUES
      ('Vencimento cota 9024/130','Parcela em atraso - ANAJAIRA','2026-03-12','09:00','VENCIMENTO','PENDENTE','9024','130','ANAJAIRA'),
      ('Reuniao com cliente','JOSE - fechar venda carta','2026-03-15','14:00','REUNIAO','PENDENTE','','','JOSE');
      INSERT INTO contratos (numero,cliente,tipo,grupo,cota,adm,valor,data_assinatura,status,obs) VALUES
      ('CTR-001','JOSE','COMPRA E VENDA','8088','450','YAMAHA',21769.35,'2025-07-16','ATIVO',''),
      ('CTR-002','AFONSO','COMPRA E VENDA','8086','762','YAMAHA',17680.85,'2025-07-18','ENCERRADO','');
    `);
    console.log('Dados iniciais inseridos.');
  }
  console.log('Banco de dados pronto.');
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Auth middleware
async function auth(req, res, next) {
  const token = req.headers['x-session'];
  if (!token) return res.status(401).json({ error: 'Nao autenticado' });
  try {
    const r = await pool.query(
      'SELECT u.* FROM sessoes s JOIN usuarios u ON u.id = s.usuario_id WHERE s.id = $1 AND u.ativo = true',
      [token]
    );
    if (!r.rows.length) return res.status(401).json({ error: 'Sessao invalida' });
    req.user = r.rows[0];
    next();
  } catch(e) { res.status(500).json({ error: e.message }); }
}

function requirePerfil(...perfis) {
  return function(req, res, next) {
    if (!perfis.includes(req.user.perfil)) return res.status(403).json({ error: 'Sem permissao' });
    next();
  };
}

// Login
app.post('/api/login', async function(req, res) {
  try {
    const { email, senha } = req.body;
    const r = await pool.query('SELECT * FROM usuarios WHERE email = $1 AND senha = $2 AND ativo = true', [email, hashPass(senha)]);
    if (!r.rows.length) return res.status(401).json({ error: 'Email ou senha incorretos' });
    const token = crypto.randomBytes(32).toString('hex');
    await pool.query('INSERT INTO sessoes (id, usuario_id) VALUES ($1, $2)', [token, r.rows[0].id]);
    const u = r.rows[0];
    res.json({ token, usuario: { id: u.id, nome: u.nome, email: u.email, perfil: u.perfil } });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/logout', auth, async function(req, res) {
  const token = req.headers['x-session'];
  await pool.query('DELETE FROM sessoes WHERE id = $1', [token]);
  res.json({ ok: true });
});

app.get('/api/me', auth, function(req, res) {
  const u = req.user;
  res.json({ id: u.id, nome: u.nome, email: u.email, perfil: u.perfil });
});

// Usuarios (admin only)
app.get('/api/usuarios', auth, requirePerfil('admin'), async function(req, res) {
  const r = await pool.query('SELECT id,nome,email,perfil,ativo,created_at FROM usuarios ORDER BY id');
  res.json(r.rows);
});

app.post('/api/usuarios', auth, requirePerfil('admin'), async function(req, res) {
  try {
    const { nome, email, senha, perfil } = req.body;
    const r = await pool.query(
      'INSERT INTO usuarios (nome,email,senha,perfil) VALUES ($1,$2,$3,$4) RETURNING id,nome,email,perfil,ativo',
      [nome, email, hashPass(senha), perfil]
    );
    res.json(r.rows[0]);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/usuarios/:id', auth, requirePerfil('admin'), async function(req, res) {
  try {
    const { nome, email, perfil, ativo } = req.body;
    const r = await pool.query(
      'UPDATE usuarios SET nome=$1,email=$2,perfil=$3,ativo=$4 WHERE id=$5 RETURNING id,nome,email,perfil,ativo',
      [nome, email, perfil, ativo, req.params.id]
    );
    res.json(r.rows[0]);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/usuarios/:id/senha', auth, requirePerfil('admin'), async function(req, res) {
  try {
    await pool.query('UPDATE usuarios SET senha=$1 WHERE id=$2', [hashPass(req.body.senha), req.params.id]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Generic CRUD factory
function makeRoutes(table, allowedPerfis, readPerfis) {
  const rp = readPerfis || allowedPerfis;
  app.get('/api/' + table, auth, async function(req, res) {
    if (!rp.includes(req.user.perfil)) return res.status(403).json({ error: 'Sem permissao' });
    try {
      let q = 'SELECT * FROM ' + table + ' ORDER BY id DESC';
      if (table === 'vendas' && req.user.perfil === 'vendedor') {
        q = "SELECT * FROM vendas WHERE vendedor = '" + req.user.nome + "' ORDER BY id DESC";
      }
      const r = await pool.query(q);
      res.json(r.rows);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/' + table, auth, async function(req, res) {
    if (!allowedPerfis.includes(req.user.perfil)) return res.status(403).json({ error: 'Sem permissao' });
    try {
      const body = req.body;
      const keys = Object.keys(body);
      const vals = Object.values(body);
      const cols = keys.join(', ');
      const ph = keys.map(function(k,i){ return '$'+(i+1); }).join(', ');
      const r = await pool.query('INSERT INTO '+table+' ('+cols+') VALUES ('+ph+') RETURNING *', vals);
      res.json(r.rows[0]);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  app.put('/api/' + table + '/:id', auth, async function(req, res) {
    if (!allowedPerfis.includes(req.user.perfil)) return res.status(403).json({ error: 'Sem permissao' });
    try {
      const body = req.body;
      const keys = Object.keys(body);
      const vals = Object.values(body);
      const sets = keys.map(function(k,i){ return k+'=$'+(i+1); }).join(', ');
      vals.push(req.params.id);
      const r = await pool.query('UPDATE '+table+' SET '+sets+' WHERE id=$'+vals.length+' RETURNING *', vals);
      res.json(r.rows[0]);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  app.delete('/api/' + table + '/:id', auth, async function(req, res) {
    if (!allowedPerfis.includes(req.user.perfil)) return res.status(403).json({ error: 'Sem permissao' });
    try {
      await pool.query('DELETE FROM '+table+' WHERE id=$1', [req.params.id]);
      res.json({ ok: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });
}

makeRoutes('estoque',    ['admin','financeiro'],          ['admin','vendedor','financeiro','investidor']);
makeRoutes('vendas',     ['admin','vendedor'],            ['admin','vendedor','financeiro']);
makeRoutes('vendas_sem', ['admin','vendedor'],            ['admin','vendedor','financeiro']);
makeRoutes('caixa',      ['admin','financeiro'],          ['admin','financeiro']);
makeRoutes('investidores',['admin'],                     ['admin','investidor','financeiro']);
makeRoutes('agenda',     ['admin','vendedor','financeiro'],['admin','vendedor','financeiro']);
makeRoutes('contratos',  ['admin','vendedor'],            ['admin','vendedor','financeiro']);

// Relatorios
app.get('/api/relatorio/comissoes', auth, async function(req, res) {
  try {
    const r = await pool.query(`
      SELECT
        vendedor,
        COUNT(*) as total_vendas,
        SUM(credito) as total_credito,
        SUM(entrada) as total_entrada,
        SUM(lance) as total_lance,
        SUM(pago_cli) as total_recebido,
        COUNT(CASE WHEN status = 'QUITADO' THEN 1 END) as quitadas,
        COUNT(CASE WHEN status = 'PENDENTE' THEN 1 END) as pendentes
      FROM vendas
      GROUP BY vendedor
      ORDER BY total_credito DESC
    `);
    res.json(r.rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/relatorio/caixa-mensal', auth, async function(req, res) {
  try {
    const r = await pool.query(`
      SELECT
        mes,
        SUM(CASE WHEN tipo='RECEITA' THEN valor ELSE 0 END) as receitas,
        SUM(CASE WHEN tipo='DESPESA' THEN valor ELSE 0 END) as despesas,
        SUM(CASE WHEN tipo='RECEITA' THEN valor ELSE -valor END) as resultado
      FROM caixa
      GROUP BY mes
      ORDER BY MIN(created_at)
    `);
    res.json(r.rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/relatorio/estoque-resumo', auth, async function(req, res) {
  try {
    const r = await pool.query(`
      SELECT
        categoria,
        situacao,
        COUNT(*) as quantidade,
        SUM(credito) as credito_total,
        SUM(parcela) as parcela_total
      FROM estoque
      GROUP BY categoria, situacao
      ORDER BY categoria, situacao
    `);
    res.json(r.rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Export
app.get('/api/export', auth, async function(req, res) {
  try {
    const tables = ['estoque','vendas','vendas_sem','caixa','investidores','agenda','contratos'];
    const data = {};
    for (const t of tables) {
      const r = await pool.query('SELECT * FROM ' + t);
      data[t] = r.rows;
    }
    data.exportedAt = new Date().toISOString();
    const filename = 'axios_backup_' + new Date().toISOString().split('T')[0] + '.json';
    res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
    res.json(data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/health', function(req, res) { res.json({ ok: true }); });

app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

initDB().then(function() {
  app.listen(PORT, function() {
    console.log('Axios Sistema v2.0 rodando na porta ' + PORT);
  });
}).catch(function(err) {
  console.error('Erro ao conectar banco:', err.message);
  process.exit(1);
});
