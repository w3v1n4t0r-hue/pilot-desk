-- Expand profile progression without rewriting existing profile rows.
-- Apply through the normal Supabase migration path.

alter table public.profiles
  drop constraint if exists profiles_pilot_stage_check;

alter table public.profiles
  add constraint profiles_pilot_stage_check
  check (
    pilot_stage is null
    or pilot_stage = any (array[
      'student','private','instrument','commercial','cfi','cfii','mei','atp','other'
    ])
  );
