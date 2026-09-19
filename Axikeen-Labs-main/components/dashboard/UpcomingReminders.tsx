'use client'

import { useEffect, useState } from 'react'
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react'

type Reminder = {
  id: string
  title: string
  description?: string | null
  dueAt: string
  status: 'pending' | 'completed' | 'dismissed' | 'cancelled'
}

export function UpcomingReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [title, setTitle] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadReminders = async () => {
    const response = await fetch('/api/reminders', { cache: 'no-store' })
    if (!response.ok) throw new Error('Unable to load reminders')
    const data = await response.json() as { reminders: Reminder[] }
    setReminders(data.reminders)
  }

  useEffect(() => {
    void loadReminders().catch(() => setError('Reminders are unavailable right now.')).finally(() => setLoading(false))
  }, [])

  const createReminder = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim() || !dueAt) return
    setSaving(true)
    setError('')
    try {
      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, dueAt: new Date(dueAt).toISOString() }),
      })
      if (!response.ok) throw new Error('Unable to create reminder')
      setTitle('')
      setDueAt('')
      await loadReminders()
    } catch {
      setError('Could not create that reminder. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const updateReminder = async (id: string, patch: Partial<Pick<Reminder, 'title' | 'status'>>) => {
    const response = await fetch(`/api/reminders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (!response.ok) throw new Error('Unable to update reminder')
    await loadReminders()
  }

  const deleteReminder = async (id: string) => {
    try {
      const response = await fetch(`/api/reminders/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Unable to delete reminder')
      setReminders((current) => current.filter((reminder) => reminder.id !== id))
    } catch {
      setError('Could not delete that reminder. Please try again.')
    }
  }

  const saveTitle = async (id: string) => {
    if (!editingTitle.trim()) return
    try {
      await updateReminder(id, { title: editingTitle.trim() })
      setEditingId(null)
    } catch {
      setError('Could not update that reminder. Please try again.')
    }
  }

  return (
    <section className="relative z-10 mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Upcoming</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Keep the things that matter in view.</p>
      </div>
      <form onSubmit={createReminder} className="mb-5 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <label className="sr-only" htmlFor="reminder-title">Reminder title</label>
        <input id="reminder-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Add a reminder" maxLength={200} className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800" />
        <label className="sr-only" htmlFor="reminder-due">Reminder time</label>
        <input id="reminder-due" type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800" />
        <button type="submit" disabled={saving || !title.trim() || !dueAt} className="inline-flex items-center justify-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white disabled:opacity-50" title="Add reminder"><Plus size={16} aria-hidden="true" /> Add</button>
      </form>
      {error && <p className="mb-3 text-sm text-red-600" role="alert">{error}</p>}
      {loading ? <p className="text-sm text-slate-500">Loading reminders...</p> : reminders.length === 0 ? <p className="text-sm text-slate-600 dark:text-slate-400">Nothing scheduled yet.</p> : (
        <ul className="space-y-3">
          {reminders.map((reminder) => {
            const active = reminder.status !== 'cancelled'
            return <li key={reminder.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-start justify-between gap-3">
                {editingId === reminder.id ? <input autoFocus value={editingTitle} onChange={(event) => setEditingTitle(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void saveTitle(reminder.id); if (event.key === 'Escape') setEditingId(null) }} className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-700" /> : <div><p className={`font-medium ${active ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 line-through'}`}>{reminder.title}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{new Date(reminder.dueAt).toLocaleString()}</p></div>}
                <div className="flex shrink-0 gap-1">
                  {editingId === reminder.id ? <button type="button" onClick={() => void saveTitle(reminder.id)} className="rounded p-1 text-primary" title="Save reminder title"><Check size={16} aria-hidden="true" /></button> : <button type="button" onClick={() => { setEditingId(reminder.id); setEditingTitle(reminder.title) }} className="rounded p-1 text-slate-500" title="Edit reminder"><Pencil size={16} aria-hidden="true" /></button>}
                  <button type="button" onClick={() => void updateReminder(reminder.id, { status: active ? 'cancelled' : 'pending' }).catch(() => setError('Could not change that reminder. Please try again.'))} className="rounded p-1 text-slate-500" title={active ? 'Disable reminder' : 'Enable reminder'}>{active ? <X size={16} aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}</button>
                  <button type="button" onClick={() => void deleteReminder(reminder.id)} className="rounded p-1 text-red-500" title="Delete reminder"><Trash2 size={16} aria-hidden="true" /></button>
                </div>
              </div>
            </li>
          })}
        </ul>
      )}
    </section>
  )
}