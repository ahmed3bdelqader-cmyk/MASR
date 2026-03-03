import crypto from 'crypto';

// Use a 32-byte key for aes-256-cbc. Fallback to a hardcoded secure string for easy local dev without crashing,
// but in production, this should ideally come from an environment variable.
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'STAND_EG_SMART_ENTRY_SECRET_KEY!'; // Must be 32 bytes
const IV_LENGTH = 16; // For AES, this is always 16

function getSecretKey() {
    // Ensure the key is exactly 32 bytes long for aes-256-cbc
    return crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest('base64').substring(0, 32);
}

export function encrypt(text: string): string {
    if (!text) return text;
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(getSecretKey()), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
    if (!text) return text;
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift() as string, 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(getSecretKey()), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        console.error("Decryption failed:", error);
        return ""; // Return empty if decryption fails to prevent crashes
    }
}
