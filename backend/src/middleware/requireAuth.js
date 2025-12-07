// src/middlewares/requireAuth.js
import jwt from 'jsonwebtoken';
// import dbDefault from '../models/index.js'; // Remove direct import
// const db = dbDefault; // Remove direct assignment
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

export default async function requireAuth(req, res, next) {
  const db = req.app.locals.db; // Retrieve db from app.locals
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing auth header' });
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Invalid auth header' });
  try {
    const payload = jwt.verify(parts[1], JWT_SECRET);
    // attach user to request
    const user = await db.User.findByPk(payload.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
