# Implementation Plan - Islamic Self-Improvement Tracker

Add a new, dedicated section to the app for tracking spiritual growth through daily reports, progressive challenges, and AI-compatible analytics.

## User Review & Critical Decisions

> [!IMPORTANT]
> The challenges will follow a strict sequential unlock: Day 1 tasks must be completed before Day 2 is visible. Completion of Challenge 01 (7 days) unlocks Challenge 02. Progress is preserved even if days are missed.

- **Navigation**: A new "Self-Improvement" tab will be added to the sidebar/navigation.
- **Report Format**: Markdown blocks optimized for ChatGPT interaction.
- **Task Content**: I will use the descriptions provided in your prompt to create 7 progressive daily tasks for the first challenge (Ghibah-Free) and placeholders for the others, which you can refine.
- **Guidance Tone**: Constructive, focusing on "necessary discussion" vs "ghibah" and "unintentional laughter" vs "mockery".

## 1. Overview & Core Concept

- **What It Does**: A comprehensive muhasabah (self-accounting) system. It combines a structured daily form with a gamified roadmap of 5 thematic challenges.
- **Key Value**: Provides a centralized place for spiritual auditing and generates professional reports that can be analyzed by AI (like ChatGPT) for personalized advice.

## 2. User Experience & Visual Design

- **Daily Report View**: A clean, multi-step form with emerald-themed toggles for Salah and checkboxes for behavioral tracking.
- **Challenge Roadmap**: A visual vertical timeline showing 5 challenges. Locked challenges will have a frosted-glass blur effect.
- **Task Reveal**: Only the active day's task will be visible. Future tasks are shown as "Day X - Locked".
- **Export UI**: A "Report Center" where users can click "Copy Today's Markdown" or "Weekly Summary".

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Persistence Strategy**
    - *Chosen Approach*: Firestore as the primary source with `onSnapshot` for real-time sync, matching the existing `DailyDeeds` pattern.
    - *Why*: Ensures data survives device changes and refreshes without manual saving.
- **Decision 2: Locking Logic**
    - *Chosen Approach*: Date-independent task completion.
    - *Why*: If a user misses a day, they don't lose progress; they simply resume the challenge at the task they left off.

## 4. Technical Architecture & Data Strategy

### System Diagram
```unicode
┌────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  Navigation    │ ───> │ ImprovementLog   │ <──> │ Firestore       │
│  (New Tab)     │      │ (State Provider) │      │ (improvementLogs)│
└────────────────┘      └─────────┬────────┘      └─────────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          ▼                       ▼                       ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ DailyReportForm  │    │ ChallengeRoadmap │    │ ReportGenerator  │
│ (Form Logic)     │    │ (Unlock Logic)   │    │ (Markdown logic) │
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

### New Data Entities (src/types/improvement.ts)
- `ImprovementLog`: `{ date, salah, ghibah, laughter, deeds, mistakes, goals, reflection }`
- `UserChallengeState`: `{ currentChallenge: number, completedTaskIds: string[] }`

### Components to Create
1. `ImprovementTracker.tsx`: Main parent container with tab internal navigation (Form, Roadmap, Analytics).
2. `DailyReportForm.tsx`: Controlled inputs for all tracking fields.
3. `ChallengeRoadmap.tsx`: Logic to handle `currentDay` and task unlocking.
4. `TrackerAnalytics.tsx`: Summaries of "Repeated Mistakes" and "Positive Improvements".

## 5. Implementation Roadmap

1. **Step 1: Type Definitions & Data Service**: Define interfaces and add `saveImprovementLog`/`getImprovementLogs` to `src/services/dataService.ts`.
2. **Step 2: Navigation Update**: Add the new item to `NAV_ITEMS` in `src/components/Navigation.tsx`.
3. **Step 3: Core UI**: Build the `DailyReportForm` and `ImprovementTracker` layout.
4. **Step 4: Challenge Logic**: Implement the 5-challenge data file and the unlocking state engine.
5. **Step 5: Export & Reports**: Build the Markdown generator and copy-to-clipboard functionality.
6. **Step 6: Analytics**: Create the 7/14/30 day summary views.
