// MySQL Token model functions
// Usage: pass req.app.locals.db as db

async function createToken(db, { userId, token, expiresAt, invalidated = false }) {
  const [result] = await db.query(
    'INSERT INTO tokens (userId, token, expiresAt, invalidated) VALUES (?, ?, ?, ?)',
    [userId, token, expiresAt, invalidated]
  );
  return { id: result.insertId, userId, token, expiresAt, invalidated };
}

async function findOne(db, where) {
  let query = 'SELECT * FROM tokens WHERE 1=1';
  const params = [];
  for (const key in where) {
    query += ` AND ${key} = ?`;
    params.push(where[key]);
  }
  const [rows] = await db.query(query, params);
  return rows[0] || null;
}

async function findMany(db, where) {
  let query = 'SELECT * FROM tokens WHERE 1=1';
  const params = [];
  for (const key in where) {
    query += ` AND ${key} = ?`;
    params.push(where[key]);
  }
  const [rows] = await db.query(query, params);
  return rows;
}

async function updateMany(db, where, updates) {
  let query = 'UPDATE tokens SET ';
  const setParams = [];
  for (const key in updates) {
    setParams.push(`${key} = ?`);
  }
  query += setParams.join(', ');
  query += ' WHERE 1=1';
  const params = Object.values(updates);
  for (const key in where) {
    query += ` AND ${key} = ?`;
    params.push(where[key]);
  }
  await db.query(query, params);
}

async function deleteMany(db, where) {
  let query = 'DELETE FROM tokens WHERE 1=1';
  const params = [];
  for (const key in where) {
    query += ` AND ${key} = ?`;
    params.push(where[key]);
  }
  await db.query(query, params);
}

async function findById(db, id) {
  const [rows] = await db.query('SELECT * FROM tokens WHERE id = ?', [id]);
  return rows[0] || null;
}

module.exports = {
  createToken,
  findOne,
  findMany,
  updateMany,
  deleteMany,
  findById
};