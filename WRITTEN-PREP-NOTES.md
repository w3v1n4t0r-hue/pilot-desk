# PilotDesk Written Prep

PilotDesk Written Prep is a free, account-gated knowledge-test study system for PPL/PAR, Instrument/IRA, Commercial/CAX, CFI/FIA, CFII/FII, and ATP/ATM.

## Source guardrail

The FAA does not publish its active knowledge-test item bank. PilotDesk must never claim that its question bank contains the current confidential FAA test questions. The bank combines paraphrased concepts from FAA-published sample questions with original FAA-aligned practice questions grounded in current regulations, FAA handbooks, AIM material, and applicable testing standards.

## Study loop

- Adaptive study prioritizes unseen, due, and low-mastery questions.
- Missed Questions filters to the user’s most recently missed items.
- Marked Questions uses account-synced bookmarks.
- Random Drill samples across the selected track.
- Practice Exam hides correctness until the session ends.
- Wrong answers become due quickly; correct streaks push the item farther out.
- Readiness combines accuracy and bank coverage so a high score on only a few questions does not look test-ready.

All progress writes and grading are performed by the `written-prep` Supabase Edge Function. Browser clients do not contain answer keys and cannot directly modify Written Prep progress tables.
