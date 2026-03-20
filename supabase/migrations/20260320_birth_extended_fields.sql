-- Extended birth data fields for exact astrological calculations
-- Required for Swiss Ephemeris: lat/lon, country code, birth time known flag, gender
-- Applied after 20260314_hexastra_orchestration.sql which adds birth_date, birth_time, birth_location

alter table public.profiles add column if not exists birth_lat          double precision;
alter table public.profiles add column if not exists birth_lng          double precision;
alter table public.profiles add column if not exists birth_country_code text;
alter table public.profiles add column if not exists birth_time_known   boolean;
alter table public.profiles add column if not exists gender             text;
