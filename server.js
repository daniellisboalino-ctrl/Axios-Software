const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Banco de dados em memoria
let db = {
  nextId: { estoque:100, vendas:100, vendasSem:100, caixa:100, investidores:100 },
  estoque: [
    {id:1,grupo:'9010',cota:'767',adm:'YAMAHA',investidor:'DANIEL',credito:28425,parcela:722.29,pago:1441.38,categoria:'MOTO',situacao:'CONTEMPLADA',vcto:'2026-03-12',meses:50,atraso:0,obs:''},
    {id:2,grupo:'9024',cota:'130',adm:'YAMAHA',investidor:'ANAJAIRA',credito:170000,parcela:2118.57,pago:4237.14,categoria:'CARRO',situacao:'S/ CONTEM',vcto:'2026-03-12',meses:68,atraso:2,obs:''},
    {id:3,grupo:'9052',cota:'733',adm:'YAMAHA',investidor:'WENDEL',credito:18925,parcela:883.63,pago:1769.81,categoria:'MOTO',situacao:'CONTEMPLADA',vcto:'2026-03-20',meses:24,atraso:0,obs:''},
    {id:4,grupo:'8095',cota:'207',adm:'YAMAHA',investidor:'DANIEL',credito:41514,parcela:1055.84,pago:2111.68,categoria:'CARRO',situacao:'CONTEMPLADA',vcto:'2026-03-20',meses:44,atraso:0,obs:''},
    {id:5,grupo:'9005',cota:'490',adm:'YAMAHA',investidor:'ALINE',credito:23112,parcela:584.08,pago:1752.48,categoria:'MOTO',situacao:'S/ CONTEM',vcto:'2026-03-20',meses:48,atraso:0,obs:''},
  ],
  vendas: [
    {id:1,adm:'YAMAHA',grupo:'8088',cota:'450',credito:21769.35,vpago:873.41,lance:8363.46,agil:500,entrada:9736.87,parc_ant:873.41,parc_nova:529.69,pertence:'DANIEL',cliente:'JOSE',pago_cli:8363.46,data:'2025-07-16',banco:'ITAU',vcto:'7',status:'PENDENTE',obs:''},
    {id:2,adm:'YAMAHA',grupo:'8086',cota:'762',credito:17680.85,vpago:708.55,lance:6497.55,agil:1000,entrada:8206.10,parc_ant:709.37,parc_nova:439.58,pertence:'ALINE',cliente:'AFONSO',pago_cli:8200,data:'2025-07-18',banco:'ITAU',vcto:'12',status:'QUITADO',obs:''},
  ],
  vendasSem: [
    {id:1,grupo:'9547',cota:'8',investidor:'BRUNO KOITI',adm:'YAMAHA',credito:85518,parcela:1409.27,categoria:'MOTO',vendedor:'TIAGO/DANIEL',meses:71,vcto:'20'},
    {id:2,grupo:'10017',cota:'455',investidor:'CLEBER SCOPARIN',adm:'YAMAHA',credito:400000,parcela:1491.35,categoria:'IMOVEL',vendedor:'DANIEL',meses:238,vcto:'16'},
  ],
  caixa: [
    {id:1,tipo:'RECEITA',data:'2025-12-04',descricao:'COMISSAO YAMAHA',cat:'COMISSAO',valor:11207.64,status:'PG',mes:'DEZ/2025',obs:''},
    {id:2,tipo:'RECEITA',data:'2025-12-08',descricao:'VENDA CARTA',cat:'VENDA CARTA',valor:22890,status:'PG',mes:'DEZ/2025',obs:''},
    {id:3,tipo:'DESPESA',data:'2025-12-05',descricao:'SALARIO PAULO',cat:'FIXO',valor:2000,status:'PG',mes:'DEZ/2025',obs:''},
    {id:4,tipo:'DESPESA',data:'2025-12-15',descricao:'ALUGUEL',cat:'FIXO',valor:1050,status:'PG',mes:'DEZ/2025',obs:''},
    {id:5,tipo:'RECEITA',data:'2026-01-06',descricao:'COMISSAO YAMAHA',cat:'COMISSAO',valor:30315.64,status:'PG',mes:'JAN/2026',obs:''},
    {id:6,tipo:'DESPESA',data:'2026-01-22',descricao:'SALARIO PAULO',cat:'FIXO',valor:2500,status:'PG',mes:'JAN/2026',obs:''},
    {id:7,tipo:'RECEITA',data:'2026-02-05',descricao:'COMISSAO YAMAHA',cat:'COMISSAO',valor:19454.28,status:'PG',mes:'FEV/2026',obs:''},
    {id:8,tipo:'DESPESA',data:'2026-02-02',descricao:'ALUGUEL',cat:'FIXO',valor:5000,status:'PG',mes:'FEV/2026',obs:''},
    {id:9,tipo:'RECEITA',data:'2026-03-05',descricao:'COMISSAO YAMAHA',cat:'COMISSAO',valor:12354.93,status:'PG',mes:'MAR/2026',obs:''},
    {id:10,tipo:'DESPESA',data:'2026-03-05',descricao:'ALUGUEL',cat:'FIXO',valor:5000,status:'PG',mes:'MAR/2026',obs:''},
  ],
  investidores: [
    {id:1,nome:'ALINE',contrato:'20534149',adm:'YAMAHA',grupo:'8084',cota:'112',credito:46000,parcela:1466.42,prazo:36,lance:0,comissao:0.02,status:'ATIVO',obs:''},
    {id:2,nome:'DANIEL',contrato:'20533859',adm:'YAMAHA',grupo:'8099',cota:'102',credito:46000,parcela:1195.23,prazo:45,lance:0,comissao:0.02,status:'ATIVO',obs:''},
  ]
};

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function makeRoutes(table) {
  app.get('/api/' + table, function(req, res) {
    res.json(db[table] || []);
  });

  app.post('/api/' + table, function(req, res) {
    if (!db.nextId[table]) db.nextId[table] = 100;
    var id = db.nextId[table]++;
    var item = Object.assign({ id: id }, req.body);
    if (!db[table]) db[table] = [];
    db[table].push(item);
    res.json(item);
  });

  app.put('/api/' + table + '/:id', function(req, res) {
    var id = parseInt(req.params.id);
    var idx = db[table].findIndex(function(i) { return i.id === id; });
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    db[table][idx] = Object.assign({ id: id }, req.body);
    res.json(db[table][idx]);
  });

  app.delete('/api/' + table + '/:id', function(req, res) {
    var id = parseInt(req.params.id);
    db[table] = db[table].filter(function(i) { return i.id !== id; });
    res.json({ ok: true });
  });
}

makeRoutes('estoque');
makeRoutes('vendas');
makeRoutes('vendasSem');
makeRoutes('caixa');
makeRoutes('investidores');

app.get('/api/export', function(req, res) {
  var filename = 'axios_backup_' + new Date().toISOString().split('T')[0] + '.json';
  res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
  res.json(db);
});

app.get('/api/health', function(req, res) {
  res.json({ ok: true });
});

app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, function() {
  console.log('Axios Sistema rodando na porta ' + PORT);
});
