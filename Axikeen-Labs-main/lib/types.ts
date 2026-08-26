export interface User {
  id: string
  name: string
  email: string
  specialisation: string
  languageProfile: 'standard' | 'nigerian-english' | 'pidgin'
  createdAt: string
}

export interface Message {
  id: string
  conversationId: string
  sender: 'user' | 'ai'
  content: string
  adaptiveMode: 'listening' | 'coach' | 'explorer' | 'companion' | 'care'
  timestamp: string
  riskLevel?: 'low' | 'medium' | 'high' | 'critical'
  riskScore?: number
  showHumanHandoff?: boolean
  responseType?: 'soft_care' | 'handoff_care' | 'urgent_care'
  memoryExtraction?: {
    memoriesExtracted: {
      memoryType: 'trigger' | 'pattern' | 'resilience' | 'vocabulary'
      category: string
      content: string
      confidenceScore: number
      source: 'chat' | 'mood_log' | 'journal'
    }[]
  }
  reasoning?: {
    detectedLanguage: string
    emotionalIntensity: string
    moodPattern: string
    modeSelected: string
    modeReason: string
    specialisationApplied: string
    memoryUsed: string
    crisisChecked: boolean
    responseStyle: string
    crisisTier?: string
    riskLevel?: string
    riskScore?: number
  } | null
}

export interface Conversation {
  id: string
  userId: string
  title: string
  mode: 'text' | 'voice'
  createdAt: string
  messages: Message[]
}

export enum Mood {
  Happy = 'happy',
  Calm = 'calm',
  Anxious = 'anxious',
  Sad = 'sad',
  Angry = 'angry',
  Overwhelmed = 'overwhelmed',
}

export interface MoodEntry {
  id: string
  userId: string
  mood: Mood
  triggerTag: string
  note: string
  date: string
}

export interface UserMemory {
  id: string
  userId: string
  memoryType: 'trigger' | 'pattern' | 'resilience' | 'vocabulary'
  content: string
  confidenceScore: number
  source: string
}

export interface UserPreferences {
  specialisation: string
  languageProfile: 'standard' | 'nigerian-english' | 'pidgin'
  adaptiveModeOverride: 'listening' | 'coach' | 'explorer' | 'companion' | 'care' | null
  onboardingComplete: boolean
}

export interface Recommendation {
  id: string
  icon: string
  text: string
  category: 'mindfulness' | 'social' | 'physical' | 'professional' | 'self-care'
}
