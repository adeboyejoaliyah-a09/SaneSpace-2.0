/**
 * One-off migration helper: copy reminders from the legacy local SQLite file
 * (data/sanespace.db or SANESPACE_DATABASE_PATH) into the hosted Postgres
 * database configured by REMINDER_DATABASE_URL.
 *
 * Usage:
 *   REMINDER_DATABASE_URL=postgres://... npx tsx scripts/migrate-reminders-to-postgres.ts
 *
 * Safe to re-run: existing reminder ids are skipped (ON CONFLICT DO NOTHING).
 * The legacy SQLite file is never modified or deleted.
 */
import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { Pool } from 'pg'

async function main() {
  const connectionString = process.env.REMINDER_DATABASE_URL
  if (!connectionString) {
    console.error('REMINDER_DATABASE_URL is required')
    process.exit(1)
  }

  const sqlitePath = process.env.SANESPACE_DATABASE_PATH || path.join(process.cwd(), 'data', 'sanespace.db')
  if (!fs.existsSync(sqlitePath)) {
    console.log(`No legacy database at ${sqlitePath}; nothing to migrate.`)
    return
  }

  const sqlite = new Database(sqlitePath, { readonly: true })
  const tables = sqlite.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'reminders'`).all()
  if (tables.length === 0) {
    console.log('No reminders table in the legacy database; nothing to migrate.')
    sqlite.close()
    return
  }

  const rows = sqlite.prepare(`SELECT * FROM reminders`).all() as Array<Record<string, unknown>>
  sqlite.close()

  if (rows.length === 0) {
    console.log('Legacy reminders table is empty; nothing to migrate.')
    return
  }

  const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } })
  let migrated = 0
  try {
    for (const row of rows) {
      const result = await pool.query(
        `INSERT INTO reminders (
          id, user_id, title, description, due_at, status, source,
          timezone, recurrence, next_occurrence, last_triggered_at,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
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
      if ((result.rowCount ?? 0) > 0) migrated += 1
    }
    console.log(`Migrated ${migrated} reminder(s) into Postgres (${rows.length} found in SQLite).`)
  } finally {
    await pool.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
