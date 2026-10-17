-- Apply before deploying the Written Prep handler. Only the service-role Edge
-- handler may submit answers; clients receive publicQuestion projections only.
create or replace function public.answer_written_prep(
  p_user_id uuid, p_session_id uuid, p_track text, p_question_id text,
  p_question_index integer, p_submission_id uuid, p_choice integer
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  s public.written_prep_sessions%rowtype;
  st public.written_prep_stats%rowtype;
  q jsonb;
  replay_index integer;
  correct boolean;
  next_index integer;
  answer_score integer;
  answered_at timestamptz := now();
begin
  if p_user_id is null or p_session_id is null or p_submission_id is null
     or p_question_id is null or p_question_index is null or p_question_index < 0
     or p_choice is null then
    return jsonb_build_object('status',400,'error','Invalid answer request.');
  end if;

  select * into s from public.written_prep_sessions
    where id=p_session_id and user_id=p_user_id and track=p_track for update;
  if not found then
    return jsonb_build_object('status',404,'error','Study session not found.');
  end if;

  select (item.ordinality-1)::integer into replay_index
    from jsonb_array_elements(s.question_payload) with ordinality as item(value,ordinality)
    where item.value->>'submissionId'=p_submission_id::text limit 1;
  if replay_index is not null then
    q := s.question_payload->replay_index;
    if replay_index<>p_question_index or q->>'id'<>p_question_id or (q->>'selected')::integer<>p_choice then
      return jsonb_build_object('status',409,'code','submission_conflict','error','This answer request was already used.');
    end if;
  else
    if s.completed_at is not null then
      return jsonb_build_object('status',409,'code','session_complete','error','This session is complete.');
    end if;
    q := s.question_payload->p_question_index;
    if p_question_index<>s.current_index or q is null or q->>'id' is distinct from p_question_id then
      return jsonb_build_object('status',409,'code','stale_question','error','This question has already changed. Resume the saved session.');
    end if;
    if p_choice<0 or p_choice>=jsonb_array_length(q->'options') then
      return jsonb_build_object('status',400,'error','Invalid answer choice.');
    end if;
    correct := p_choice=(q->>'correct')::integer;
    insert into public.written_prep_stats as existing
      (user_id,track,question_id,skill_area,standard_code,standard_doc,difficulty,
       correct_count,total_count,correct_streak,last_result,last_seen_at,updated_at)
    values(p_user_id,p_track,p_question_id,q->>'area',q->>'standardCode',q->>'standardDoc',q->>'difficulty',
       correct::integer,1,correct::integer,correct,answered_at,answered_at)
    on conflict(user_id,track,question_id) do update set
      skill_area=excluded.skill_area,standard_code=excluded.standard_code,
      standard_doc=excluded.standard_doc,difficulty=excluded.difficulty,
      correct_count=existing.correct_count+excluded.correct_count,
      total_count=existing.total_count+1,
      correct_streak=case when correct then existing.correct_streak+1 else 0 end,
      last_result=correct,last_seen_at=answered_at,updated_at=answered_at
    returning * into st;
    update public.written_prep_stats set
      mastery=least(100,round((st.correct_count::numeric/st.total_count*72+least(st.correct_streak,5)*5.6),2)),
      due_at=answered_at+case when not correct then interval '10 minutes'
        when st.correct_streak<=1 then interval '1 day'
        when st.correct_streak=2 then interval '3 days'
        when st.correct_streak=3 then interval '7 days'
        when st.correct_streak=4 then interval '14 days' else interval '30 days' end
      where user_id=p_user_id and track=p_track and question_id=p_question_id
      returning * into st;
    q := q || jsonb_build_object('selected',p_choice,'result',correct,'answeredAt',answered_at,
      'submissionId',p_submission_id,'answerMastery',st.mastery);
    s.question_payload := jsonb_set(s.question_payload,array[p_question_index::text],q);
    next_index := p_question_index+1;
    update public.written_prep_sessions set question_payload=s.question_payload,
      current_index=next_index,answered=next_index,score=s.score+correct::integer,
      completed_at=case when next_index>=jsonb_array_length(s.question_payload) then answered_at else null end,
      updated_at=answered_at where id=s.id returning * into s;
  end if;
  next_index := p_question_index+1;
  select count(*)::integer into answer_score
    from jsonb_array_elements(s.question_payload) with ordinality as item(value,ordinality)
    where item.ordinality<=next_index and item.value->>'result'='true';
  return jsonb_build_object('session',to_jsonb(s)||jsonb_build_object(
    'current_index',next_index,'answered',next_index,'score',answer_score,
    'completed_at',case when next_index>=jsonb_array_length(s.question_payload) then q->>'answeredAt' else null end));
end;
$$;

revoke all on function public.answer_written_prep(uuid,uuid,text,text,integer,uuid,integer) from public,anon,authenticated;
grant execute on function public.answer_written_prep(uuid,uuid,text,text,integer,uuid,integer) to service_role;
