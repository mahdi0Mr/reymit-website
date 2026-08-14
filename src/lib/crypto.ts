import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// کلید رمزنگاری — باید با SECRET_KEY در برنامه Python (main.py) یکسان باشد.
// با تمام شدن، از متغیر محیطی ENCRYPTION_SECRET استفاده شود.
const KEY = Buffer.from(
  process.env.ENCRYPTION_SECRET || 'MySuperSecretKeyForReymitApp!@#$',
  'utf-8'
);

/**
 * رمزگشایی داده‌های رمزنگاری‌شده با AES-256-CBC (فرمت: base64(IV + ciphertext))
 * که توسط encrypt_data در برنامه Python ساخته می‌شود.
 */
export function decryptAES(encryptedBase64: string): string {
  const fullBuffer = Buffer.from(encryptedBase64, 'base64');
  const iv = fullBuffer.subarray(0, 16);
  const ciphertext = fullBuffer.subarray(16);
  const decipher = createDecipheriv('aes-256-cbc', KEY, iv);
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return decrypted.toString('utf-8');
}

/**
 * رمزگشایی و تبدیل به JSON؛ اگر ارزش null/undefined باشد یا رمزگشایی شکست بخورد null برمی‌گرداند.
 */
export function tryDecrypt<T>(encryptedBase64: string | null | undefined): T | null {
  if (!encryptedBase64) return null;
  try {
    return JSON.parse(decryptAES(encryptedBase64)) as T;
  } catch {
    return null;
  }
}

/**
 * تولید لایسنس با AES-256-CBC (همان فرمت LicenseManager در برنامه Python)
 * فرمت: base64(IV + AES-CBC(machineId|YYYY-MM-DD))
 * کلید: MySuperSecretKeyForReymitApp!@#$
 */
export function generateLicense(machineId: string, expiryDate: Date): string {
  const expiryStr = expiryDate.toISOString().split('T')[0]; // YYYY-MM-DD
  const plaintext = `${machineId}|${expiryStr}`;
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf-8'),
    cipher.final(),
  ]);
  return Buffer.concat([iv, encrypted]).toString('base64');
}
