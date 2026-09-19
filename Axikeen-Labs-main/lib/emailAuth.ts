import crypto from 'crypto'
import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

const databasePath = process.env.SANESPACE_DATABASE_PATH || path.join(process.cwd(), 'data', 'sanespace.db')
fs.mkdirSync(path.dirname(databasePath), { recursive: true })
const database = new Database(databasePath)

function addMissingColumns(tableName: string, definitions: Array<{ name: string; sql: string }>) {
  const columns = database.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>
  const existing = new Set(columns.map((item) => item.name))

  for (const definition of definitions) {
    if (!existing.has(definition.name)) {
      database.exec(`ALTER TABLE ${tableName} ADD COLUMN ${definition.name} ${definition.sql}`)
    }
  }
}

export function ensureEmailAuthSchema() {
  database.exec(`
    CREATE TABLE IF NOT EXISTS email_auth_users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      email_verified INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      last_login_at TEXT,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS email_otp_codes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      purpose TEXT NOT NULL,
      otp_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      attempts_left INTEGER NOT NULL DEFAULT 5,
      used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      cooldown_until TEXT NOT NULL DEFAULT '1970-01-01T00:00:00.000Z',
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_email_auth_users_email ON email_auth_users(email);
    CREATE INDEX IF NOT EXISTS idx_email_otp_codes_user_purpose ON email_otp_codes(user_id, purpose, created_at);
  `)

  addMissingColumns('email_auth_users', [
    { name: 'email', sql: 'TEXT NOT NULL DEFAULT ""' },
    { name: 'password_hash', sql: 'TEXT NOT NULL DEFAULT ""' },
    { name: 'display_name', sql: 'TEXT' },
    { name: 'email_verified', sql: 'INTEGER NOT NULL DEFAULT 0' },
    { name: 'created_at', sql: 'TEXT NOT NULL DEFAULT "1970-01-01T00:00:00.000Z"' },
    { name: 'last_login_at', sql: 'TEXT' },
    { name: 'updated_at', sql: 'TEXT NOT NULL DEFAULT "1970-01-01T00:00:00.000Z"' },
  ])

  addMissingColumns('email_otp_codes', [
    { name: 'user_id', sql: 'TEXT NOT NULL DEFAULT ""' },
    { name: 'purpose', sql: 'TEXT NOT NULL DEFAULT "email_verification"' },
    { name: 'otp_hash', sql: 'TEXT NOT NULL DEFAULT ""' },
    { name: 'expires_at', sql: 'TEXT NOT NULL DEFAULT "1970-01-01T00:00:00.000Z"' },
    { name: 'attempts_left', sql: 'INTEGER NOT NULL DEFAULT 5' },
    { name: 'used', sql: 'INTEGER NOT NULL DEFAULT 0' },
    { name: 'created_at', sql: 'TEXT NOT NULL DEFAULT "1970-01-01T00:00:00.000Z"' },
    { name: 'cooldown_until', sql: 'TEXT NOT NULL DEFAULT "1970-01-01T00:00:00.000Z"' },
    { name: 'updated_at', sql: 'TEXT NOT NULL DEFAULT "1970-01-01T00:00:00.000Z"' },
  ])
}

ensureEmailAuthSchema()

export type EmailAuthUser = {
  id: string
  email: string
  displayName: string | null
  emailVerified: boolean
  passwordHash: string
  createdAt: string
  lastLoginAt: string | null
  updatedAt: string
}

function hashSha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex')
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function validatePassword(password: string): string | null {
  const trimmed = password.trim()
  if (trimmed.length < 8) return 'Password must be at least 8 characters.'
  if (!/[A-Za-z]/.test(trimmed) || !/\d/.test(trimmed)) return 'Password must include letters and numbers.'
  return null
}

