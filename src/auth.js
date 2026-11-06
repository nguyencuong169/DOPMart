'use strict';

const crypto = require('node:crypto');

const KEY_LENGTH = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1 };

/**
 * Băm mật khẩu theo chuẩn scrypt của Node.js.
 * Chuỗi lưu trữ có dạng: scrypt$<salt hex>$<hash hex>
 */
function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(password), salt, KEY_LENGTH, SCRYPT_OPTIONS);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

function verifyPassword(password, stored) {
  if (typeof stored !== 'string') return false;
  const [scheme, saltHex, hashHex] = stored.split('$');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = crypto.scryptSync(String(password), Buffer.from(saltHex, 'hex'), expected.length, SCRYPT_OPTIONS);
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

function passwordProblem(password) {
  const value = String(password || '');
  if (value.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự';
  if (value.length > 128) return 'Mật khẩu quá dài';
  return null;
}

module.exports = { hashPassword, verifyPassword, randomToken, passwordProblem };
