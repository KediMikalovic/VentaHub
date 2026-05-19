import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
// Kullanıcının .env dosyasındaki key kaç karakter olursa olsun tam 32 byte (256-bit) elde etmek için SHA-256 ile hashliyoruz.
const RAW_KEY = process.env.ENCRYPTION_KEY || 'ventahub-secure-key-fallback';
const ENCRYPTION_KEY_BUFFER = crypto.createHash('sha256').update(RAW_KEY).digest();
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  if (!text) return text;
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY_BUFFER, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Format: iv:authTag:encryptedText
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decrypt(text: string): string {
  if (!text) return text;
  
  const parts = text.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted format. Expected iv:authTag:encryptedText');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encryptedText = parts[2];
  
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY_BUFFER, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
