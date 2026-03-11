const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function initDB() {
  await pool.query(`
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
      data TEXT, banco TEXT, vcto TEXT, status TEXT DEFAULT 'PENDENTE', obs TEXT,
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
  `);

  const check = await pool.query('SELECT COUNT(*) FROM estoque');
  if (parseInt(check.rows[0].count) === 0) {
    await pool.query(`
      INSERT INTO estoque (grupo,cota,adm,investidor,credito,parcela,pago,categoria,situacao,vcto,meses,atraso,obs) VALUES
      ('9010','767','YAMAHA','DANIEL',28425,722.29,1441.38,'MOTO','CONTEMPLADA','2026-03-12',50,0,''),
      ('9024','130','YAMAHA','ANAJAIRA',170000,2118.57,4237.14,'CARRO','S/ CONTEM','2026-03-12',68,2,''),
      ('9052','733','YAMAHA','WENDEL',18925,883.63,1769.81,'MOTO','CONTEMPLADA','2026-03-20',24,0,''),
      ('8095','207','YAMAHA','DANIEL',41514,1055.84,2111.68,'CARRO','CONTEMPLADA','2026-03-20',44,0,''),
      ('9005','490','YAMAHA','ALINE',23112,584.08,1752.48,'MOTO','S/ CONTEM','2026-03-20',48,0,'');

      INSERT INTO vendas (adm,grupo,cota,credito,vpago,lance,agil,entrada,parc_ant,parc_nova,pertence,cliente,pago_cli,data,banco,vcto,status,obs) VALUES
      ('YAMAHA','8088','450',21769.35,873.41,8363.46,500,9736.87,873.41,529.69,'DANIEL','JOSE',8363.46,'2025-07-16','ITAU','7','PENDENTE',''),
      ('YAMAHA','8086','762',17680.85,708.55,6497.55,1000,8206.10,709.37,439.58,'ALINE','AFONSO',8200,'2025-07-18','ITAU','12','QUITADO','');

      INSERT INTO vendas_sem (grupo,cota,investidor,adm,credito,parcela,categoria,vendedor,meses,vcto) VALUES
      ('9547','8','BRUNO KOITI','YAMAHA',85518,1409.27,'MOTO','TIAGO/DANIEL',71,'20'),
      ('10017','455','CLEBER SCOPARIN','YAMAHA',400000,1491.35,'IMOVEL','DANIEL',238,'16');

      INSERT INTO caixa (tipo,data,descricao,cat,valor,status,mes,obs) VALUES
      ('RECEITA','2025-12-04','COMISSAO YAMAHA','COMISSAO',11207.64,'PG','DEZ/2025',''),
      ('RECEITA','2025-12-08','VENDA CARTA','VENDA CARTA',22890,'PG','DEZ/2025',''),
      ('DESPESA','2025-12-05','SALARIO PAULO','FIXO',2000,'PG','DEZ/2025',''),
      ('DESPESA','2025-12-15','ALUGUEL','FIXO',1050,'PG','DEZ/2025',''),
      ('RECEITA','2026-01-06','COMISSAO YAMAHA','COMISSAO',30315.64,'PG','JAN/2026',''),
      ('DESPESA','2026-01-22','SALARIO PAULO','FIXO',2500,'PG','JAN/2026',''),
      ('RECEITA','2026-02-05','COMISSAO YAMAHA','COMISSAO',19454.28,'PG','FEV/2026',''),
      ('DESPESA','2026-02-02','ALUGUEL','FIXO',5000,'PG','FEV/2026',''),
      ('RECEITA','2026-03-05','COMISSAO YAMAHA','COMISSAO',12354.93,'PG','MAR/2026',''),
      ('DESPESA','2026-03-05','ALUGUEL','FIXO',5000,'PG','MAR/2026','');

      INSERT INTO investidores (nome,contrato,adm,grupo,cota,credito,parcela,prazo,lance,comissao,status,obs) VALUES
      ('ALINE','20534149','YAMAHA','8084','112',46000,1466.42,36,0,0.02,'ATIVO',''),
      ('DANIEL','20533859','YAMAHA','8099','102',46000,1195.23,45,0,0.02,'ATIVO','');
    `);
    console.log('Dados iniciais inseridos.');
  }
  console.log('Banco de dados pronto.');
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function makeRoutes(table) {
  app.get('/api/' + table, async function(req, res) {
    try {
      const result = await pool.query('SELECT * FROM ' + table + ' ORDER BY id DESC');
      res.json(result.rows);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/' + table, async function(req, res) {
    try {
      const body = req.body;
      const keys = Object.keys(body);
      const values = Object.values(body);
      const cols = keys.join(', ');
      const placeholders = keys.map(function(k, i) { return '$' + (i + 1); }).join(', ');
      const result = await pool.query(
        'INSERT INTO ' + table + ' (' + cols + ') VALUES (' + placeholders + ') RETURNING *',
        values
      );
      res.json(result.rows[0]);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  app.put('/api/' + table + '/:id', async function(req, res) {
    try {
      const body = req.body;
      const keys = Object.keys(body);
      const values = Object.values(body);
      const sets = keys.map(function(k, i) { return k + ' = $' + (i + 1); }).join(', ');
      values.push(req.params.id);
      const result = await pool.query(
        'UPDATE ' + table + ' SET ' + sets + ' WHERE id = $' + values.length + ' RETURNING *',
        values
      );
      res.json(result.rows[0]);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  app.delete('/api/' + table + '/:id', async function(req, res) {
    try {
      await pool.query('DELETE FROM ' + table + ' WHERE id = $1', [req.params.id]);
      res.json({ ok: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });
}

makeRoutes('estoque');
makeRoutes('vendas');
makeRoutes('vendas_sem');
makeRoutes('caixa');
makeRoutes('investidores');

app.get('/api/export', async function(req, res) {
  try {
    const estoque = await pool.query('SELECT * FROM estoque');
    const vendas = await pool.query('SELECT * FROM vendas');
    const vendasSem = await pool.query('SELECT * FROM vendas_sem');
    const caixa = await pool.query('SELECT * FROM caixa');
    const investidores = await pool.query('SELECT * FROM investidores');
    const filename = 'axios_backup_' + new Date().toISOString().split('T')[0] + '.json';
    res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
    res.json({
      estoque: estoque.rows,
      vendas: vendas.rows,
      vendasSem: vendasSem.rows,
      caixa: caixa.rows,
      investidores: investidores.rows,
      exportedAt: new Date().toISOString()
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/health', function(req, res) {
  res.json({ ok: true });
});

app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

initDB().then(function() {
  app.listen(PORT, function() {
    console.log('Axios Sistema rodando na porta ' + PORT);
  });
}).catch(function(err) {
  console.error('Erro ao conectar banco:', err.message);
  process.exit(1);
});
