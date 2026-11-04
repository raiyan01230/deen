# Implementation Plan - Hadith Library Expansion & Random Rotation

Expand the "My Deen & Life" Hadith module by adding ~20 new verified Sahih narrations and switching the dashboard display from a deterministic daily rotation to a random selection that refreshes on every visit.

## User Review & Critical Decisions

> [!IMPORTANT]
> The Hadith rotation will now be truly random. Every time you refresh the page or navigate back to the Home tab, a different verified Sahih Hadith will appear.

- **Confirmed Collections**: Sahih al-Bukhari, Sahih Muslim, Sunan Abu Dawood, and Sunan al-Tirmidhi.
- **Confirmed Source**: Official Islamic Foundation Bangladesh (IFB) translations.
- **Rotation Logic**: Random selection from the verified library on each component initialization.

## 1. Overview & Core Concept

- **What It Does**: Populates the app with more authentic spiritual guidance and ensures the dashboard feels dynamic by showing a new Hadith upon every refresh.
- **Key Value**: Provides a richer library of authentic Sahih narrations and increases engagement through variety.

## 2. User Experience & Visual Design

- **Dashboard Refresh**: The "Hadith of the Day" card on the Home dashboard will display a different random Hadith each time the app loads.
- **Updated Labels**:
    - Title: "নির্বাচিত সহীহ হাদিস (র‍্যান্ডম)" (Selected Sahih Hadith (Random))
    - Subtitle: "হাদিস ভাণ্ডার লাইব্রেরি: [X]টি পরীক্ষিত সহীহ হাদিস" (Hadith Library: [X] Verified Sahih Hadiths)
- **Visual Identity**: Maintains the current "clay-card" aesthetic with emerald/amber accents.

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Random vs Session-based Random**
    - *Chosen Approach*: Pure random on mount.
    - *Why*: User explicitly asked for "refresh or visit" to show a new one.
- **Decision 2: Hardcoded vs Dynamic Data**
    - *Chosen Approach*: Expanding the `INITIAL_SAHIH_HADITHS` array in `hadithLibrary.ts`.
    - *Why*: Simplifies deployment and ensures a solid baseline of 40+ hadiths without requiring external API calls every time.

## 4. Technical Architecture & Data Strategy

### Component & Service Mapping

```drawio
┌──────────────────────┐      ┌───────────────────────────┐
│     HomeDashboard    │ ───> │     HadithOfTheDay        │
│ (Triggers Load)      │      │ (Displays Random Record)  │
└──────────┬───────────┘      └─────────────┬─────────────┘
           │                                │
           ▼                                ▼
┌──────────────────────┐      ┌───────────────────────────┐
│     App.tsx          │ <─── │    hadithService.ts       │
│ (State Management)   │      │ (getHadithOfTheDay Logic) │
└──────────┬───────────┘      └─────────────┬─────────────┘
           │                                │
           ▼                                ▼
┌──────────────────────┐      ┌───────────────────────────┐
│  hadithLibrary.ts    │      │    hadith.ts (Types)      │
│  (Data Expansion)    │      │                           │
└──────────────────────┘      └───────────────────────────┘
```

### Technical Steps

1.  **Data Expansion**:
    *   Update `src/data/hadithLibrary.ts` to include ~20 new records with Arabic, Bengali (IFB), Narrator, Collection, and Source URL.
2.  **Rotation Logic Update**:
    *   Modify `src/services/hadithService.ts`:
        *   Refactor `getHadithOfTheDay` to implement `Math.random()` based selection.
        *   (Optional) Rename to `getRandomHadith` for clarity, though `getHadithOfTheDay` can be kept as a generic "Dashboard Hadith" getter.
3.  **UI Label Refinement**:
    *   Update `src/components/HadithOfTheDay.tsx` header text to "(র‍্যান্ডম)".
4.  **Verification**:
    *   Ensure the "Verified Count" updates correctly in the UI.
    *   Test that refresh indeed shows a new narration.
