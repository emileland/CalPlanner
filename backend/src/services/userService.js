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
    'SELECT username, email, created_at FROM users WHERE username = ?',
    [username],
  );
  if (!rows.length) {
    throw new ApiError(404, 'Utilisateur introuvable');
  }
  return sanitizeUser(rows[0]);
};

const getWithPassword = async (username) => {
  const { rows } = await query(
    'SELECT username, email, password FROM users WHERE username = ?',
    [username],
  );
  return rows[0];
};

const findByEmail = async (email) => {
  const { rows } = await query('SELECT username, email, password FROM users WHERE email = ?', [
    email,
  ]);
  return rows[0];
};

const create = async ({ username, email, password }) => {
  const hashed = await hashPassword(password);
  await query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [
    username,
    email,
    hashed,
  ]);
  return getByUsername(username);
};

const update = async (username, { email, password }) => {
  const fields = [];
  const values = [];

  if (email) {
    fields.push('email = ?');
    values.push(email);
  }
  if (password) {
    const hashed = await hashPassword(password);
    fields.push('password = ?');
    values.push(hashed);
  }

  if (fields.length) {
    values.push(username);
    await query(`UPDATE users SET ${fields.join(', ')} WHERE username = ?`, values);
  }

  return getByUsername(username);
};

const remove = async (username) => {
  await query('DELETE FROM users WHERE username = ?', [username]);
};

module.exports = {
  getByUsername,
  getWithPassword,
  findByEmail,
  create,
  update,
  remove,
};
