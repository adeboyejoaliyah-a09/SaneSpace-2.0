'use client'

import { ShieldAlert } from 'lucide-react'
import { NIGERIAN_SUPPORT_RESOURCES, type SupportResource } from '@/lib/supportResources'

type HumanHandoffCardProps = {
  riskLevel: 'high' | 'critical'
  resources?: SupportResource[]
  onContinueChat?: () => void
}

export default function HumanHandoffCard({
  riskLevel,
  resources = NIGERIAN_SUPPORT_RESOURCES,
  onContinueChat,
}: HumanHandoffCardProps) {
  const isCritical = riskLevel === 'critical'

  return (
    <div className="mt-3 ml-2 w-full max-w-[88%] rounded-2xl border border-red-100 bg-white shadow-[0_8px_28px_rgba(127,29,29,0.08)] overflow-hidden">
      <div className={`px-4 py-3 ${isCritical ? 'bg-red-50' : 'bg-amber-50'} border-b border-red-100`}>
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 rounded-full p-2 ${isCritical ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
            <ShieldAlert size={18} />
          </div>
          <div>
            <h3 className="font-heading text-sm font-bold text-dark">
              You do not have to handle this alone.
            </h3>
            <p className="text-xs text-gray-text leading-relaxed mt-1">
              {isCritical
                ? 'If you are in immediate danger, please contact emergency help or someone near you now.'
                : 'This sounds serious enough that real-world support could help right now.'}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div className="space-y-2 text-xs text-gray-text leading-relaxed">
          <p>
            Reach out to someone you trust: a friend, family member, roommate,
            course adviser, campus counselor, or student affairs office.
          </p>
          <p>If you can, stay near another person until you feel safer.</p>
          <p>
            SaneSpace can support you emotionally, but it is not a replacement
            for licensed therapy, medical care, or emergency services.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold text-dark mb-2">Nigerian support resources</p>
          <div className="space-y-2">
            {resources.map((resource) => (
              <div key={resource.name} className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                <p className="text-xs font-semibold text-dark">{resource.name}</p>
                <p className="text-xs text-primary font-medium mt-0.5">{resource.contact}</p>
                <p className="text-[11px] text-gray-text mt-0.5">{resource.description}</p>
              </div>
            ))}
          </div>
        </div>

        {onContinueChat && (
          <button
            type="button"
            onClick={onContinueChat}
            className="w-full rounded-full border border-primary text-primary text-xs font-semibold px-4 py-2 hover:bg-primary-light transition-colors"
          >
            I am safe right now
          </button>
        )}
      </div>
    </div>
  )
}
