// utils/crypto.ts
// Wrapper simple para cifrado/descifrado AES‑GCM 256‑bits usando la API Web Crypto.
// Utilizado por storageAdapter cuando ENABLE_ENCRYPTION está activado.

const ENC_ALGO = { name: "AES-GCM", length: 256 } as const;
const IV_LENGTH = 12; // 96‑bit IV recomendado para GCM

// Passphrase estática codificada en base64 (para demo). En producción usaría una clave segura.
const PASSPHRASE = "c2VjcmV0X3Bhc3NwaHJhc2U="; // "secret_passphrase"

function getKey(): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(PASSPHRASE), c => c.charCodeAt(0));
  return crypto.subtle.importKey("raw", raw, ENC_ALGO, false, ["encrypt", "decrypt"]);
}

export async function encryptData(plainText: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);
  const cipher = await crypto.subtle.encrypt({ ...ENC_ALGO, iv }, key, data);
  const combined = new Uint8Array(iv.byteLength + cipher.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipher), iv.byteLength);
  return btoa(String.fromCharCode(...combined));
}

export async function decryptData(cipherText: string): Promise<string> {
  const key = await getKey();
  const combined = Uint8Array.from(atob(cipherText), c => c.charCodeAt(0));
  const iv = combined.slice(0, IV_LENGTH);
  const data = combined.slice(IV_LENGTH);
  const plain = await crypto.subtle.decrypt({ ...ENC_ALGO, iv }, key, data);
  const decoder = new TextDecoder();
  return decoder.decode(plain);
}
