'use client'

import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  BookOpenText,
  CalendarDays,
  Clock3,
  NotebookPen,
  PencilLine,
  Plus,
  Save,
  Search,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import { useSaneUser } from '@/hooks/useSaneUser'

type JournalEntry = {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

type ViewState = 'list' | 'detail' | 'editor'

type JournalDraft = {
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = 'sane_journal_entries'

function formatDate(iso: string) {
  const value = new Date(iso)
  return value.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDateTime(iso: string) {
  const value = new Date(iso)
  return value.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function getSnippet(content: string, max = 140) {
  const text = content.replace(/\s+/g, ' ').trim()
  if (text.length <= max) return text
  return `${text.slice(0, max).trim()}…`
}

export default function JournalPage() {
  const { user } = useSaneUser()

  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [view, setView] = useState<ViewState>('list')
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState<JournalDraft>({
    title: '',
    content: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as JournalEntry[]
        if (Array.isArray(parsed)) {
          setEntries(parsed)
          if (parsed[0]) setSelectedId(parsed[0].id)
        }
      }
    } catch {
      setError('Journal entries are not available in this browser yet.')
    } finally {
      const timer = window.setTimeout(() => setIsLoading(false), 250)
      return () => window.clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (!entries.length) {
      setSelectedId(null)
      return
    }
    if (!selectedId || !entries.some((entry) => entry.id === selectedId)) {
      setSelectedId(entries[0].id)
    }
  }, [entries, selectedId])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
    } catch {
      setError('Your journal is currently running in browser-only mode and cannot be stored on a server yet.')
    }
  }, [entries])

  const filteredEntries = useMemo(() => {
    if (!search.trim()) return entries
    const q = search.toLowerCase()
    return entries.filter((entry) => (
      entry.title.toLowerCase().includes(q) ||
      entry.content.toLowerCase().includes(q)
    ))
  }, [entries, search])

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.id === selectedId) ?? null,
    [entries, selectedId],
  )

  const startNewEntry = () => {
    setDraft({
      title: '',
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    setView('editor')
  }

  const openEntry = (id: string) => {
    setSelectedId(id)
    setView('detail')
  }

  const beginEdit = () => {
    if (!selectedEntry) return
    setDraft({
      title: selectedEntry.title,
      content: selectedEntry.content,
      createdAt: selectedEntry.createdAt,
      updatedAt: selectedEntry.updatedAt,
    })
    setView('editor')
  }

  const deleteEntry = (id: string) => {
    setEntries((current) => current.filter((entry) => entry.id !== id))
    setView('list')
    setSelectedId(null)
  }

  const saveEntry = () => {
    const title = draft.title.trim() || 'Untitled note'
    const content = draft.content.trim()

    if (!content) {
      setError('Add a little writing before saving your journal entry.')
      return
    }

    const now = new Date().toISOString()

    if (selectedEntry && view === 'editor' && selectedEntry.id === selectedId) {
      const updated = entries.map((entry) => entry.id === selectedEntry.id
        ? { ...entry, title, content, updatedAt: now }
        : entry)
      setEntries(updated)
      const updatedId = selectedEntry.id
      setSelectedId(updatedId)
      setView('detail')
      return
    }

    const nextEntry: JournalEntry = {
      id: crypto.randomUUID(),
      title,
      content,
      createdAt: now,
      updatedAt: now,
    }

    setEntries((current) => [nextEntry, ...current])
    setSelectedId(nextEntry.id)
    setView('detail')
    setError('')
  }

  const backToJournal = () => {
    setView('list')
    setError('')
  }

  const userName = user?.firstName || 'friend'

  return (
    <div className="flex min-h-screen bg-[#070708] text-[#F5F5F7]">
      <Sidebar userName={userName} />

      <main className="flex-1 md:ml-72 min-h-screen pb-20 md:pb-8">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 lg:px-10">
          <motion.header
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex flex-col gap-4 rounded-[24px] border border-border bg-[#0D0D12] p-4 md:flex-row md:items-center md:justify-between md:p-5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300 ring-1 ring-violet-500/20">
                <BookOpenText size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A7A7B3]">Private space</p>
                <h1 className="mt-1 text-2xl font-bold tracking-[-0.05em] text-[#F5F5F7]">Journal</h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-[#111118] px-3 py-2 text-sm font-medium text-[#F5F5F7] transition hover:border-violet-500/30 hover:text-violet-300"
              >
                <ArrowLeft size={16} />
                Back to chat
              </Link>
              <button
                type="button"
                onClick={startNewEntry}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3.5 py-2 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(124,58,237,0.28)] transition hover:bg-violet-500"
              >
                <Plus size={16} />
                New entry
              </button>
            </div>
          </motion.header>

          {error && (
            <div className="mb-5 rounded-2xl border border-violet-500/25 bg-violet-500/10 px-4 py-3 text-sm text-violet-100">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="rounded-[24px] border border-border bg-[#0D0D12] p-6 text-[#A7A7B3]">
              Loading your journal…
            </div>
          ) : view === 'list' ? (
            <div className="grid gap-6 lg:grid-cols-[1.1fr_1.9fr]">
              <aside className="rounded-[24px] border border-border bg-[#0D0D12] p-4">
                <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-[#111118] px-3 py-2.5">
                  <Search size={16} className="text-[#A7A7B3]" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search entries"
                    className="w-full bg-transparent text-sm text-[#F5F5F7] placeholder:text-[#A7A7B3] focus:outline-none"
                  />
                </div>

                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#A7A7B3]">Entries</h2>
                  <span className="rounded-full border border-border bg-[#111118] px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-[#A7A7B3]">
                    {filteredEntries.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {filteredEntries.length === 0 ? (
                    <div className="rounded-[20px] border border-dashed border-border bg-[#111118] p-5 text-sm text-[#A7A7B3]">
                      <p className="mb-3 font-medium text-[#F5F5F7]">No entries yet</p>
                      <p>Write down a thought, idea, plan, or memory in your private SaneSpace journal.</p>
                    </div>
                  ) : (
                    filteredEntries.map((entry) => (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => openEntry(entry.id)}
                        className={`w-full rounded-[20px] border p-3 text-left transition ${
                          selectedId === entry.id
                            ? 'border-violet-500/30 bg-violet-500/10'
                            : 'border-border bg-[#111118] hover:border-violet-500/20'
                        }`}
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-[#F5F5F7]">{entry.title}</p>
                          <span className="text-[10px] uppercase tracking-[0.14em] text-[#A7A7B3]">{formatDate(entry.updatedAt)}</span>
                        </div>
                        <p className="line-clamp-3 text-sm leading-relaxed text-[#A7A7B3]">
                          {getSnippet(entry.content)}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </aside>

              <div className="rounded-[24px] border border-border bg-[#0D0D12] p-4 md:p-5">
                {selectedEntry ? (
                  <div className="flex h-full flex-col">
                    <div className="mb-5 flex items-start justify-between gap-3 border-b border-border pb-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A7A7B3]">Latest entry</p>
                        <h2 className="mt-2 text-2xl font-bold tracking-[-0.05em] text-[#F5F5F7]">{selectedEntry.title}</h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => beginEdit()}
                        className="inline-flex items-center gap-2 rounded-xl border border-border bg-[#111118] px-3 py-2 text-sm font-medium text-[#F5F5F7] transition hover:border-violet-500/30 hover:text-violet-300"
                      >
                        <PencilLine size={15} />
                        Edit
                      </button>
                    </div>

                    <div className="mb-5 flex flex-wrap gap-3 text-sm text-[#A7A7B3]">
                      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-[#111118] px-2.5 py-1.5">
                        <CalendarDays size={14} />
                        {formatDate(selectedEntry.createdAt)}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-[#111118] px-2.5 py-1.5">
                        <Clock3 size={14} />
                        {formatDateTime(selectedEntry.updatedAt)}
                      </span>
                    </div>

                    <div className="prose prose-invert max-w-none flex-1 whitespace-pre-wrap rounded-[20px] border border-border bg-[#111118] p-4 text-[15px] leading-7 text-[#F5F5F7]">
                      {selectedEntry.content}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => beginEdit()}
                        className="inline-flex items-center gap-2 rounded-xl border border-border bg-[#111118] px-3.5 py-2.5 text-sm font-medium text-[#F5F5F7] transition hover:border-violet-500/30 hover:text-violet-300"
                      >
                        <PencilLine size={16} />
                        Edit entry
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteEntry(selectedEntry.id)}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-3.5 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/15"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full min-h-[360px] flex-col items-center justify-center text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] border border-border bg-[#111118] text-violet-300">
                      <NotebookPen size={28} />
                    </div>
                    <h2 className="text-2xl font-bold tracking-[-0.05em] text-[#F5F5F7]">Your journal is ready</h2>
                    <p className="mt-3 max-w-md text-sm leading-relaxed text-[#A7A7B3]">
                      Capture thoughts, ideas, plans, and everyday moments in a space that feels personal and quiet.
                    </p>
                    <button
                      type="button"
                      onClick={startNewEntry}
                      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(124,58,237,0.25)] transition hover:bg-violet-500"
                    >
                      <Plus size={16} />
                      Write your first entry
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[28px] border border-border bg-[#0D0D12] p-4 md:p-6"
            >
              <div className="mb-5 flex items-center justify-between gap-3 border-b border-border pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A7A7B3]">Write</p>
                  <h2 className="mt-2 text-2xl font-bold tracking-[-0.05em] text-[#F5F5F7]">
                    {selectedEntry ? 'Edit entry' : 'New entry'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={backToJournal}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-[#111118] px-3 py-2 text-sm font-medium text-[#F5F5F7] transition hover:border-violet-500/30 hover:text-violet-300"
                >
                  <ArrowLeft size={15} />
                  Back to journal
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="journal-title" className="mb-2 block text-sm font-medium text-[#A7A7B3]">
                    Entry title
                  </label>
                  <input
                    id="journal-title"
                    value={draft.title}
                    onChange={(e) => setDraft((current) => ({ ...current, title: e.target.value }))}
                    placeholder="A thought to remember"
                    className="w-full rounded-2xl border border-border bg-[#111118] px-4 py-3 text-base text-[#F5F5F7] placeholder:text-[#A7A7B3] focus:border-violet-500/40 focus:outline-none"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="journal-date" className="mb-2 block text-sm font-medium text-[#A7A7B3]">
                      Date
                    </label>
                    <input
                      id="journal-date"
                      type="datetime-local"
                      value={draft.createdAt.slice(0, 16)}
                      onChange={(e) => {
                        const value = new Date(e.target.value).toISOString()
                        setDraft((current) => ({ ...current, createdAt: value, updatedAt: value }))
                      }}
                      className="w-full rounded-2xl border border-border bg-[#111118] px-4 py-3 text-base text-[#F5F5F7] focus:border-violet-500/40 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="journal-content" className="mb-2 block text-sm font-medium text-[#A7A7B3]">
                    Your entry
                  </label>
                  <textarea
                    id="journal-content"
                    value={draft.content}
                    onChange={(e) => setDraft((current) => ({ ...current, content: e.target.value }))}
                    placeholder="Write what you want to remember, reflect on, plan, or carry forward."
                    rows={12}
                    className="w-full rounded-[24px] border border-border bg-[#111118] px-4 py-3 text-base leading-7 text-[#F5F5F7] placeholder:text-[#A7A7B3] focus:border-violet-500/40 focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                  <div className="text-sm text-[#A7A7B3]">
                    Browser-only journal state for this pass. No server persistence exists yet.
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={backToJournal}
                      className="rounded-xl border border-border bg-[#111118] px-4 py-2.5 text-sm font-medium text-[#F5F5F7] transition hover:border-violet-500/30"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveEntry}
                      className="inline-flex items-center gap-2 rounded-xl bg-lime-400 px-4 py-2.5 text-sm font-semibold text-[#070708] shadow-[0_12px_26px_rgba(184,255,61,0.18)] transition hover:bg-lime-300"
                    >
                      <Save size={16} />
                      Save entry
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}
