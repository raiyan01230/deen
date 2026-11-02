# Implementation Plan - Ayyam Al-Bid Fix & Notifications

The Ayyam Al-Bid tracker is currently failing due to rigid month-start calculations and a lack of background notification triggers. I will implement a more dynamic system that handles month transitions and ensures notifications are actually fired.

## 1. Core Logic Refinement
- **Fix Month Transitions**: Update `ayyamService.ts` to calculate both the current and the next Hijri month's fasting days. If current dates (13-15) have passed, the dashboard will automatically prioritize and highlight the upcoming month.
- **Robust Hijri Mapping**: Refine the calculation of the 1st of the Hijri month based on the astronomical tabular algorithm to ensure accuracy.
- **Correct Banner Logic**: Fix the countdown and "Today is Fasting" banner in `AyyamAlBidDashboard.tsx` to ensure it only triggers on the exact 13th, 14th, or 15th.

## 2. Notification System
- **In-App Notification Center**: Add an initialization logic in `App.tsx` that checks for Ayyam Al-Bid days within the next 3 days. It will generate persistent in-app notifications if they haven't been created yet.
- **Browser Pop-ups**: Trigger a `Notification` API call or a fallback custom modal when a user opens the app on a fasting day.
- **Email Trigger**: Ensure the frontend sends a request to the backend `/api/notifications/email-ayyam-al-bid` whenever a new fasting period is approaching (idempotency handled by Firestore).

## 3. UI/UX Improvements
- **Dual Month View**: The dashboard will now show the status of the current month and the dates for the upcoming month side-by-side or in a clear sequence.
- **Sync Status & Logs**: Ensure all fasting logs are correctly synced with Firestore so notifications are not duplicated across devices.
