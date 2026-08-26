# SaneSpace PRD Addendum: AI Readiness, Responsible AI, and Demo Readiness

## Insertion Guide

- Add **Why AI Is Necessary** under the existing **AI Solution** section. If the PRD does not have that heading, place it under **Technical Architecture** before model/provider details.
- Add **AI Reasoning Pipeline** immediately after **Why AI Is Necessary** or near the current technical architecture flow.
- Add **Risk Scoring and Escalation Thresholds** under **Responsible AI** after the crisis protocol overview.
- Add **Human Handoff Model** under **Human Oversight** or immediately after the crisis protocol section if Human Oversight is not yet a standalone section.
- Add **Data Pipeline** under **Data & Build** after the database/schema overview.
- Add **Evaluation Metrics** near the end of the PRD, after success metrics or before roadmap/demo sections.
- Add **Demo Story for Judges** near the hackathon/demo section or immediately before the final pitch.
- Replace or strengthen the existing pitch section with **Updated Pitch**.

## Why AI Is Necessary

SaneSpace needs AI because emotional support is not static. A static resource list can provide links, articles, or emergency numbers, but it cannot understand the emotional meaning behind how Nigerians actually express stress, exhaustion, shame, fear, or overwhelm in everyday language.

SaneSpace is designed for conversations where users may switch between Nigerian English, Pidgin, Lagos English, Nigerian Student English, Home English, and Neutral English. The system must recognize emotionally indirect phrases, slang, humor, code-switching, and culturally specific pressure points such as academic performance, money stress, family expectations, social comparison, relationship strain, and stigma around asking for help.

AI is necessary because SaneSpace must:

- Understand Nigerian English, Pidgin, code-switching, and emotionally indirect phrases.
- Detect whether the user is venting, asking for advice, spiraling, joking, reflecting, or showing distress.
- Adapt between Listener, Coach, Explorer, Companion, and Care Mode in real time.
- Remember recurring emotional patterns across sessions.
- Identify repeated triggers such as exams, money, family pressure, sleep, relationships, or social comparison.
- Match the user's natural language, emotional register, and preferred support style.
- Escalate safely when the user shows crisis signals.

SaneSpace is not using AI only to chat. It uses AI for language understanding, emotional reasoning, adaptive response selection, pattern detection, memory extraction, and safety escalation. The product value comes from combining culturally aware conversation with structured emotional memory and responsible risk handling.

## AI Reasoning Pipeline

SaneSpace uses a step-by-step AI pipeline that connects natural language understanding, emotional pattern detection, memory, adaptive response selection, and safety handling.

**Pipeline:** User input -> Language detection -> Emotion and intensity scoring -> Intent detection -> Risk classification -> Memory retrieval -> Adaptive mode selection -> Response generation -> Post-session memory extraction -> Dashboard update

1. **User Input**
   The user sends a typed message, voice transcript, mood check-in, or optional journal note. Voice input is transcribed before entering the same reasoning pipeline as text.

2. **Language Detection**
   The system identifies whether the user is communicating in Nigerian Pidgin, Lagos English, Nigerian Student English, Home English, Neutral English, or a code-switched mix. This informs tone, phrasing, and response style.

3. **Emotion and Intensity Scoring**
   The system detects emotional states such as stress, sadness, anxiety, anger, exhaustion, loneliness, frustration, relief, or calm reflection. It also estimates intensity so the response can match the seriousness of the moment.

4. **Intent Detection**
   The system determines whether the user wants to vent, receive advice, reflect deeply, joke casually, process a recurring issue, ask for urgent help, or continue a previous emotional thread.

5. **Risk Classification**
   The system checks for distress signals such as hopelessness, self-harm language, danger statements, abuse indicators, immediate crisis, or harm to self or others. This step decides whether normal support should continue or whether Care Mode and crisis support guidance are required.

6. **Memory Retrieval**
   The system retrieves the top relevant emotional memory entries from the `user_memory` table, such as recurring triggers, vocabulary patterns, recent stress themes, resilience markers, and preferred support style.

