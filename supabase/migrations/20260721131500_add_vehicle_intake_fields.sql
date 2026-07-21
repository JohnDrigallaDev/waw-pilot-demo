alter table public.vehicles
add column if not exists mileage numeric,
add column if not exists color text,
add column if not exists vehicle_category text;
