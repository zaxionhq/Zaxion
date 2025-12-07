// src/utils/generateState.js
import crypto from 'crypto';

export default function generateState(len = 16) {
  return crypto.randomBytes(len).toString('hex');
}
