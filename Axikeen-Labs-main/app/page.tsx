'use client'

import Link from 'next/link'
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion'
import {
  ArrowRight,
  BookOpenText,
  BrainCircuit,
  ChevronRight,
  Globe2,
  Mic,
  MessageSquareText,
  NotebookPen,
  ShieldCheck,
  Sparkles,
  Waves,
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import ScrollProgress from '@/components/ui/ScrollProgress'

const lifeModes = [
  { label: 'School', detail: 'Help me understand this.' },
  { label: 'Work', detail: "Let's figure this out." },
  { label: 'Relationships', detail: 'Can I talk this through?' },
  { label: 'Ideas', detail: 'What if we tried this?' },
  { label: 'Life', detail: "I don't know what to do." },
  { label: 'Just me', detail: "I just want to talk." },
]

const memorySteps = [
  { title: 'Conversation', body: 'The day starts as a real back-and-forth.' },
  { title: 'Memory', body: 'Useful context stays in the background.' },
  { title: 'Context', body: 'The next conversation feels more natural.' },
  { title: 'Understanding', body: 'SaneSpace grows with you over time.' },
]

const trustPoints = [
  'You decide what matters',
  'You can revisit and edit context',
  'Your space stays calm and private',
  'You stay in control of what SaneSpace remembers',
]

export default function Home() {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const smoothX = useSpring(mouseX, { stiffness: 140, damping: 18, mass: 0.6 })
  const smoothY = useSpring(mouseY, { stiffness: 140, damping: 18, mass: 0.6 })

  const aura = useMotionTemplate`
    radial-gradient(circle at ${smoothX}px ${smoothY}px, rgba(124, 58, 237, 0.34), transparent 26%),
    radial-gradient(circle at 78% 24%, rgba(184, 255, 61, 0.14), transparent 18%),
    radial-gradient(circle at 48% 72%, rgba(124, 58, 237, 0.12), transparent 24%),
    linear-gradient(135deg, rgba(15,15,20,0.96), rgba(7,7,8,1))
  `

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    mouseX.set(event.clientX - rect.left)
    mouseY.set(event.clientY - rect.top)
  }

  return (
    <>
      <ScrollProgress />
      <Navbar />

      <main className="bg-[#070708] text-[#F5F5F7]">
        <section className="relative isolate overflow-hidden pt-24 md:pt-28">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.18),_transparent_38%),radial-gradient(circle_at_80%_30%,_rgba(184,255,61,0.07),_transparent_18%),linear-gradient(180deg,#070708_0%,#09090c_100%)]" />

          <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-8 md:px-8 lg:px-10">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="rounded-[32px] border border-border bg-[#0D0D12]/80 px-5 py-5 shadow-[0_30px_100px_rgba(0,0,0,0.42)] backdrop-blur md:px-8 md:py-7"
              onPointerMove={handlePointerMove}
            >
              <motion.div
                className="absolute inset-0 rounded-[32px] opacity-90"
                style={{ background: aura }}
              />

              <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
                <div className="max-w-2xl py-4 md:py-8">
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.05 }}
                    className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-200"
                  >
                    <Sparkles size={12} />
                    AI life companion
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="max-w-xl font-heading text-4xl font-black leading-[0.94] tracking-[-0.08em] text-[#F5F5F7] md:text-6xl lg:text-[5rem]"
                  >
                    AI that grows with you.
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                    className="mt-6 max-w-xl text-base leading-7 text-[#A7A7B3] md:text-lg"
                  >
                    A space to think, create, plan, reflect, and be yourself — with an AI companion that understands the context of your life over time.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mt-8 flex flex-wrap items-center gap-3"
                  >
                    <Link
                      href="/sign-up"
                      className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(124,58,237,0.28)] transition hover:bg-violet-500"
                    >
                      Get started
                      <ArrowRight size={16} />
                    </Link>
                    <a
                      href="#how-it-works"
                      className="inline-flex items-center gap-2 rounded-xl border border-border bg-[#111118] px-5 py-3 text-sm font-semibold text-[#F5F5F7] transition hover:border-violet-500/30 hover:text-violet-300"
                    >
                      See how it works
                      <ChevronRight size={16} />
                    </a>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.25 }}
                    className="mt-10 flex flex-wrap gap-4 text-xs uppercase tracking-[0.18em] text-[#A7A7B3]"
                  >
                    <span className="rounded-full border border-border bg-[#111118] px-3 py-1.5">Context-aware</span>
                    <span className="rounded-full border border-border bg-[#111118] px-3 py-1.5">Private by default</span>
                    <span className="rounded-full border border-border bg-[#111118] px-3 py-1.5">Built for life</span>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.7, delay: 0.12 }}
                  className="relative flex min-h-[420px] items-center justify-center"
                >
                  <div className="absolute inset-8 rounded-[32px] border border-violet-500/20 bg-[radial-gradient(circle_at_center,_rgba(124,58,237,0.12),_rgba(17,17,24,0.35)_50%,_rgba(7,7,8,0.8))]" />

                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    className="relative z-10 flex h-[260px] w-[260px] items-center justify-center rounded-[30px] border border-violet-500/20 bg-[#111118]/80 shadow-[0_30px_70px_rgba(124,58,237,0.18)]"
                  >
                    <div className="absolute inset-6 rounded-[26px] border border-white/5 bg-[radial-gradient(circle_at_30%_30%,_rgba(124,58,237,0.18),_rgba(17,17,24,0.1)_45%,_rgba(17,17,24,0.7))]" />
                    <div className="absolute left-12 top-12 h-20 w-20 rounded-full border border-violet-300/20 bg-violet-500/10 blur-xl" />
                    <div className="absolute bottom-10 right-10 h-14 w-14 rounded-full border border-lime-300/25 bg-lime-400/10 blur-xl" />
                    <div className="relative flex h-32 w-32 items-center justify-center rounded-full border border-violet-500/35 bg-[radial-gradient(circle_at_40%_35%,_rgba(255,255,255,0.18),_rgba(124,58,237,0.18)_20%,_rgba(17,17,24,0.8)_60%)]">
                      <div className="absolute inset-4 rounded-full border border-white/8" />
                      <div className="absolute h-14 w-14 rounded-full border border-lime-300/40 bg-lime-400/10" />
                      <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#0D0D12] shadow-[inset_0_0_18px_rgba(124,58,237,0.3)]">
                        <MessageSquareText className="h-8 w-8 text-violet-200" />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    animate={{ x: [0, 10, 0], y: [0, -12, 0] }}
                    transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -left-4 top-12 rounded-2xl border border-border bg-[#111118]/90 px-3 py-2 shadow-lg"
                  >
                    <div className="flex items-center gap-2 text-xs text-[#A7A7B3]">
                      <NotebookPen size={12} className="text-violet-300" />
                      notes, ideas, plans
                    </div>
                  </motion.div>

                  <motion.div
                    animate={{ x: [0, -8, 0], y: [0, 12, 0] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -bottom-2 right-2 rounded-2xl border border-border bg-[#111118]/90 px-3 py-2 shadow-lg"
                  >
                    <div className="flex items-center gap-2 text-xs text-[#A7A7B3]">
                      <Waves size={12} className="text-lime-300" />
                      voice, when ready
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="space" className="mx-auto max-w-6xl px-5 py-20 md:px-8 lg:px-10">
          <div className="mb-10 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">More than a chatbot</p>
            <h2 className="mt-4 text-3xl font-bold tracking-[-0.06em] text-[#F5F5F7] md:text-5xl">
              A companion that understands your context, not just your latest prompt.
            </h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-4">
            {memorySteps.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.35, delay: index * 0.06 }}
                className="rounded-[26px] border border-border bg-[#0D0D12] p-5"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10 text-sm font-semibold text-violet-200">
                  0{index + 1}
                </div>
                <h3 className="text-xl font-semibold text-[#F5F5F7]">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#A7A7B3]">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-[#0D0D12] py-20">
          <div className="mx-auto max-w-6xl px-5 md:px-8 lg:px-10">
            <div className="mb-10 max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A7A7B3]">Life, not just one thing</p>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.06em] text-[#F5F5F7] md:text-5xl">
                SaneSpace moves with whatever is happening in your life.
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {lifeModes.map((mode) => (
                <motion.article
                  key={mode.label}
                  whileHover={{ y: -4 }}
                  className="group rounded-[26px] border border-border bg-[#111118] p-5 transition hover:border-violet-500/25"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-lg font-semibold text-[#F5F5F7]">{mode.label}</p>
                    <span className="h-2.5 w-2.5 rounded-full bg-lime-400/80 shadow-[0_0_18px_rgba(184,255,61,0.8)]" />
                  </div>
                  <p className="text-sm leading-6 text-[#A7A7B3]">{mode.detail}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-20 md:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A7A7B3]">It remembers the context</p>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.06em] text-[#F5F5F7] md:text-5xl">
                Useful context stays with you, without turning into noise.
              </h2>
              <p className="mt-5 max-w-lg text-base leading-7 text-[#A7A7B3]">
                SaneSpace can carry the important threads of your conversations forward — the ideas, plans, preferences, and realities that make your next interaction feel like it actually knows you.
              </p>
            </div>

            <div className="rounded-[28px] border border-border bg-[#0D0D12] p-4 md:p-5">
              <div className="space-y-4">
                <div className="rounded-[22px] border border-border bg-[#111118] p-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A7A7B3]">Conversation</p>
                  <p className="text-sm leading-6 text-[#F5F5F7]">“I’m trying to plan a new chapter after a busy semester. I want a calmer way to think it through.”</p>
                </div>

                <div className="flex items-center justify-center text-violet-300">
                  <ArrowRight size={18} />
                </div>

                <div className="rounded-[22px] border border-violet-500/20 bg-violet-500/10 p-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-200">Context remembered</p>
                  <p className="text-sm leading-6 text-[#F5F5F7]">The user is in a transition phase, wants a calmer pace, and prefers practical reflection over pressure.</p>
                </div>

                <div className="flex items-center justify-center text-violet-300">
                  <ArrowRight size={18} />
                </div>

                <div className="rounded-[22px] border border-border bg-[#111118] p-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A7A7B3]">Next time</p>
                  <p className="text-sm leading-6 text-[#F5F5F7]">“We’ve talked about your pace before. Let’s build a plan that feels sustainable.”</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#0D0D12] py-20">
          <div className="mx-auto max-w-6xl px-5 md:px-8 lg:px-10">
            <div className="rounded-[32px] border border-border bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.12),_rgba(17,17,24,0.9)_40%,_rgba(7,7,8,1)_100%)] p-6 md:p-10">
              <div className="mb-8 max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A7A7B3]">Your space</p>
                <h2 className="mt-4 text-3xl font-bold tracking-[-0.06em] text-[#F5F5F7] md:text-5xl">
                  You do not need to perform here.
                </h2>
              </div>

              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                {[
                  'You can think out loud.',
                  'You can change your mind.',
                  'You can be serious, random, curious, or unsure.',
                  'SaneSpace adapts to you.',
                ].map((line) => (
                  <div key={line} className="rounded-[24px] border border-border bg-[#111118] p-5 text-base leading-7 text-[#F5F5F7]">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20 md:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A7A7B3]">Voice</p>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.06em] text-[#F5F5F7] md:text-5xl">
                Eventually, you won’t need to open a screen.
              </h2>
              <p className="mt-5 max-w-lg text-base leading-7 text-[#A7A7B3]">
                The long-term vision is a SaneSpace that can meet you in the flow of life — through voice, context, and daily presence — without forcing a rigid interface.
              </p>
            </div>

            <div className="relative overflow-hidden rounded-[30px] border border-border bg-[#0D0D12] p-6">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(124,58,237,0.18),_transparent_30%),radial-gradient(circle_at_80%_70%,_rgba(184,255,61,0.12),_transparent_18%)]" />
              <div className="relative flex items-center justify-center gap-4 rounded-[24px] border border-border bg-[#111118] p-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-200">
                  <Mic size={28} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A7A7B3]">Listening</p>
                  <div className="mt-3 flex items-end gap-1.5">
                    {[12, 20, 30, 22, 34, 26, 18].map((height, index) => (
                      <motion.span
                        key={height + index}
                        animate={{ height: [height, height + 12, height] }}
                        transition={{ duration: 1.8, repeat: Infinity, delay: index * 0.08, ease: 'easeInOut' }}
                        className="w-2 rounded-full bg-violet-400"
                        style={{ height }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-[#0D0D12] py-20">
          <div className="mx-auto max-w-6xl px-5 md:px-8 lg:px-10">
            <div className="mb-10 max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A7A7B3]">Cultural intelligence</p>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.06em] text-[#F5F5F7] md:text-5xl">
                People do not experience life in the same way.
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {[
                { icon: Globe2, title: 'Context-aware', body: 'Language, culture, and communication style matter.' },
                { icon: BrainCircuit, title: 'Adaptable', body: 'SaneSpace adjusts to how you actually speak and think.' },
                { icon: ShieldCheck, title: 'Respectful', body: 'Built to understand differences without flattening them.' },
              ].map((item) => (
                <div key={item.title} className="rounded-[26px] border border-border bg-[#111118] p-5">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-200">
                    <item.icon size={20} />
                  </div>
                  <h3 className="text-xl font-semibold text-[#F5F5F7]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#A7A7B3]">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="journal" className="mx-auto max-w-6xl px-5 py-20 md:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="rounded-[30px] border border-border bg-[#0D0D12] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A7A7B3]">Privacy / control</p>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.06em] text-[#F5F5F7] md:text-5xl">
                Your space. Your context. Your control.
              </h2>
              <ul className="mt-6 space-y-3 text-sm leading-6 text-[#A7A7B3]">
                {trustPoints.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-lime-400" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[30px] border border-border bg-[#111118] p-6 md:p-8">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A7A7B3]">Personal space</p>
                  <h3 className="mt-2 text-2xl font-semibold text-[#F5F5F7]">Private notes</h3>
                </div>
                <div className="rounded-full border border-violet-500/25 bg-violet-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-violet-200">
                  synced to context
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div className="rounded-[22px] border border-border bg-[#0D0D12] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#A7A7B3]">Today</p>
                  <p className="mt-2 text-sm leading-6 text-[#F5F5F7]">“I want to build a calmer rhythm this week — less urgency, more focus.”</p>
                </div>
                <div className="rounded-[22px] border border-border bg-[#0D0D12] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#A7A7B3]">Remembered</p>
                  <p className="mt-2 text-sm leading-6 text-[#F5F5F7]">You prefer practical support, soft pacing, and less pressure when life feels crowded.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-24 pt-6 md:px-8 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="overflow-hidden rounded-[32px] border border-border bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.16),_rgba(17,17,24,0.85)_25%,_rgba(7,7,8,1)_100%)] p-6 md:p-10"
          >
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">SaneSpace</p>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.06em] text-[#F5F5F7] md:text-5xl">
                Make some space for yourself.
              </h2>
              <p className="mt-5 text-base leading-7 text-[#A7A7B3] md:text-lg">
                Think it through. Figure it out. Build something. Talk about it. SaneSpace grows with you.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(124,58,237,0.28)] transition hover:bg-violet-500"
              >
                Enter SaneSpace
                <ArrowRight size={16} />
              </Link>
              <Link
                href="#space"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-[#111118] px-5 py-3 text-sm font-semibold text-[#F5F5F7] transition hover:border-violet-500/30 hover:text-violet-300"
              >
                Explore the space
              </Link>
            </div>
          </motion.div>
        </section>
      </main>
    </>
  )
}
