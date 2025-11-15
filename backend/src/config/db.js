const mysql = require('mysql2/promise');

const buildConnectionOptions = () => {
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    return {
      host: url.hostname,
      port: url.port ? Number(url.port) : 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.replace('/', ''),
      waitForConnections: true,
      connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
      queueLimit: 0,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      timezone: 'Z',
    };
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'calplanner',
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    queueLimit: 0,
    timezone: 'Z',
  };
};

const pool = mysql.createPool(buildConnectionOptions());

const formatResult = (rows, fields) => {
  if (Array.isArray(rows)) {
    return { rows, fields };
  }
  return {
    rows: [],
    fields,
    insertId: rows.insertId,
    affectedRows: rows.affectedRows,
  };
};

const query = async (text, params = []) => {
  const [rows, fields] = await pool.query(text, params);
  return formatResult(rows, fields);
};

const initDb = async () => {
  await pool.query('SELECT 1');
  console.log('Database connection established');
};

const withTransaction = async (callback) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const client = {
      query: async (text, params = []) => {
        const [rows, fields] = await connection.query(text, params);
        return formatResult(rows, fields);
      },
    };
    const result = await callback(client);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  pool,
  query,
  initDb,
  withTransaction,
};
