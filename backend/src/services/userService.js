const ApiError = require('../utils/ApiError');
const { query } = require('../config/db');
const { hashPassword } = require('../utils/password');

const sanitizeUser = (row) => ({
  username: row.username,
  email: row.email,
  created_at: row.created_at,
});

const getByUsername = async (username) => {
  const { rows } = await query(
    'SELECT username, email, created_at FROM users WHERE username = $1',
    [username],
  );
  if (!rows.length) {
    throw new ApiError(404, 'Utilisateur introuvable');
  }
  return sanitizeUser(rows[0]);
};

const getWithPassword = async (username) => {
  const { rows } = await query(
    'SELECT username, email, password FROM users WHERE username = $1',
    [username],
  );
  return rows[0];
};

const findByEmail = async (email) => {
  const { rows } = await query(
    'SELECT username, email, password FROM users WHERE email = $1',
    [email],
  );
  return rows[0];
};

const create = async ({ username, email, password }) => {
  const hashed = await hashPassword(password);
  const { rows } = await query(
    `INSERT INTO users (username, email, password)
     VALUES ($1, $2, $3)
     RETURNING username, email, created_at`,
    [username, email, hashed],
  );
  return sanitizeUser(rows[0]);
};

const update = async (username, { email, password }) => {
  const fields = [];
  const values = [];
  let index = 1;

  if (email) {
    fields.push(`email = $${index}`);
    values.push(email);
    index += 1;
  }
  if (password) {
    const hashed = await hashPassword(password);
    fields.push(`password = $${index}`);
    values.push(hashed);
    index += 1;
  }

  if (!fields.length) {
    return getByUsername(username);
  }

  values.push(username);

  const { rows } = await query(
    `UPDATE users SET ${fields.join(', ')}
     WHERE username = $${index}
     RETURNING username, email, created_at`,
    values,
  );

  return sanitizeUser(rows[0]);
};

const remove = async (username) => {
  await query('DELETE FROM users WHERE username = $1', [username]);
};

module.exports = {
  getByUsername,
  getWithPassword,
  findByEmail,
  create,
  update,
  remove,
};
