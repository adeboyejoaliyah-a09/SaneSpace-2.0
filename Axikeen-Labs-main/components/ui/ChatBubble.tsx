'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { Message } from '@/lib/types'
import TypingIndicator from './TypingIndicator'
import ModeTag from './ModeTag'
import HumanHandoffCard from './HumanHandoffCard'

interface ChatBubbleProps {
  message: Message
  isLatest?: boolean
}

type Mode = 'listening' | 'coach' | 'explorer' | 'companion' | 'care'
const VALID_MODES: Mode[] = ['listening', 'coach', 'explorer', 'companion', 'care']

function toMode(m: string): Mode {
  return (VALID_MODES as string[]).includes(m) ? (m as Mode) : 'listening'
}

const INTENSITY_COLOR: Record<string, string> = {
  High: 'text-red-400',
  Medium: 'text-amber-400',
  Low: 'text-green-500',
}

function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ChatBubble({ message, isLatest = false }: ChatBubbleProps) {
  const [showReasoning, setShowReasoning] = useState(false)
  const isUser = message.sender === 'user'
  const showTyping = isLatest && !isUser && !message.content
  const shouldShowHandoff =
    !isUser &&
    message.showHumanHandoff &&
    (message.riskLevel === 'high' || message.riskLevel === 'critical')

  return (
    <div className="flex flex-col">
      <div className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div
          className={`
            group relative max-w-[75%]
            ${isUser ? 'order-last' : ''}
          `}
        >
          {showTyping ? (
            <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(10,124,110,0.08)]">
              <TypingIndicator />
            </div>
          ) : (
            <>
              <div
                className={`
                  px-4 py-3 rounded-3xl text-sm leading-relaxed
                  ${isUser
                    ? 'bg-primary text-white rounded-br-md'
                    : 'bg-white text-gray-text shadow-[0_2px_12px_rgba(10,124,110,0.08)] rounded-bl-md'
                  }
                `}
              >
                {message.content}
              </div>
              <span
                className={`
                  absolute bottom-0 text-[10px] text-gray-400 whitespace-nowrap
                  opacity-0 group-hover:opacity-100 transition-opacity duration-200
                  ${isUser ? 'right-0 -bottom-4' : 'left-0 -bottom-4'}
                `}
              >
                {formatTime(message.timestamp)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── Reasoning transparency panel ── */}
      {!isUser && message.reasoning && (
        <div className="flex flex-col items-start">
          <button
            onClick={() => setShowReasoning((prev) => !prev)}
            className="flex items-center gap-1 mt-1 ml-2 text-xs cursor-pointer"
            style={{ color: '#0A7C6E' }}
          >
            How SaneSpace thought about this
            <ChevronDown
              size={12}
              className={`transition-transform duration-300 ${showReasoning ? 'rotate-180' : ''}`}
            />
          </button>

          <AnimatePresence>
            {showReasoning && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden w-full max-w-[85%]"
              >
                <div className="bg-white border-l-4 border-primary rounded-r-xl p-3 mt-1 ml-2 text-xs">
                  <p className="font-medium text-primary mb-2">🧠 SaneSpace Reasoning</p>

                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-text">Language detected</span>
                    <span className="text-dark text-right">{message.reasoning.detectedLanguage}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-text">Emotional intensity</span>
                    <span className={`font-medium text-right ${INTENSITY_COLOR[message.reasoning.emotionalIntensity] ?? 'text-dark'}`}>
                      {message.reasoning.emotionalIntensity}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-text">Pattern identified</span>
                    <span className="text-dark text-right">{message.reasoning.moodPattern}</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="text-gray-text">Mode selected</span>
                    <ModeTag mode={toMode(message.reasoning.modeSelected)} size="small" />
                  </div>

                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-text shrink-0 mr-2">Mode reason</span>
                    <span className="italic text-gray-text text-right text-wrap">{message.reasoning.modeReason}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-text">Specialisation</span>
                    <span className="text-dark text-right">{message.reasoning.specialisationApplied}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-text shrink-0 mr-2">Memory context</span>
                    <span className="text-dark text-right text-wrap">{message.reasoning.memoryUsed}</span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-gray-text">Crisis check</span>
                    <span className="text-green-500 font-medium">✓ Passed</span>
                  </div>

                  {typeof message.riskScore === 'number' && (
                    <div className="flex justify-between py-1 border-t border-gray-50">
                      <span className="text-gray-text">Risk score</span>
                      <span className="text-dark font-medium">
                        {message.riskLevel} ({message.riskScore.toFixed(2)})
                      </span>
                    </div>
                  )}

                  {message.memoryExtraction && message.memoryExtraction.memoriesExtracted.length > 0 && (
                    <div className="mt-2 rounded-lg bg-primary-light px-2.5 py-2">
                      <p className="text-[11px] font-semibold text-primary mb-1">Memory Updated</p>
                      {message.memoryExtraction.memoriesExtracted.slice(0, 3).map((memory) => (
                        <p key={`${memory.memoryType}-${memory.category}`} className="text-[11px] text-gray-text">
                          {memory.memoryType}: {memory.category} ({Math.round(memory.confidenceScore * 100)}%)
                        </p>
                      ))}
                    </div>
                  )}

                  <p className="italic text-gray-400 text-xs mt-2">
                    This transparency panel shows how SaneSpace processes your message. It is for demonstration purposes.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {shouldShowHandoff && (
        <HumanHandoffCard riskLevel={message.riskLevel as 'high' | 'critical'} />
      )}
    </div>
  )
}
