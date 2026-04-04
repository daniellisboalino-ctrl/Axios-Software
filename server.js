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

function hashPass(pass) {
  return crypto.createHash('sha256').update(pass + 'axios2026').digest('hex');
}

async function initDB() {
  // Criar tabelas
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
      pertence TEXT, cliente TEXT, intermediador TEXT, pago_cli NUMERIC DEFAULT 0,
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
    CREATE TABLE IF NOT EXISTS parceiros (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      cpf TEXT, telefone TEXT, email TEXT,
      cidade TEXT, estado TEXT DEFAULT 'PR',
      tipo TEXT DEFAULT 'PARCEIRO', status TEXT DEFAULT 'ATIVO',
      obs TEXT, created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS parceiros_vendas (
      id SERIAL PRIMARY KEY,
      parceiro_id INTEGER REFERENCES parceiros(id) ON DELETE CASCADE,
      grupo TEXT, cota TEXT, adm TEXT,
      credito NUMERIC DEFAULT 0, parcela NUMERIC DEFAULT 0,
      categoria TEXT, situacao TEXT DEFAULT 'S/ CONTEM',
      data_venda TEXT, valor_comissao NUMERIC DEFAULT 0,
      status TEXT DEFAULT 'ATIVO', obs TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS parceiros_docs (
      id SERIAL PRIMARY KEY,
      parceiro_id INTEGER REFERENCES parceiros(id) ON DELETE CASCADE,
      nome TEXT NOT NULL,
      tipo TEXT DEFAULT 'DOCUMENTO',
      conteudo TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Migracoes
  await pool.query(`
    ALTER TABLE vendas ADD COLUMN IF NOT EXISTS vendedor TEXT;
    ALTER TABLE vendas ADD COLUMN IF NOT EXISTS intermediador TEXT;
    ALTER TABLE contratos ADD COLUMN IF NOT EXISTS adm TEXT;
    ALTER TABLE contratos ADD COLUMN IF NOT EXISTS grupo TEXT;
    ALTER TABLE contratos ADD COLUMN IF NOT EXISTS cota TEXT;
    ALTER TABLE estoque ADD COLUMN IF NOT EXISTS grupo_cota TEXT;
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
      INSERT INTO vendas (adm,grupo,cota,credito,vpago,lance,agil,entrada,parc_ant,parc_nova,pertence,cliente,intermediador,pago_cli,data,banco,vcto,status,vendedor,obs) VALUES
      ('YAMAHA','8088','450',21769.35,873.41,8363.46,500,9736.87,873.41,529.69,'DANIEL','JOSE','',8363.46,'2025-07-16','ITAU','7','PENDENTE','DANIEL',''),
      ('YAMAHA','8086','762',17680.85,708.55,6497.55,1000,8206.10,709.37,439.58,'ALINE','AFONSO','',8200,'2025-07-18','ITAU','12','QUITADO','ALINE','');
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
      ('Vencimento cota 9024/130','Parcela em atraso','2026-03-12','09:00','VENCIMENTO','PENDENTE','9024','130','ANAJAIRA'),
      ('Reuniao com cliente','Fechar venda carta','2026-03-15','14:00','REUNIAO','PENDENTE','','','JOSE');
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

makeRoutes('estoque',         ['admin','financeiro'],           ['admin','vendedor','financeiro','investidor']);
makeRoutes('vendas',          ['admin','vendedor'],             ['admin','vendedor','financeiro']);
makeRoutes('vendas_sem',      ['admin','vendedor'],             ['admin','vendedor','financeiro']);
makeRoutes('caixa',           ['admin','financeiro'],           ['admin','financeiro']);
makeRoutes('investidores',    ['admin'],                        ['admin','investidor','financeiro']);

// Investidores com suas cotas do estoque
app.get('/api/investidores-completo', auth, async function(req, res) {
  try {
    const inv = await pool.query('SELECT * FROM investidores ORDER BY nome');
    const est = await pool.query('SELECT * FROM estoque ORDER BY investidor');
    const result = inv.rows.map(function(i) {
      return Object.assign({}, i, {
        cotas_estoque: est.rows.filter(function(e) {
          return e.investidor && e.investidor.toUpperCase() === i.nome.toUpperCase();
        })
      });
    });
    res.json(result);
  } catch(e) { res.status(500).json({ error: e.message }); }
});
makeRoutes('agenda',          ['admin','vendedor','financeiro'],['admin','vendedor','financeiro']);
makeRoutes('contratos',       ['admin','vendedor'],             ['admin','vendedor','financeiro']);
makeRoutes('parceiros',       ['admin','vendedor'],             ['admin','vendedor','financeiro']);
makeRoutes('parceiros_vendas',['admin','vendedor'],             ['admin','vendedor','financeiro']);
makeRoutes('parceiros_docs',  ['admin','vendedor'],             ['admin','vendedor','financeiro']);

// PATCH estoque - editar situacao, credito, parcela
app.patch('/api/estoque/:id', auth, async function(req, res) {
  try {
    const allowed = ['situacao','credito','parcela','atraso','obs'];
    const body = req.body;
    const keys = Object.keys(body).filter(k => allowed.includes(k));
    if (!keys.length) return res.status(400).json({ error: 'Nenhum campo valido' });
    const vals = keys.map(k => body[k]);
    const sets = keys.map((k,i) => k+'=$'+(i+1)).join(', ');
    vals.push(req.params.id);
    const r = await pool.query('UPDATE estoque SET '+sets+' WHERE id=$'+vals.length+' RETURNING *', vals);
    res.json(r.rows[0]);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Parceiros com suas vendas e docs
app.get('/api/parceiros/:id/full', auth, async function(req, res) {
  try {
    const p = await pool.query('SELECT * FROM parceiros WHERE id=$1', [req.params.id]);
    const v = await pool.query('SELECT * FROM parceiros_vendas WHERE parceiro_id=$1 ORDER BY id DESC', [req.params.id]);
    const d = await pool.query('SELECT id,nome,tipo,created_at FROM parceiros_docs WHERE parceiro_id=$1 ORDER BY id DESC', [req.params.id]);
    res.json({ parceiro: p.rows[0], vendas: v.rows, docs: d.rows });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/parceiros_docs/:id/download', auth, async function(req, res) {
  try {
    const r = await pool.query('SELECT * FROM parceiros_docs WHERE id=$1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Nao encontrado' });
    const doc = r.rows[0];
    res.json({ nome: doc.nome, tipo: doc.tipo, conteudo: doc.conteudo });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/relatorio/comissoes', auth, async function(req, res) {
  try {
    const r = await pool.query(`
      SELECT vendedor,
        COUNT(*) as total_vendas,
        SUM(credito) as total_credito,
        SUM(entrada) as total_entrada,
        SUM(lance) as total_lance,
        SUM(pago_cli) as total_recebido,
        COUNT(CASE WHEN status = 'QUITADO' THEN 1 END) as quitadas,
        COUNT(CASE WHEN status = 'PENDENTE' THEN 1 END) as pendentes
      FROM vendas GROUP BY vendedor ORDER BY total_credito DESC
    `);
    res.json(r.rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/relatorio/caixa-mensal', auth, async function(req, res) {
  try {
    const r = await pool.query(`
      SELECT mes,
        SUM(CASE WHEN tipo='RECEITA' THEN valor ELSE 0 END) as receitas,
        SUM(CASE WHEN tipo='DESPESA' THEN valor ELSE 0 END) as despesas,
        SUM(CASE WHEN tipo='RECEITA' THEN valor ELSE -valor END) as resultado,
        COUNT(*) as lancamentos
      FROM caixa GROUP BY mes ORDER BY MIN(created_at)
    `);
    res.json(r.rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/relatorio/caixa-anual', auth, async function(req, res) {
  try {
    const r = await pool.query(`
      SELECT
        SUBSTRING(mes FROM 4) as ano,
        SUM(CASE WHEN tipo='RECEITA' THEN valor ELSE 0 END) as receitas,
        SUM(CASE WHEN tipo='DESPESA' THEN valor ELSE 0 END) as despesas,
        SUM(CASE WHEN tipo='RECEITA' THEN valor ELSE -valor END) as resultado,
        COUNT(*) as lancamentos,
        COUNT(DISTINCT mes) as meses_ativos
      FROM caixa
      WHERE mes IS NOT NULL AND mes != ''
      GROUP BY SUBSTRING(mes FROM 4)
      ORDER BY SUBSTRING(mes FROM 4)
    `);
    res.json(r.rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/relatorio/estoque-resumo', auth, async function(req, res) {
  try {
    const r = await pool.query(`
      SELECT categoria, situacao,
        COUNT(*) as quantidade,
        SUM(credito) as credito_total,
        SUM(parcela) as parcela_total
      FROM estoque GROUP BY categoria, situacao ORDER BY categoria, situacao
    `);
    res.json(r.rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Estoque contempladas disponiveis
app.get('/api/estoque-contempladas', auth, async function(req, res) {
  try {
    const r = await pool.query("SELECT * FROM estoque WHERE situacao='CONTEMPLADA' ORDER BY id DESC");
    res.json(r.rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Auto-gerar eventos de vencimento para agenda
app.post('/api/agenda/sync-vencimentos', auth, async function(req, res) {
  try {
    // Busca cotas do estoque com vcto preenchido
    const cotas = await pool.query("SELECT * FROM estoque WHERE vcto IS NOT NULL AND vcto != ''");
    let criados = 0;
    for (const c of cotas.rows) {
      const titulo = 'Vencimento ' + c.grupo + '/' + c.cota;
      // Verifica se ja existe
      const existe = await pool.query(
        "SELECT id FROM agenda WHERE titulo=$1 AND data=$2 AND tipo='VENCIMENTO'",
        [titulo, c.vcto]
      );
      if (!existe.rows.length) {
        await pool.query(
          "INSERT INTO agenda (titulo,descricao,data,hora,tipo,status,grupo,cota,cliente) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
          [titulo, 'Parcela: R$ '+c.parcela+' | Credito: R$ '+c.credito+' | Investidor: '+c.investidor, c.vcto, '09:00', 'VENCIMENTO', 'PENDENTE', c.grupo, c.cota, c.investidor]
        );
        criados++;
      }
    }
    res.json({ ok: true, criados });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Move cota estoque -> vendas contempladas
app.post('/api/estoque/:id/vender', auth, async function(req, res) {
  try {
    const cota = await pool.query('SELECT * FROM estoque WHERE id=$1', [req.params.id]);
    if (!cota.rows.length) return res.status(404).json({ error: 'Cota nao encontrada' });
    const c = cota.rows[0];
    const body = req.body;
    // Insert into vendas
    const v = await pool.query(
      'INSERT INTO vendas (adm,grupo,cota,credito,vpago,lance,agil,entrada,parc_ant,parc_nova,pertence,cliente,intermediador,pago_cli,data,banco,vcto,status,vendedor,obs) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) RETURNING *',
      [c.adm, c.grupo, c.cota, c.credito, body.vpago||0, body.lance||0, body.agil||0, body.entrada||0, body.parc_ant||0, body.parc_nova||0, c.investidor, body.cliente||'', body.intermediador||'', body.pago_cli||0, body.data||new Date().toISOString().split('T')[0], body.banco||'', c.vcto||'', 'PENDENTE', body.vendedor||'', body.obs||'']
    );
    // Remove from estoque
    await pool.query('DELETE FROM estoque WHERE id=$1', [req.params.id]);
    res.json({ ok: true, venda: v.rows[0] });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

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
    console.log('Axios Sistema v2.1 rodando na porta ' + PORT);
  });
}).catch(function(err) {
  console.error('Erro ao conectar banco:', err.message);
  process.exit(1);
});
