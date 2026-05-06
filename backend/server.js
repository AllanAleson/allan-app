const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'fatec_user',
  password: process.env.DB_PASSWORD || 'fatec_password',
  database: process.env.DB_NAME || 'todolist',
  port: Number(process.env.DB_PORT || 5432),
});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function initDb(retries = 10) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS tarefas (
          id SERIAL PRIMARY KEY,
          titulo TEXT NOT NULL
        )
      `);
      console.log('Banco inicializado com sucesso');
      return;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      console.error(`Falha ao conectar no banco (tentativa ${attempt}/${retries})`);
      await wait(3000);
    }
  }
}

app.get('/tarefas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tarefas ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar tarefas', error);
    res.status(500).json({ error: 'Erro ao listar tarefas' });
  }
});

app.post('/tarefas', async (req, res) => {
  const titulo = req.body?.titulo?.trim();

  if (!titulo) {
    return res.status(400).json({ error: 'O titulo da tarefa e obrigatorio' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO tarefas (titulo) VALUES ($1) RETURNING id, titulo',
      [titulo]
    );
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar tarefa', error);
    return res.status(500).json({ error: 'Erro ao criar tarefa' });
  }
});

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ status: 'error' });
  }
});

async function start() {
  try {
    await initDb();
    app.listen(3000, () => console.log('Backend rodando na porta 3000'));
  } catch (error) {
    console.error('Nao foi possivel iniciar a API', error);
    process.exit(1);
  }
}

start();
