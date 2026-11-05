import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { jwtSecret } from './config.js';

const SCRYPT_KEY_LENGTH = 64;
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 hari

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password, stored) {
  if (typeof stored !== 'string') return false;
  const [scheme, salt, hash] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const actual = scryptSync(password, salt, SCRYPT_KEY_LENGTH);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

const encode = (value) => Buffer.from(value).toString('base64url');

function signature(data) {
  return createHmac('sha256', jwtSecret).update(data).digest();
}

export function signToken(user) {
  const now = Math.floor(Date.now() / 1000);
  const header = encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = encode(
    JSON.stringify({ sub: user.id, email: user.email, iat: now, exp: now + TOKEN_TTL_SECONDS })
  );
  const data = `${header}.${payload}`;
  return `${data}.${signature(data).toString('base64url')}`;
}

export function verifyToken(token) {
  if (typeof token !== 'string') throw new Error('Token tidak valid.');
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Token tidak valid.');
  const [header, payload, provided] = parts;
  const expected = signature(`${header}.${payload}`);
  const actual = Buffer.from(provided, 'base64url');
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new Error('Token tidak valid.');
  }
  const body = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  if (!body?.sub || !body?.exp || body.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token kedaluwarsa.');
  }
  return body;
}
