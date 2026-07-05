const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const config = require('../config');

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = '7d';

function createHttpError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    config.jwtSecret,
    { expiresIn: TOKEN_EXPIRY }
  );
}

function formatUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
  };
}

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      throw createHttpError(400, 'Name, email, and password are required');
    }

    if (typeof password !== 'string' || password.length < 8) {
      throw createHttpError(400, 'Password must be at least 8 characters');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name.trim(), email.trim().toLowerCase(), passwordHash]
    );

    const user = result.rows[0];
    const token = signToken(user);

    res.status(201).json({
      success: true,
      token,
      user: formatUser(user),
    });
  } catch (err) {
    if (err.code === '23505') {
      return next(createHttpError(409, 'Email already registered'));
    }
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw createHttpError(400, 'Email and password are required');
    }

    const result = await pool.query(
      `SELECT id, name, email, password_hash, created_at
       FROM users
       WHERE email = $1`,
      [email.trim().toLowerCase()]
    );

    const user = result.rows[0];

    if (!user) {
      throw createHttpError(401, 'Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordValid) {
      throw createHttpError(401, 'Invalid email or password');
    }

    const token = signToken(user);

    res.status(200).json({
      success: true,
      token,
      user: formatUser(user),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login };
