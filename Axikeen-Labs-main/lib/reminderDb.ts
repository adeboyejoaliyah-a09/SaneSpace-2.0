import fs from 'fs'
import path from 'path'
import Database from 'better-sqlite3'
import { Pool, type QueryResult, type QueryResultRow } from 'pg'

/**
 * Reminder persistence backend.
 *
 * Two backends share one small SQL-shaped contract so the reminder logic in
 * lib/reminderStore.ts does not care which environment it runs in:
 *
 *   - PostgresBackend  — used when REMINDER_DATABASE_URL / DATABASE_URL /
 *                        POSTGRES_URL is set (production on Vercel: Neon,
 *                        Vercel Postgres, Supabase, any hosted Postgres).
 *   - SqliteBackend    — local development fallback (data/sanespace.db or
 *                        SANESPACE_DATABASE_PATH). Also used as the migration
 *                        source when an existing local database has rows.
 */

const POSTGRES_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'due', 'triggered', 'completed', 'cancelled', 'dismissed')),
    source TEXT NOT NULL DEFAULT 'user_created',
    timezone TEXT NOT NULL DEFAULT 'UTC',
    recurrence TEXT NOT NULL DEFAULT 'none',
    next_occurrence TIMESTAMPTZ,
    last_triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_reminders_user_due_at ON reminders (user_id, due_at);
  CREATE INDEX IF NOT EXISTS idx_reminders_status_due_at ON reminders (status, due_at);
`

const SQLITE_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    source TEXT NOT NULL DEFAULT 'user_created',
    timezone TEXT NOT NULL DEFAULT 'UTC',
    recurrence TEXT NOT NULL DEFAULT 'none',
    next_occurrence TEXT,
    last_triggered_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_reminders_user_due_at ON reminders (user_id, due_at);
  CREATE INDEX IF NOT EXISTS idx_reminders_status_due_at ON reminders (status, due_at);
`

export interface ReminderBackend {
  readonly kind: 'postgres' | 'sqlite'
  query<R extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]): Promise<QueryResult<R>>
  close(): Promise<void>
}

/** Convert the store's `?` placeholders to Postgres `$1, $2, ...` */
export function toPgPlaceholders(text: string): string {
  let index = 0
  return text.replace(/\?/g, () => `$${++index}`)
}

class PostgresBackend implements ReminderBackend {
  readonly kind = 'postgres' as const
  private pool: Pool

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 3,
    })
  }

  async query<R extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []): Promise<QueryResult<R>> {
    return this.pool.query<R>(toPgPlaceholders(text), params)
  }

  async close(): Promise<void> {
    await this.pool.end()
  }
}

class SqliteBackend implements ReminderBackend {
  readonly kind = 'sqlite' as const
  private db: Database.Database