export function createPasswordHash(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

export function getEmailUserByEmail(email: string): EmailAuthUser | null {
  ensureEmailAuthSchema()
  const row = database.prepare('SELECT * FROM email_auth_users WHERE email = ?').get(normalizeEmail(email)) as Record<string, unknown> | undefined
  if (!row) return null

  return {
    id: String(row.id),
    email: String(row.email),
    displayName: typeof row.display_name === 'string' ? row.display_name : null,
    emailVerified: row.email_verified === 1,
    passwordHash: String(row.password_hash),
    createdAt: String(row.created_at),
    lastLoginAt: typeof row.last_login_at === 'string' ? row.last_login_at : null,
    updatedAt: String(row.updated_at),
  }
}

export function getEmailUserById(userId: string): EmailAuthUser | null {
  ensureEmailAuthSchema()
  const row = database.prepare('SELECT * FROM email_auth_users WHERE id = ?').get(userId) as Record<string, unknown> | undefined
  if (!row) return null

  return {
    id: String(row.id),
    email: String(row.email),
    displayName: typeof row.display_name === 'string' ? row.display_name : null,
    emailVerified: row.email_verified === 1,
    passwordHash: String(row.password_hash),
    createdAt: String(row.created_at),
    lastLoginAt: typeof row.last_login_at === 'string' ? row.last_login_at : null,
    updatedAt: String(row.updated_at),
  }
}

export function createEmailUser(input: { email: string; password: string; displayName?: string | null }): EmailAuthUser {
  ensureEmailAuthSchema()
  const email = normalizeEmail(input.email)
  if (!isValidEmail(email)) throw new Error('Invalid email address.')

  const passwordError = validatePassword(input.password)
  if (passwordError) throw new Error(passwordError)

  if (getEmailUserByEmail(email)) throw new Error('An account with this email already exists.')

  const now = new Date().toISOString()
  const userId = crypto.randomUUID()
  const passwordHash = createPasswordHash(input.password)

  database.prepare(`
    INSERT INTO email_auth_users (
      id, email, password_hash, display_name, email_verified, created_at, last_login_at, updated_at
    ) VALUES (?, ?, ?, ?, 0, ?, NULL, ?)
  `).run(userId, email, passwordHash, input.displayName?.trim() || null, now, now)

  return getEmailUserById(userId) as EmailAuthUser
}

export function verifyPassword(email: string, password: string): EmailAuthUser | null {
  ensureEmailAuthSchema()
  const user = getEmailUserByEmail(email)
  if (!user) return null
  if (createPasswordHash(password) !== user.passwordHash) return null

  database.prepare('UPDATE email_auth_users SET last_login_at = ?, updated_at = ? WHERE id = ?').run(new Date().toISOString(), new Date().toISOString(), user.id)
  return getEmailUserById(user.id)
}

export function markEmailVerified(userId: string): EmailAuthUser | null {
  database.prepare('UPDATE email_auth_users SET email_verified = 1, updated_at = ? WHERE id = ?').run(new Date().toISOString(), userId)
  return getEmailUserById(userId)
}

export function generateOtpCode(): string {
  return crypto.randomInt(100000, 999999).toString()
}

export function createOtpCodeForUser(userId: string, purpose: 'email_verification' | 'password_reset' = 'email_verification'): { code: string; hash: string; expiresAt: string; cooldownUntil: string } {
  ensureEmailAuthSchema()
  const code = generateOtpCode()
  const expiresAt = new Date(Date.now() + 1000 * 60 * 10).toISOString()
  const cooldownUntil = new Date(Date.now() + 1000 * 45).toISOString()
  const hash = hashSha256(code)

  database.prepare(`
    INSERT INTO email_otp_codes (id, user_id, purpose, otp_hash, expires_at, attempts_left, used, created_at, cooldown_until, updated_at)
    VALUES (?, ?, ?, ?, ?, 5, 0, ?, ?, ?)
  `).run(crypto.randomUUID(), userId, purpose, hash, expiresAt, new Date().toISOString(), cooldownUntil, new Date().toISOString())

  return { code, hash, expiresAt, cooldownUntil }
}

export function getLatestOtpForUser(userId: string, purpose: 'email_verification' | 'password_reset' = 'email_verification'):
  | { id: string; userId: string; otpHash: string; expiresAt: string; attemptsLeft: number; used: number; cooldownUntil: string; createdAt: string }
  | null {
  ensureEmailAuthSchema()
  const row = database.prepare(`
    SELECT * FROM email_otp_codes WHERE user_id = ? AND purpose = ? ORDER BY created_at DESC LIMIT 1
  `).get(userId, purpose) as Record<string, unknown> | undefined

  if (!row) return null

  return {
    id: String(row.id),
    userId: String(row.user_id),
    otpHash: String(row.otp_hash),
    expiresAt: String(row.expires_at),
    attemptsLeft: Number(row.attempts_left ?? 0),
    used: Number(row.used ?? 0),
    cooldownUntil: String(row.cooldown_until ?? '1970-01-01T00:00:00.000Z'),
    createdAt: String(row.created_at),
  }
}

export function invalidatePreviousOtpsForUser(userId: string, purpose: 'email_verification' | 'password_reset' = 'email_verification') {
  ensureEmailAuthSchema()
  database.prepare('UPDATE email_otp_codes SET used = 1, updated_at = ? WHERE user_id = ? AND purpose = ? AND used = 0').run(new Date().toISOString(), userId, purpose)
}

export function verifyOtpForUser(userId: string, code: string, purpose: 'email_verification' | 'password_reset' = 'email_verification'): { ok: boolean; reason?: 'invalid' | 'expired' | 'attempts_exhausted' | 'used' } {
  ensureEmailAuthSchema()
  const current = getLatestOtpForUser(userId, purpose)
  if (!current) return { ok: false, reason: 'invalid' }
  if (current.used === 1) return { ok: false, reason: 'used' }
  if (Date.now() > new Date(current.expiresAt).getTime()) return { ok: false, reason: 'expired' }

  const inputHash = hashSha256(code)
  if (inputHash !== current.otpHash) {
    const attemptsLeft = Math.max(0, current.attemptsLeft - 1)
    database.prepare('UPDATE email_otp_codes SET attempts_left = ?, updated_at = ? WHERE id = ?').run(attemptsLeft, new Date().toISOString(), current.id)
    if (attemptsLeft <= 0) {
      database.prepare('UPDATE email_otp_codes SET used = 1, updated_at = ? WHERE id = ?').run(new Date().toISOString(), current.id)
      return { ok: false, reason: 'attempts_exhausted' }
    }
    return { ok: false, reason: 'invalid' }
  }

  database.prepare('UPDATE email_otp_codes SET used = 1, attempts_left = 0, updated_at = ? WHERE id = ?').run(new Date().toISOString(), current.id)
  return { ok: true }
}

export function canRequestOtp(userId: string, purpose: 'email_verification' | 'password_reset' = 'email_verification'): boolean {
  ensureEmailAuthSchema()
  const current = getLatestOtpForUser(userId, purpose)
  if (!current) return true
  return Date.now() >= new Date(current.cooldownUntil).getTime()
}

export function getUserOtpCooldownRemainingSeconds(userId: string, purpose: 'email_verification' | 'password_reset' = 'email_verification'): number {
  ensureEmailAuthSchema()
  const current = getLatestOtpForUser(userId, purpose)
  if (!current) return 0
  return Math.max(0, Math.ceil((new Date(current.cooldownUntil).getTime() - Date.now()) / 1000))
}

export function upsertPasswordResetUser(userId: string, newPassword: string): EmailAuthUser | null {
  ensureEmailAuthSchema()
  const passwordError = validatePassword(newPassword)
  if (passwordError) throw new Error(passwordError)

  const user = getEmailUserById(userId)
  if (!user) return null

  database.prepare('UPDATE email_auth_users SET password_hash = ?, updated_at = ? WHERE id = ?').run(createPasswordHash(newPassword), new Date().toISOString(), userId)
  return getEmailUserById(userId)
}
