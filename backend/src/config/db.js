const { Pool } = require('pg');

const connectionOptions = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.DATABASE_SSL === 'true'
          ? { rejectUnauthorized: false }
          : undefined,
    }
  : {
      host: process.env.PGHOST || 'localhost',
      port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: process.env.PGDATABASE || 'calplanner',
    };

const pool = new Pool(connectionOptions);

const query = (text, params) => pool.query(text, params);

const initDb = async () => {
  await pool.query('SELECT 1');
  console.log('Database connection established');
};

const withTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  query,
  initDb,
  withTransaction,
};
