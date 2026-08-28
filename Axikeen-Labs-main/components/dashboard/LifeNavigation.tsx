'use client'

import { motion } from 'framer-motion'

const AREAS = [
  { id: 'school', icon: '🎓', title: 'School', description: 'Study, assignments, and academic decisions.' },
  { id: 'career', icon: '💼', title: 'Career', description: 'Opportunities, skills, and work decisions.' },
  { id: 'relationships', icon: '❤', title: 'Relationships', description: 'Conversations and difficult situations.' },
  { id: 'finances', icon: '💰', title: 'Finances', description: 'Plan and think through money decisions.' },
  { id: 'personal', icon: '🌱', title: 'Personal life', description: 'Goals, habits, planning, and everyday life.' },
]

export default function LifeNavigation({ onSelect }: { onSelect: (area: string) => void }) {
  return (
    <section aria-labelledby="life-navigation-heading">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.16em] text-primary font-semibold">Life navigation</p>
        <h2 id="life-navigation-heading" className="font-heading text-2xl font-bold text-dark mt-1">What would you like to figure out?</h2>
        <p className="text-sm text-gray-text mt-1">Choose a starting point. SaneSpace will follow your context.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {AREAS.map((area) => (
          <motion.button
            key={area.id}
            type="button"
            onClick={() => onSelect(area.title)}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.98 }}
            className="glass rounded-xl p-4 text-left border border-transparent hover:border-primary-mid transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <span className="text-2xl" aria-hidden="true">{area.icon}</span>
            <h3 className="font-semibold text-dark mt-3">{area.title}</h3>
            <p className="text-xs text-gray-text leading-relaxed mt-1">{area.description}</p>
          </motion.button>
        ))}
      </div>
    </section>
  )
}
