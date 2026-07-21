create or replace function public.next_sale_number(target_company_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
    next_number integer;
begin
    perform pg_advisory_xact_lock(hashtext(target_company_id::text || ':sale-number'));

    select coalesce(
        max(nullif(regexp_replace(sale_number, '^VK-?([0-9]+)$', '\1'), sale_number)::integer),
        0
    ) + 1
    into next_number
    from public.sales
    where company_id = target_company_id
      and sale_number ~ '^VK-?[0-9]+$';

    return 'VK-' || next_number::text;
end;
$$;

create unique index if not exists sales_one_active_sale_per_vehicle_idx
on public.sales(company_id, vehicle_id)
where status = 'active';

create unique index if not exists sales_company_sale_number_key
on public.sales(company_id, sale_number)
where sale_number is not null;

create unique index if not exists vehicles_company_vin_key
on public.vehicles(company_id, vin)
where vin is not null;

create unique index if not exists vehicles_company_internal_number_key
on public.vehicles(company_id, internal_number)
where internal_number is not null;

create index if not exists customers_sale_flow_search_idx
on public.customers(company_id, company_name, first_name, last_name, email, phone, vat_id, postal_code, city);

create index if not exists vehicles_sale_flow_search_idx
on public.vehicles(company_id, vin, internal_number, manufacturer, model, license_plate, status);
