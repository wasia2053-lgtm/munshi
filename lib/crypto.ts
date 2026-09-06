import crypto from 'crypto'

// Encrypts sensitive values (like WhatsApp access tokens) before they're stored.
// Key lives ONLY in Vercel env vars — never in the database — so a DB-only
// breach (leaked service role key, SQL injection, etc.) doesn't expose tokens.
const ALGORITHM = 'aes-256-gcm'

function getKey(): Buffer {
    const hex = process.env.CREDENTIALS_ENCRYPTION_KEY
    if (!hex || hex.length !== 64) {
        throw new Error('CREDENTIALS_ENCRYPTION_KEY env var missing or not a 64-char hex string')
    }
    return Buffer.from(hex, 'hex')
}

// Returns "iv:authTag:ciphertext" all hex-encoded, as a single string.
export function encrypt(plaintext: string): string {
    const key = getKey()
    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
    const authTag = cipher.getAuthTag()
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
}

export function decrypt(payload: string): string {
    const key = getKey()
    const [ivHex, authTagHex, dataHex] = payload.split(':')
    if (!ivHex || !authTagHex || !dataHex) throw new Error('Malformed encrypted payload')
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'))
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'))
    const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()])
    return decrypted.toString('utf8')
}