// src/utils/crypto.js
import crypto from "crypto";

const ALGO = "aes-256-gcm";
const KEY_RAW = process.env.TOKEN_ENCRYPTION_KEY || "";

if (!KEY_RAW || KEY_RAW.length < 32) {
  console.warn("⚠️ TOKEN_ENCRYPTION_KEY is missing or too short. Encryption will be disabled.");
}

function keyBuffer() {
  if (!KEY_RAW) return null;
  let buf = Buffer.from(KEY_RAW, "utf8");
  if (buf.length < 32) {
    const padded = Buffer.alloc(32);
    buf.copy(padded);
    buf = padded;
  } else if (buf.length > 32) {
    buf = buf.slice(0, 32);
  }
  return buf;
}

export function encrypt(plain) {
  const KEY = keyBuffer();
  if (!KEY) return plain;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}.${tag.toString("hex")}.${ciphertext.toString("hex")}`;
}

export function decrypt(payload) {
  const KEY = keyBuffer();
  if (!KEY) return payload;
  if (!payload) return null;
  const parts = payload.split(".");
  if (parts.length !== 3) return payload;
  const [ivHex, tagHex, ctHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const ciphertext = Buffer.from(ctHex, "hex");
  const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
  decipher.setAuthTag(tag);
  const plainBuf = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plainBuf.toString("utf8");
}
