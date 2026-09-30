-- Place and landmark are read together; reject unsafe phrases across their boundary.
create or replace function public.pilot_safe_text(p_text text)
returns boolean language sql immutable set search_path = '' as $$
  select p_text is null or (length(p_text) <= 301 and lower(p_text) !~
    '(my ex|the guy in|is john|wearing a|apartment|house|where he lives|camera|guard|security|locked|alarm|side door|follow|watch him|watch her|license plate|number plate|\m(fuck|fucking|shit|bitch|porn|rape|rapist|nazi|kill yourself|kill you|i will kill|hate you)\M)');
$$;
update public.pilot_requests set hidden = true
where not public.pilot_safe_text(place_name || ' ' || landmark);
alter table public.pilot_requests add constraint pilot_combined_place_safe
check (hidden or public.pilot_safe_text(place_name || ' ' || landmark));
