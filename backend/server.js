const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Conexão com o Banco de Dados usando o nome do serviço no Docker Compose
const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  user: 'fatec_user',
  password: 'fatec_password',
  database: 'todolist',
  port: 5432,
});

// Criar tabela se não existir (SRE mindset: automação de infra)
const initDb = async () => {
  await pool.query('CREATE TABLE IF NOT EXISTS tarefas (id SERIAL PRIMARY KEY, titulo TEXT)');
};
initDb();

app.get('/tarefas', async (req, res) => {
  const result = await pool.query('SELECT * FROM tarefas');
  res.json(result.rows);
});

app.post('/tarefas', async (req, res) => {
  const { titulo } = req.body;
  await pool.query('INSERT INTO tarefas (titulo) VALUES ($1)', [titulo]);
  res.sendStatus(201);
});

app.listen(3000, () => console.log('Backend rodando na porta 3000'));