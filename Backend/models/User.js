// MySQL User model functions
// Usage: pass req.app.locals.db as db

async function findById(db, id) {
  const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0] || null;
}

async function findByUsername(db, username) {
  const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
  return rows[0] || null;
}

async function createUser(db, { username, passwordHash, role = 'user' }) {
  const [result] = await db.query('INSERT INTO users (username, passwordHash, role) VALUES (?, ?, ?)', [username, passwordHash, role]);
  return { id: result.insertId, username, passwordHash, role };
}

async function deleteById(db, id) {
  await db.query('DELETE FROM users WHERE id = ?', [id]);
}

async function updateUsername(db, id, newUsername) {
  await db.query('UPDATE users SET username = ? WHERE id = ?', [newUsername, id]);
}

module.exports = {
  findById,
  findByUsername,
  createUser,
  deleteById,
  updateUsername
};