-- Expand profile progression without changing existing values.
-- Safe additive constraint migration; no user rows are deleted or rewritten.

alter table public.profiles
  drop constraint if exists profiles_pilot_stage_check;

alter table public.profiles
  add constraint profiles_pilot_stage_check
  check (pilot_stage in (
    'student',
    'private',
    'instrument',
    'commercial',
    'cfi',
    'cfii',
    'mei',
    'atp',
    'other'
  ));
