import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

export type UserProfile = {
  userId: string
  firstName: string | null
  lastName: string | null
  specialisation: string | null
  languageProfile: string | null
  currentMood: string | null
  challenges: string[]
  wellnessGoal: string | null
  onboardingComplete: boolean
  updatedAt: string
}

type ProfilePatch = Partial<Omit<UserProfile, 'userId' | 'updatedAt'>>

const databasePath = process.env.SANESPACE_DATABASE_PATH || path.join(process.cwd(), 'data', 'sanespace.db')
fs.mkdirSync(path.dirname(databasePath), { recursive: true })
const database = new Database(databasePath)

database.exec(`
  CREATE TABLE IF NOT EXISTS user_profiles (
    user_id TEXT PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    specialisation TEXT,
    language_profile TEXT,
    current_mood TEXT,
    challenges_json TEXT NOT NULL DEFAULT '[]',
    wellness_goal TEXT,
    onboarding_complete INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  );
`)

function rowToProfile(row: Record<string, unknown>): UserProfile {
  let challenges: string[] = []
  try {
    const parsed = JSON.parse(String(row.challenges_json ?? '[]'))
    if (Array.isArray(parsed)) challenges = parsed.filter((item): item is string => typeof item === 'string')
  } catch {}

  return {
    userId: String(row.user_id),
    firstName: typeof row.first_name === 'string' ? row.first_name : null,
    lastName: typeof row.last_name === 'string' ? row.last_name : null,
    specialisation: typeof row.specialisation === 'string' ? row.specialisation : null,
    languageProfile: typeof row.language_profile === 'string' ? row.language_profile : null,
    currentMood: typeof row.current_mood === 'string' ? row.current_mood : null,
    challenges,
    wellnessGoal: typeof row.wellness_goal === 'string' ? row.wellness_goal : null,
    onboardingComplete: row.onboarding_complete === 1,
    updatedAt: String(row.updated_at),
  }
}

export function getUserProfile(userId: string): UserProfile | null {
  const row = database.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(userId) as Record<string, unknown> | undefined
  return row ? rowToProfile(row) : null
}

export function updateUserProfile(userId: string, patch: ProfilePatch): UserProfile {
  const current = getUserProfile(userId)
  const next = {
    firstName: patch.firstName ?? current?.firstName ?? null,
    lastName: patch.lastName ?? current?.lastName ?? null,
    specialisation: patch.specialisation ?? current?.specialisation ?? null,
    languageProfile: patch.languageProfile ?? current?.languageProfile ?? null,
    currentMood: patch.currentMood ?? current?.currentMood ?? null,
    challenges: patch.challenges ?? current?.challenges ?? [],
    wellnessGoal: patch.wellnessGoal ?? current?.wellnessGoal ?? null,
    onboardingComplete: patch.onboardingComplete ?? current?.onboardingComplete ?? false,
  }
  const updatedAt = new Date().toISOString()

  database.prepare(`
    INSERT INTO user_profiles (
      user_id, first_name, last_name, specialisation, language_profile,
      current_mood, challenges_json, wellness_goal, onboarding_complete, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      specialisation = excluded.specialisation,
      language_profile = excluded.language_profile,
      current_mood = excluded.current_mood,
      challenges_json = excluded.challenges_json,
      wellness_goal = excluded.wellness_goal,
      onboarding_complete = excluded.onboarding_complete,
      updated_at = excluded.updated_at
  `).run(
    userId,
    next.firstName,
    next.lastName,
    next.specialisation,
    next.languageProfile,
    next.currentMood,
    JSON.stringify(next.challenges),
    next.wellnessGoal,
    next.onboardingComplete ? 1 : 0,
    updatedAt,
  )

  return getUserProfile(userId) as UserProfile
}

export function deleteUserProfile(userId: string) {
  database.prepare('DELETE FROM user_profiles WHERE user_id = ?').run(userId)
}