7. **Adaptive Mode Selection**
   The system chooses the most appropriate companion mode: Listener, Coach, Explorer, Companion, or Care Mode. This selection is based on emotion, intensity, intent, risk level, user-selected specialisation, language profile, and relevant memory.

8. **Response Generation**
   The AI generates a response using the selected mode, language profile, specialisation, and retrieved memory. The response should provide supportive guidance, evidence-informed techniques where appropriate, and culturally familiar language without claiming to diagnose or provide therapy.

9. **Post-Session Memory Extraction**
   After the response, a background process extracts structured memory updates such as trigger category, emotion label, emotional intensity, repeated patterns, vocabulary fingerprint, and resilience markers.

10. **Dashboard Update**
    The dashboard refreshes the user's emotional story, recurring triggers, mood trends, resilience signals, and weekly AI narrative.

### Sample Flow

User says: "Omo I no fit again, this exam and money matter don tire me."

The system detects Nigerian Pidgin, high stress, academic and financial triggers, no explicit self-harm language, and a need for emotional validation before advice. It retrieves previous memory about exam anxiety and selects Listener Mode. The AI responds in warm Nigerian Student English/Pidgin, validates the pressure first, and offers a small grounding step. After the session, the system updates the memory graph with academic pressure and financial stress as active recurring triggers.

## Risk Scoring and Escalation Thresholds

SaneSpace does not replace therapists, doctors, counselors, or emergency services. Its risk system is designed to identify when normal AI support should stop or soften, and when the user should be guided toward real human support.

| Risk Level | Example Signals | System Action |
| --- | --- | --- |
| Low Risk | Stress, sadness, frustration, tiredness, academic pressure, general anxiety | Respond normally using Listener, Coach, Explorer, or Companion Mode. |
| Medium Risk | Repeated hopelessness, panic, intense distress, "I can't cope," "everything is too much," repeated negative mood entries | Switch to Care Mode, provide a grounding exercise, suggest contacting a trusted person, and check if the user is safe. |
| High Risk | Self-harm language, danger statements, "I want to disappear," "I might hurt myself," "I don't want to be here" | Stop normal conversation flow, respond with compassion, provide Nigerian crisis resources, encourage immediate human support, and log a hashed crisis event. |
| Critical Risk | Direct intent, plan, timeframe, immediate danger, harm to self or others | Use Urgent Care Mode, advise contacting emergency services or a trusted nearby person immediately, show crisis resources, and avoid continuing normal AI coaching. |

### Confidence Thresholds

- **Below 0.50:** Continue the normal support flow.
- **0.50-0.74:** Monitor closely and use softer Care Mode language.
- **0.75-0.89:** Enter Care Mode and recommend human support.
- **0.90 and above:** Trigger the crisis protocol, stop normal AI response, and show urgent support resources.

These thresholds are MVP rules. They should be improved through testing, expert review, red-team evaluation, and analysis of anonymized safety outcomes.

## Human Handoff Model

SaneSpace is a mental wellness companion, not a replacement for licensed care. The AI can support early reflection, emotional journaling, pattern detection, coping guidance, and culturally familiar conversation, but humans are needed for crisis, chronic distress, self-harm risk, abuse, diagnosis, medication decisions, and emergency situations.

For the MVP, human handoff means:

- Encouraging the user to contact a trusted person immediately.
- Showing Nigerian-relevant crisis support resources.
- Suggesting campus counselors or student affairs support where applicable.
- Suggesting a verified mental health organization or affordable therapist referral where available.
- Asking the user if they are in immediate danger and guiding them toward real-world support.

Future versions should include:

- A verified therapist and referral network.
- Optional user-consented escalation to a human supporter or professional.
- Campus counselor and student affairs partnerships.
- Human review of anonymized safety logs.
- Expert-reviewed crisis scripts and safety playbooks.

The intended boundary is clear: SaneSpace provides supportive guidance and emotional pattern awareness, while human professionals and trusted real-world support systems handle high-risk, clinical, or emergency needs.

## Data Pipeline

