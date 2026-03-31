import * as crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

// 환경변수에서 암호화 키를 가져옴 (32바이트 hex)
function getEncryptionKey(): Buffer {
  const key = process.env.UPBIT_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("UPBIT_ENCRYPTION_KEY 환경변수가 설정되지 않았습니다.");
  }
  return Buffer.from(key, "hex");
}

// AES-256-GCM 암호화
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag();

  // iv:tag:encrypted 형태로 반환
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
}

// AES-256-GCM 복호화
export function decrypt(encryptedText: string): string {
  const key = getEncryptionKey();
  const parts = encryptedText.split(":");

  if (parts.length !== 3) {
    throw new Error("잘못된 암호화 데이터 형식입니다.");
  }

  const iv = Buffer.from(parts[0], "hex");
  const tag = Buffer.from(parts[1], "hex");
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
