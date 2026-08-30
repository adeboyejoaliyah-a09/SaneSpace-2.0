export type ReminderItem = {
  id: string
  title: string
  description?: string | null
  dueAt: string
  status: 'pending' | 'completed' | 'dismissed' | 'cancelled'
}

export function UpcomingReminders({ reminders }: { reminders: ReminderItem[] }) {
  if (!reminders.length) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Upcoming
        </h2>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          Nothing scheduled yet. When something important comes up, SaneSpace can help
          you keep it in mind.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Upcoming
        </h2>
      </div>

      <ul className="space-y-3">
        {reminders.map((reminder) => (
          <li
            key={reminder.id}
            className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {reminder.title}
                </p>
                {reminder.description ? (
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {reminder.description}
                  </p>
                ) : null}
              </div>
              <span className="rounded-full bg-sky-100 px-2 py-1 text-xs font-medium text-sky-800 dark:bg-sky-900/40 dark:text-sky-200">
                {reminder.status}
              </span>
            </div>

            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {new Date(reminder.dueAt).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}