const crypto = require("crypto");

const algorithm = "aes-256-cbc";

// Generate a proper 32-byte key from the environment variable
const key = crypto
  .createHash("sha256")
  .update(String(process.env.ENCRYPTION_KEY))
  .digest(); // This returns a Buffer of exactly 32 bytes

function encrypt(text) {
  if (text === null || text === undefined) {
    throw new Error("Cannot encrypt null or undefined value");
  }

  const textToEncrypt =
    typeof text === "object" ? JSON.stringify(text) : String(text);

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(textToEncrypt, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Return single string (JSON encoded)
  return JSON.stringify({ iv: iv.toString("hex"), data: encrypted });
}

function decrypt(encryptedString) {
  const encrypted =
    typeof encryptedString === "string"
      ? JSON.parse(encryptedString)
      : encryptedString;

  const decipher = crypto.createDecipheriv(
    algorithm,
    key,
    Buffer.from(encrypted.iv, "hex")
  );
  let decrypted = decipher.update(encrypted.data, "hex", "utf8");
  decrypted += decipher.final("utf8");

  try {
    return JSON.parse(decrypted);
  } catch (error) {
    return decrypted;
  }
}

module.exports = { encrypt, decrypt };
