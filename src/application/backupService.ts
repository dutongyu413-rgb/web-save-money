import type { AppSnapshot } from "../domain/models";
import { backupEnvelopeSchema, snapshotSchema } from "../domain/validation";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

async function deriveKey(password: string, salt: BufferSource, usage: KeyUsage[]) {
  const material = await crypto.subtle.importKey("raw", textEncoder.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 210000, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    usage,
  );
}

export async function encryptSnapshot(snapshot: AppSnapshot, password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt, ["encrypt"]);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    textEncoder.encode(JSON.stringify(snapshot)),
  );
  return {
    format: "reverse-accounting-backup" as const,
    version: 1 as const,
    exportedAt: new Date().toISOString(),
    kdf: {
      name: "PBKDF2" as const,
      hash: "SHA-256" as const,
      iterations: 210000 as const,
      salt: toBase64(salt),
    },
    cipher: {
      name: "AES-GCM" as const,
      iv: toBase64(iv),
      ciphertext: toBase64(new Uint8Array(ciphertext)),
    },
  };
}

export async function decryptBackup(value: unknown, password: string): Promise<AppSnapshot> {
  const envelope = backupEnvelopeSchema.parse(value);
  const salt = fromBase64(envelope.kdf.salt);
  const iv = fromBase64(envelope.cipher.iv);
  const ciphertext = fromBase64(envelope.cipher.ciphertext);
  const key = await deriveKey(password, salt, ["decrypt"]);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return snapshotSchema.parse(JSON.parse(textDecoder.decode(plaintext)));
}

export function backupFilename(date = new Date()): string {
  const local = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return `反向记账-${local}.backup`;
}

export function downloadBackup(envelope: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(envelope)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
