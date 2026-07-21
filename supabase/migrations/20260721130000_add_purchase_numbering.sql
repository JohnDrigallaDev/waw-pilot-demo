create unique index if not exists purchase_cases_company_purchase_number_key
on public.purchase_cases(company_id, purchase_number)
where purchase_number is not null;

create or replace function public.next_purchase_number(target_company_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
    current_year text := to_char(now(), 'YYYY');
    next_number integer;
begin
    perform pg_advisory_xact_lock(
        hashtext(target_company_id::text || ':' || current_year || ':purchase-number')
    );

    select coalesce(
        max(nullif(regexp_replace(purchase_number, '^AK-' || current_year || '-([0-9]+)$', '\1'), purchase_number)::integer),
        0
    ) + 1
    into next_number
    from public.purchase_cases
    where company_id = target_company_id
      and purchase_number ~ ('^AK-' || current_year || '-[0-9]+$');

    return 'AK-' || current_year || '-' || lpad(next_number::text, 6, '0');
end;
$$;
