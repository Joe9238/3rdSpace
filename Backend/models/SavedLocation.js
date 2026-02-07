
// MySQL SavedLocation model functions
// Usage: pass req.app.locals.db as db

async function create(db, { userId, name, latitude, longitude }) {
	const [result] = await db.query(
		'INSERT INTO savedLocations (userId, name, latitude, longitude) VALUES (?, ?, ?, ?)',
		[userId, name, latitude, longitude]
	);
	return result.insertId;
}

async function getAllByUser(db, userId) {
	const [rows] = await db.query(
		'SELECT id, name, latitude, longitude, createdAt FROM savedLocations WHERE userId = ?',
		[userId]
	);
	return rows;
}

async function deleteById(db, userId, id) {
	const [result] = await db.query(
		'DELETE FROM savedLocations WHERE id = ? AND userId = ?',
		[id, userId]
	);
	return result.affectedRows > 0;
}

module.exports = {
	create,
	getAllByUser,
	deleteById
};
