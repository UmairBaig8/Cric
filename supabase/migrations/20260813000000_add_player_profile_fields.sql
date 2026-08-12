alter table public.registrations
  add column if not exists player_type text,
  add column if not exists batting_style text,
  add column if not exists bowling_style text,
  add column if not exists bowling_arm text,
  add column if not exists cricket_experience text,
  add column if not exists jersey_size text,
  add column if not exists availability text;

update public.registrations
set
  player_type = coalesce(player_type, 'Batter'),
  batting_style = coalesce(batting_style, 'Right-hand batter'),
  bowling_style = coalesce(bowling_style, 'Do not bowl'),
  bowling_arm = coalesce(bowling_arm, 'Not applicable'),
  cricket_experience = coalesce(cricket_experience, 'Casual player'),
  jersey_size = coalesce(jersey_size, 'M'),
  availability = coalesce(availability, 'Available for all matches');

alter table public.registrations
  alter column player_type set not null,
  alter column batting_style set not null,
  alter column bowling_style set not null,
  alter column bowling_arm set not null,
  alter column cricket_experience set not null,
  alter column jersey_size set not null,
  alter column availability set not null;

alter table public.registrations
  add constraint registrations_player_type_check check (player_type in ('Batter', 'Bowler', 'All-rounder', 'Wicketkeeper-batter')),
  add constraint registrations_batting_style_check check (batting_style in ('Right-hand batter', 'Left-hand batter')),
  add constraint registrations_bowling_style_check check (bowling_style in ('Right-arm pace', 'Left-arm pace', 'Right-arm spin', 'Left-arm spin', 'Do not bowl')),
  add constraint registrations_bowling_arm_check check (bowling_arm in ('Right arm', 'Left arm', 'Not applicable')),
  add constraint registrations_experience_check check (cricket_experience in ('New to cricket', 'Casual player', 'Club / college player', 'Experienced league player')),
  add constraint registrations_jersey_size_check check (jersey_size in ('S', 'M', 'L', 'XL', 'XXL')),
  add constraint registrations_availability_check check (availability in ('Available for all matches', 'Available for most matches', 'Need schedule confirmation'));
