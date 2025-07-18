import * as crypto from 'crypto';
export const generateKeyAndIV = (
  secret1: string,
  secret2: string,
): { key: Buffer; iv: Buffer } => {
  // Use both secrets to generate a key and IV (16 bytes for IV, 32 bytes for AES-256 key)
  const combinedSecret = secret1 + secret2; // Combine both secrets
  const key = crypto.createHash('sha256').update(combinedSecret).digest(); // 32-byte AES-256 key
  const iv = crypto
    .createHash('sha256')
    .update(combinedSecret)
    .digest()
    .slice(0, 16); // 16-byte IV
  return { key, iv };
};

// Encrypt the password using the combined secret
export const encryptPassword = (
  password: string,
  secret1: string,
  secret2: string,
): string => {
  if (!password) {
    throw new Error('Password must be a non-empty string');
  }

  const { key, iv } = generateKeyAndIV(secret1, secret2);

  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return encrypted;
};