SaneSpace collects and processes three main data streams:

1. **Chat and Voice Transcripts**
   User messages and voice transcripts provide the main conversational context for language detection, emotional reasoning, response generation, and memory extraction.

2. **Mood Check-Ins**
   Mood entries provide structured trend data, helping the system identify recurring emotional states, intensity changes, and repeated triggers over time.

3. **Optional Journal Notes**
   Journal notes allow users to reflect outside live chat. These notes can help identify themes, resilience markers, and repeated stressors when the user chooses to provide them.

### AI-Extracted Fields

The AI extracts structured metadata from user interactions, including:

- Trigger category.
- Mood or emotion label.
- Emotional intensity.
- User language profile.
- Repeated patterns.
- Resilience markers.
- Crisis risk metadata.

### Stored Data

The system stores:

- Messages for conversation history.
- Mood entries for trend tracking.
- Structured memory entries in `user_memory`.
- Hashed crisis logs without storing full crisis content.

### Privacy-Conscious Handling

- Crisis logs store hashed excerpts or event metadata, not full sensitive crisis text.
- Memory entries are structured summaries, not raw psychological diagnoses.
- Users can change their language profile and specialisation.
- Future versions should include memory deletion, export controls, and more granular consent settings.

## Evaluation Metrics

SaneSpace should be evaluated with measurable product, AI, safety, and user experience metrics.

### Language Understanding

- Accuracy on Nigerian English and Pidgin test phrases.
- Correct detection of code-switching.

### Adaptive Mode Accuracy

- Percentage of test messages routed to the correct mode: Listener, Coach, Explorer, Companion, or Care Mode.

### Risk Detection

- Percentage of crisis test cases correctly escalated.
- False negative rate for high-risk messages.
- False positive rate for normal stress messages.

### Memory Quality

- Whether the AI correctly recalls top triggers.
- Whether memory entries improve over repeated sessions.
- Whether resilience markers are surfaced accurately.

### User Experience

- User rating after session.
- Mood check-in completion rate.
- Return rate after first conversation.
- Average response time for voice sessions.

### Responsible AI

- Number of crisis events handled with the correct protocol.
- Percentage of high-risk conversations where human support guidance was shown.
- Number of AI responses blocked for diagnosis, medication, or unsafe advice.

## Demo Story for Judges

A Nigerian student signs up before exams. During onboarding, they choose Student Support and Nigerian Pidgin. They tell SaneSpace: "Omo I'm cooked, my CGPA go suffer."

SaneSpace detects Nigerian Student English/Pidgin, academic stress, and high emotional intensity. It starts in Listener Mode and validates the pressure without rushing into advice. The response feels familiar, calm, and culturally aware, while avoiding clinical claims.

When the user asks, "What should I do now?" SaneSpace switches into Coach Mode and gives a small realistic study recovery plan: one short revision block, one priority topic, a water break, and a gentle reset before continuing. The goal is supportive guidance, not perfection.

The next day, the user logs a mood check-in with the trigger "exams." The dashboard updates to show academic pressure as a recurring trigger and adds it to the emotional story panel.

Later, the user says something more serious: "I no fit continue like this." SaneSpace detects increased risk, switches into Care Mode, checks whether the user is in immediate danger, provides Nigerian crisis support guidance, and encourages contacting a trusted person or professional support.

This demo proves SaneSpace is not a generic chatbot. It is a culturally aware emotional support system that understands Nigerian expression, adapts its response mode, remembers emotional patterns, and escalates safely when AI should not act alone.

## Updated Pitch

SaneSpace is an AI wellness companion built for Nigerians who need emotional support but cannot always access therapy. Unlike generic wellness apps, SaneSpace understands Nigerian English, Pidgin, student slang, family pressure, academic stress, financial anxiety, and the stigma around asking for help. It uses AI not just to chat, but to detect emotional signals, adapt between listening and coaching, remember recurring patterns, and trigger safe human handoff when distress becomes serious. Our goal is to make support feel culturally familiar, emotionally intelligent, and available at the moment people need it most.