  constructor(databasePath: string) {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true })
    this.db = new Database(databasePath)
    this.ensureSchema()
  }

  private ensureSchema(): void {
    const table = this.db
      .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'reminders'`)
      .all() as Array<{ name: string }>

    if (table.length === 0) {
      this.db.exec(SQLITE_SCHEMA_SQL)
      return
    }

    // Existing database created by the legacy schema (camelCase columns).
    // Add any missing snake_case columns and backfill them so the unified
    // query layer works without destroying existing rows.
    const columns = this.db.prepare(`PRAGMA table_info(reminders)`).all() as Array<{ name: string }>
    const names = new Set(columns.map((c) => c.name))
    const addColumn = (name: string, definition: string) => {
      if (!names.has(name)) this.db.exec(`ALTER TABLE reminders ADD COLUMN ${name} ${definition}`)
    }

    if (names.has('userId') && !names.has('user_id')) {
      this.db.exec(`ALTER TABLE reminders RENAME TO reminders_legacy`)
      this.db.exec(SQLITE_SCHEMA_SQL)
      this.db.exec(`
        INSERT INTO reminders (id, user_id, title, description, due_at, status, source, timezone, recurrence, next_occurrence, last_triggered_at, created_at, updated_at)
        SELECT id, userId, title, description, dueAt, status, source, 'UTC', 'none', NULL, NULL, createdAt, updatedAt
        FROM reminders_legacy
      `)
      this.db.exec(`DROP TABLE reminders_legacy`)
      return
    }

    addColumn('timezone', `TEXT NOT NULL DEFAULT 'UTC'`)
    addColumn('recurrence', `TEXT NOT NULL DEFAULT 'none'`)
    addColumn('next_occurrence', 'TEXT')
    addColumn('last_triggered_at', 'TEXT')
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_reminders_user_due_at ON reminders (user_id, due_at)`)
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_reminders_status_due_at ON reminders (status, due_at)`)
  }

  query<R extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []): Promise<QueryResult<R>> {
    const statement = text.trimStart()
    const isSelect = /^select/i.test(statement)

    if (isSelect) {
      const rows = this.db.prepare(statement).all(...(params as never[])) as R[]
      return Promise.resolve({ rows, rowCount: rows.length } as QueryResult<R>)
    }

    const result = this.db.prepare(statement).run(...(params as never[]))
    return Promise.resolve({ rows: [] as R[], rowCount: result.changes } as QueryResult<R>)
  }

  close(): Promise<void> {
    this.db.close()
    return Promise.resolve()
  }
}

function defaultSqlitePath(): string {
  return process.env.SANESPACE_DATABASE_PATH || path.join(process.cwd(), 'data', 'sanespace.db')
}

function getConnectionString(): string | null {
  return (
    process.env.REMINDER_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    null
  )
}

/**
 * One-time copy of reminder rows from the legacy SQLite file into Postgres.
 * Safe to run repeatedly: existing ids are skipped, so it never duplicates or
 * overwrites Postgres state. The legacy file is left untouched.
 */
async function migrateLegacySqlite(postgres: PostgresBackend, legacyPath: string): Promise<void> {
  if (!fs.existsSync(legacyPath)) return

  let legacy: Database.Database | null = null
  try {
    legacy = new Database(legacyPath, { readonly: true, fileMustExist: true })
    const tables = legacy
      .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'reminders'`)
      .all() as Array<{ name: string }>
    if (tables.length === 0) return

    const rows = legacy.prepare(`SELECT * FROM reminders`).all() as Array<Record<string, unknown>>
    if (rows.length === 0) return

    const { rows: existing } = await postgres.query<{ existing: number }>(`SELECT COUNT(*)::int AS existing FROM reminders`)
    if ((existing[0]?.existing ?? 0) > 0) return

    for (const row of rows) {
      await postgres.query(
        `INSERT INTO reminders (
          id, user_id, title, description, due_at, status, source,
          timezone, recurrence, next_occurrence, last_triggered_at,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO NOTHING`,
        [
          row.id,
          row.userId ?? row.user_id,
          row.title,
          row.description ?? null,
          row.dueAt ?? row.due_at,
          row.status ?? 'pending',
          row.source ?? 'user_created',
          row.timezone ?? 'UTC',
          row.recurrence ?? 'none',
          row.nextOccurrence ?? row.next_occurrence ?? null,
          row.lastTriggeredAt ?? row.last_triggered_at ?? null,
          row.createdAt ?? row.created_at ?? new Date().toISOString(),
          row.updatedAt ?? row.updated_at ?? new Date().toISOString(),
        ]
      )
    }
  } finally {
    legacy?.close()
  }
}

let backendPromise: Promise<ReminderBackend> | null = null

export function getReminderBackend(): Promise<ReminderBackend> {
  if (!backendPromise) {
    backendPromise = (async () => {
      const connectionString = getConnectionString()
      if (!connectionString) {
        return new SqliteBackend(defaultSqlitePath())
      }

      const backend = new PostgresBackend(connectionString)
      await backend.query(POSTGRES_SCHEMA_SQL)
      await migrateLegacySqlite(backend, defaultSqlitePath()).catch(() => {
        // Migration is best-effort: a missing/locked legacy file must never
        // block the production backend from serving requests.
      })
      return backend
    })()
  }
  return backendPromise
}

/** Test helper: reset the memoized backend (e.g. after changing env vars). */
export async function resetReminderBackendForTests(): Promise<void> {
  const current = await backendPromise?.catch(() => null)
  backendPromise = null
  await current?.close().catch(() => undefined)
}
