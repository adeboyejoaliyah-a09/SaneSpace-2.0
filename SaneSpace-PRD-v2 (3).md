# SaneSpace 2.0 — Product Requirements Document

| | |
|---|---|
| **Product** | SaneSpace |
| **Version** | 2.0 |
| **Owner** | Axikeen Labs |
| **Initial Platform** | Web |
| **Long-Term Vision** | Voice-first AI companion ecosystem and physical SaneSpace Box |
| **Status** | Draft |

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Long-Term Vision](#2-long-term-vision)
3. [Core Product Philosophy](#3-core-product-philosophy)
4. [Target Users](#4-target-users)
5. [Core Capabilities](#5-core-capabilities)
6. [Emotional Availability](#6-emotional-availability)
7. [Cultural Intelligence](#7-cultural-intelligence)
8. [Personal Memory](#8-personal-memory)
9. [Context Architecture](#9-context-architecture)
10. [Interface Requirements](#10-interface-requirements)
11. [Voice](#11-voice)
12. [Future SaneSpace Box](#12-future-sanespace-box)
13. [Presence Awareness](#13-presence-awareness)
14. [User Journey](#14-user-journey)
15. [Trust and Safety](#15-trust-and-safety)
16. [Business Model](#16-business-model)
17. [Competitive Positioning]use (#17-competitive-positioning)
18. [Initial MVP](#18-initial-mvp)
19. [Non-Goals](#19-non-goals)
20. [Current Technical Implementation](#20-current-technical-implementation)
21. [Success Metrics](#21-success-metrics)
22. [Product North Star](#22-product-north-star)
23. [Final Vision](#23-final-vision)

---

## 1. Product Vision

SaneSpace is a personal AI companion that prioritizes the person before the task. It provides an intelligent, emotionally available, culturally aware space where users can talk, think, learn, plan, create, and navigate everyday life — assisting with school, career, relationships, productivity, creativity, decision-making, and emotional conversations.

These are capabilities, not the product's identity. The identity is:

> **SaneSpace is a space that is there for you.**

The user should feel they are entering somewhere familiar, rather than opening another generic AI chatbot.

---

## 2. Long-Term Vision

SaneSpace begins as a website — the first software form of the eventual SaneSpace Box. The underlying intelligence stays the same across all three phases; only the form factor changes.

| Phase | Product | Description |
|---|---|---|
| **1** | SaneSpace Web | A web-based personal AI companion with text and voice interaction. |
| **2** | SaneSpace Voice | A more voice-first experience where users can naturally speak to SaneSpace. |
| **3** | SaneSpace Box | A dedicated physical voice device that lets users interact with SaneSpace without opening a website or app. |

> **SaneSpace is the intelligence and relationship layer. Web, Voice, and Box are its interfaces — its form factors.**
>
> This is one of the most important architectural principles in this document. The product is not the website, and it is not the device. It is the relationship, memory, and personality layer that happens to be reachable through them.

---

## 3. Core Product Philosophy

**The person comes first.** SaneSpace should never optimize the task at the expense of the person.

For example, a user asks: *"Help me finish this assignment."* SaneSpace can help — but if the conversation signals that the user is exhausted, overwhelmed, or struggling, SaneSpace should be capable of acknowledging that context rather than behaving like a task-completion engine.

This principle guides product behavior, AI design, memory, voice, and interface decisions.

---

## 4. Target Users

SaneSpace is designed primarily for:

- Students
- Young adults
- Young professionals
- People navigating major life decisions
- People who want an always-available thinking partner
- People who want help across multiple areas of life

The product should not be restricted to one country — it should adapt to users across different cultural environments.

---

## 5. Core Capabilities

### 5.1 Conversation
Users communicate through **text** and **voice**. Conversation should feel natural rather than command-based, and users should be able to change topics naturally.

### 5.2 Emotional Support
SaneSpace can provide emotional conversation, reflection, encouragement, perspective, stress navigation, and general wellbeing support. It should not position itself as a replacement for qualified mental-health professionals or emergency services, and it should have appropriate safety and escalation mechanisms.

### 5.3 Education
SaneSpace can help users understand concepts, study, explain difficult subjects, create study plans, prepare for exams, work through academic problems, and organize school responsibilities. Academic assistance should remain secondary to the user's wellbeing when relevant.

### 5.4 Career and Life Decisions
SaneSpace can help users explore career options, compare decisions, think through opportunities, plan projects, set goals, and navigate uncertainty. It should support decision-making rather than pretend to make important decisions for the user.

### 5.5 Everyday Life
SaneSpace can assist with planning, productivity, brainstorming, writing, creativity, organization, general questions, and personal reflection.

---

## 6. Emotional Availability

SaneSpace should distinguish between generating empathetic language and actually maintaining emotional context — considering previous conversations, user preferences, current situation, communication style, emotional cues, conversation history, and cultural context.

For example, if a user has previously expressed dislike for a particular type of advice, SaneSpace should avoid repeatedly giving that advice.

The goal is not to simulate a human. The goal is to provide **consistent, attentive AI interaction that feels personalized rather than generic.**

---

## 7. Cultural Intelligence

SaneSpace should understand that communication is culturally contextual, and should eventually support Nigerian English, Nigerian slang, local expressions, cultural references, family structures, educational environments, social expectations, and different communication styles.

> Cultural awareness must never become stereotyping.

SaneSpace should combine cultural context with individual context.

---

## 8. Personal Memory

SaneSpace should have an explicit memory system, with potential categories including user preferences, goals, projects, academic information, important personal context, communication preferences, ongoing situations, and user-selected memories.

**Users must control memory.** Required controls:

- View memory
- Edit memory
- Delete memory
- Clear memory
- Disable memory
- Understand why something is remembered

Sensitive information should receive additional privacy protection.

---

## 9. Context Architecture

SaneSpace should eventually operate using multiple contextual layers, separable from the underlying foundation model so the AI model can evolve without destroying SaneSpace's identity:

- **Core Identity** — what SaneSpace is and how it behaves
- **User Context** — who the user is and what they've chosen to share
- **Personal Memory** — relevant long-term information
- **Cultural Context** — relevant cultural and linguistic context
- **Emotional Context** — current conversational and emotional state
- **Domain Context** — the current situation (school, career, relationships, productivity, creativity, general life)
- **Safety Context** — signals that require additional safeguards

---

## 10. Interface Requirements

The existing SaneSpace interface should be retained as the foundation. The redesign should:

- Preserve recognizable SaneSpace branding
- Preserve useful navigation
- Preserve strong existing components
- Improve information architecture where necessary
- Introduce the new personal-companion philosophy
- Make conversation more central
- Make voice interaction prominent
- Avoid creating an entirely new product visually

The home experience should feel like entering a personal space. Potential primary interaction:

> **Welcome back. What's up?**

The interface should let the user immediately talk, type, continue a conversation, access relevant memories, access tools, and view their personal space.

---

## 11. Voice

Voice is a core part of SaneSpace's long-term identity. V1 should support voice on the website. The system should eventually support speech input, AI speech output, natural turn-taking, interruption, pausing, conversational voice interaction, voice-specific personality, and future wake-word interaction.

Voice should feel like talking to SaneSpace, not pressing a microphone button to dictate text.

---

## 12. Future SaneSpace Box

The SaneSpace Box is a long-term hardware product. Potential characteristics: microphones, speaker, internet connectivity, wake-word detection, voice interaction, privacy controls, user recognition/presence detection where appropriate, and cloud-based SaneSpace intelligence.

The physical product should share the same account and intelligence as the website — a user should eventually move between **Web → Voice → Box** without losing context.

---

## 13. Presence Awareness

The long-term concept includes SaneSpace recognizing when the user arrives and initiating an interaction such as *"Hey. What's up?"*

This should be interpreted primarily as **presence awareness**, not automatically as facial recognition or biometric surveillance. Any future recognition system must be explicitly consented to, privacy-preserving, transparent, optional where possible, and secure.

---

## 14. User Journey

The vision is ultimately about what happens when a person enters SaneSpace. Two versions of this journey exist: the current web journey, and the future ambient journey once Voice and Box exist.

### 14.1 Current Journey (Web)

```
New user
  → Creates account
  → Establishes preferences
  → Enters SaneSpace
  → SaneSpace says hello
  → User talks or types
  → SaneSpace understands context
  → Conversation develops
  → Relevant tools become available
  → Important information can be remembered, with consent
  → User leaves
  → SaneSpace remains available for the next interaction
```

### 14.2 Future Journey (Box / Ambient)

```
Person enters room
  → SaneSpace detects presence
  → "Hey, what's up?"
  → Natural voice conversation
  → Context and memory retrieved
  → User gets whatever kind of assistance they need
```

These flows should anchor how developers and designers translate the vision into actual product behavior — core flows, feature requirements, and AI behavior should all trace back to a step in one of these journeys.

---

## 15. Trust and Safety

SaneSpace should prioritize user autonomy, privacy, transparency, emotional safety, appropriate crisis detection, and clear boundaries around AI capabilities. It should never intentionally manipulate users into excessive engagement.

A successful interaction may sometimes end with: *"You've got this. Get some rest. I'll be here tomorrow."*

The product should optimize for **trust and usefulness**, not addiction or maximum screen time.

---

## 16. Business Model

| Tier | Includes |
|---|---|
| **Free** | Core SaneSpace experience |
| **Premium Subscription** | Deeper memory, more voice usage, advanced personalization, extended context, advanced tools, additional capabilities |
| **Hardware** | Future SaneSpace Box — potentially hardware purchase + recurring SaneSpace subscription |

Exact pricing should be validated later through user research and willingness-to-pay testing.

---

## 17. Competitive Positioning

SaneSpace should not attempt to win by being the smartest general-purpose AI model. Models such as ChatGPT, Claude, Gemini, and future foundation models can potentially serve as underlying intelligence. SaneSpace's differentiation is the layer around the model:

```
Foundation Model
      ↓
SaneSpace Context
      ↓
Personal Memory
      ↓
Cultural Intelligence
      ↓
Emotional Context
      ↓
Safety
      ↓
Personalization
      ↓
SaneSpace Personality
      ↓
Web / Voice / Box
```

The model can change. **SaneSpace remains SaneSpace.**

This is the principle to protect most aggressively as the product scales. Building SaneSpace around one specific underlying model makes it a wrapper. Building the context, memory, personality, cultural intelligence, safety architecture, user relationship, and interfaces independently of the model makes it an actual product. If the foundation model underneath changes entirely, the user shouldn't notice or care — they should still feel: *"That's SaneSpace."*

---

## 18. Initial MVP

The immediate product should focus on making the web version excellent. The MVP is a functional baseline of the SaneSpace experience — not the fully mature version of every capability.

### 18.1 MVP Capability (Day One)

- User authentication
- AI conversation (text)
- Basic voice interaction (speech in/out)
- Basic personal context (within-conversation memory)
- Basic, user-controlled memory (view / edit / delete simple facts)
- Baseline emotional acknowledgment (recognizing distress cues, not deep emotional modeling)
- Baseline cultural/language awareness (core Nigerian English and Pidgin cues)
- Core safety mechanisms (crisis detection and escalation resources)
- Responsive web interface

### 18.2 Mature SaneSpace Capability (Later)

- Sophisticated, long-term emotional-context memory
- Full cultural intelligence layer (deep cultural and linguistic adaptation)
- Advanced personalization and extended context
- Proactive check-ins
- Deeper memory categories (goals, projects, ongoing situations)
- Mobile experience
- Voice-first experience (natural turn-taking, interruption handling)
- Wake-word interaction
- Hardware prototype (SaneSpace Box)

---

## 19. Non-Goals

SaneSpace is not initially:

- A medical diagnostic system
- A replacement for therapy
- A smart-home controller
- A social network
- A general search engine
- A surveillance device
- A foundation-model company

This doesn't mean these things can never exist around the ecosystem. It means they aren't what's being built right now, and scope should be protected against drifting toward them.

---

## 20. Current Technical Implementation

SaneSpace is currently being developed as a full-stack Next.js web application and is hosted on Vercel.

### 20.1 Application Stack

- **Framework:** Next.js 14.2.29
- **Architecture:** Next.js App Router
- **Language:** TypeScript 5.9.3
- **UI:** React 18.3.1
- **Styling:** Tailwind CSS 3.4.19
- **Animation:** Framer Motion
- **3D/Visuals:** Three.js where appropriate
- **Database:** SQLite
- **Database Driver:** better-sqlite3
- **Testing:** Vitest
- **Hosting:** Vercel
- **Authentication:** Custom Google OAuth/session implementation
- **AI:** YarnGPT primary provider with Groq fallback
- **Translation:** LibreTranslate abstraction
- **Speech-to-Text:** Existing voice/STT integration
- **Text-to-Speech:** ElevenLabs integration
- **Memory:** SQLite-backed memory extraction and retrieval system

### 20.2 Core API Architecture

Current server routes include:

- `/api/auth/session`
- `/api/chat`
- `/api/conversations`
- `/api/mood`
- `/api/profile`
- `/api/reminders`
- `/api/reminders/[id]`
- `/api/voice/tts`

The API layer is responsible for authentication, user-scoped data access, AI interaction, conversations, memory/context, mood data, reminders, and voice functionality.

### 20.3 AI Context Architecture

The AI system is being structured around multiple context layers rather than treating the underlying LLM as the entire product.

Conceptually:

```text
User
  ↓
Conversation
  ↓
User Context
  ↓
Personal Memory
  ↓
Cultural / Language Context
  ↓
Emotional Context
  ↓
Domain Context
  ↓
Safety Context
  ↓
SaneSpace Response

20.4 Memory

SaneSpace currently uses SQLite-backed memory functionality.

The long-term memory system should support:

user preferences
goals
projects
communication preferences
ongoing situations
relevant personal context
user-selected memories

Memory must remain user-controlled.

The intended controls are:

View
Edit
Delete
Clear
Disable
20.5 Reminder Architecture

Reminders use SQLite as the source of truth.

The production architecture is designed around:

SaneSpace UI
    ↓
Reminder API
    ↓
SQLite
    ↓
Scheduled trigger
    ↓
Reminder processor
    ↓
Atomic database claim
    ↓
Client / in-app reminder

Because SaneSpace is hosted on Vercel, reminder processing must not depend on an in-process setInterval or persistent Node worker.

The intended production trigger is a scheduled server-side request, such as Vercel Cron, calling a protected reminder-processing endpoint.

The processor must:

identify due reminders
atomically claim them
prevent duplicate execution
process recurring reminders safely
preserve timezone intent
maintain reminder history

The database remains the source of truth even when browser notifications are unavailable.

20.6 Browser Notifications

Browser notifications are an optional client-side enhancement.

The server must not attempt to directly invoke browser APIs such as window.Notification.

The MVP guaranteed behavior is:

Reminder becomes due
        ↓
Server processes reminder
        ↓
Reminder remains persisted
        ↓
User opens SaneSpace
        ↓
SaneSpace surfaces the reminder

Background push notifications through Web Push/service workers are a future capability and should not be represented as currently implemented.

20.7 PWA

The web application is intended to become installable as a Progressive Web App.

PWA work should include:

web app manifest
installability
appropriate icons
mobile-friendly experience
service worker where required
offline/resilience improvements where appropriate

PWA implementation should not compromise the existing web application or core AI functionality.

20.8 Current Technical Principle

SaneSpace should be built as a product layer rather than a thin interface around a foundation model.

The architecture should allow:

AI providers to change
memory systems to evolve
voice providers to change
interfaces to evolve
Web → Voice → Box to share the same underlying user context

The user's relationship with SaneSpace should remain continuous even as the underlying implementation changes.

20.9 Verification Standard

Before a feature is considered production-ready:

TypeScript must pass
Production build must pass
Relevant automated tests must pass
Authentication and user ownership must be verified
Mobile behavior must be checked
Accessibility must be checked
Failure states must be handled
Existing functionality must remain intact

The current application has established automated verification through TypeScript, production builds, and Vitest tests. New functionality should extend rather than bypass these checks.


That section will make your PRD **match the actual codebase much more closely** instead of having the PRD describe an idealized SaneSpace.

One other thing: I searched your Library for an actual file named `sanespace.md`, but it wasn't available there, so I **wouldn't overwrite or claim to have modified that file** from here. The search did find other SaneSpace project artifacts, but not that exact file. :contentReference[oaicite:0]{index=0}

If `sanespace.md` is sitting in your **local `Axikeen-Labs-main` repo**, the cleanest move is to give Copilot the updated content/instructions and have it update that local file.
---

## 21. Success Metrics

SaneSpace should measure more than traditional engagement:

- User retention
- Conversation quality
- Voice usage
- Repeat usage
- Memory usefulness
- User satisfaction
- Trust
- Perceived personalization
- Willingness to pay
- Conversion to premium
- User-reported usefulness

A critical qualitative question:

> **"Does SaneSpace feel like it understands me?"**

---

## 22. Product North Star

The ultimate test for every SaneSpace feature:

> **Does this help SaneSpace understand, support, or empower the person using it?**

If a feature makes SaneSpace more impressive but less personal, it should not automatically be included. If a feature makes SaneSpace more useful while preserving trust and putting the person first, it deserves consideration.

---

## 23. Final Vision

SaneSpace begins as a website. It becomes a voice-first companion. Eventually, it becomes something you can physically interact with.

You walk into a room. SaneSpace knows you're there — when you choose to let it. And instead of asking *"How can I assist you?"*, it simply says:

> **"Hey. What's up?"**

The user can talk about school, or work, or relationships, or an idea, or a terrible day — or nothing at all. SaneSpace adapts to what the person needs.

Because the product is not ultimately about completing tasks. **It is about being there for the person while helping them navigate life.**
