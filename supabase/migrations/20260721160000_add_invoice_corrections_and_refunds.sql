alter table public.invoices
    add column if not exists correction_of_invoice_id uuid references public.invoices(id) on delete restrict,
    add column if not exists root_invoice_id uuid references public.invoices(id) on delete restrict,
    add column if not exists correction_reason_code text,
    add column if not exists correction_reason_text text,
    add column if not exists customer_visible_reason text,
    add column if not exists correction_scope text,
    add column if not exists correction_status text,
    add column if not exists correction_sequence integer,
    add column if not exists corrected_net_amount numeric,
    add column if not exists corrected_tax_amount numeric,
    add column if not exists corrected_gross_amount numeric,
    add column if not exists original_invoice_number text,
    add column if not exists original_invoice_date date,
    add column if not exists finalized_at timestamptz,
    add column if not exists finalized_by uuid,
    add column if not exists invoice_snapshot jsonb not null default '{}'::jsonb,
    add column if not exists idempotency_key text;

create table if not exists public.sale_refunds (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null,
    sale_id uuid not null references public.sales(id) on delete restrict,
    invoice_id uuid references public.invoices(id) on delete restrict,
    correction_invoice_id uuid references public.invoices(id) on delete restrict,
    customer_id uuid not null references public.customers(id) on delete restrict,
    refund_reference text not null,
    amount numeric not null,
    refund_method text not null,
    refund_date date not null,
    reason text not null,
    external_reference text,
    note text,
    status text not null default 'active',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    created_by uuid,
    updated_by uuid,
    is_voided boolean not null default false,
    voided_at timestamptz,
    voided_by uuid,
    void_reason text,
    metadata jsonb not null default '{}'::jsonb,
    constraint sale_refunds_amount_positive check (amount > 0),
    constraint sale_refunds_method_check check (refund_method in ('cash', 'bank')),
    constraint sale_refunds_status_check check (status in ('active', 'voided')),
    constraint sale_refunds_void_reason_check check (
        is_voided = false or nullif(btrim(coalesce(void_reason, '')), '') is not null
    )
);

create table if not exists public.invoice_correction_audit_log (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null,
    original_invoice_id uuid references public.invoices(id) on delete restrict,
    correction_invoice_id uuid references public.invoices(id) on delete restrict,
    refund_id uuid references public.sale_refunds(id) on delete restrict,
    action text not null,
    previous_values jsonb,
    new_values jsonb,
    reason text,
    changed_at timestamptz not null default now(),
    changed_by uuid
);

create unique index if not exists sale_refunds_company_refund_reference_key
on public.sale_refunds(company_id, refund_reference);

create unique index if not exists invoices_company_idempotency_key_key
on public.invoices(company_id, idempotency_key)
where idempotency_key is not null;

create unique index if not exists invoices_single_active_cancellation_key
on public.invoices(company_id, correction_of_invoice_id)
where invoice_type = 'cancellation_invoice'
  and coalesce(correction_status, '') <> 'VOIDED';

create index if not exists invoices_company_invoice_type_idx
on public.invoices(company_id, invoice_type);

create index if not exists invoices_company_correction_of_idx
on public.invoices(company_id, correction_of_invoice_id);

create index if not exists invoices_company_root_invoice_idx
on public.invoices(company_id, root_invoice_id);

create index if not exists invoices_company_correction_status_idx
on public.invoices(company_id, correction_status);

create index if not exists sale_refunds_company_sale_idx
on public.sale_refunds(company_id, sale_id);

create index if not exists sale_refunds_company_invoice_idx
on public.sale_refunds(company_id, invoice_id);

create index if not exists sale_refunds_company_correction_invoice_idx
on public.sale_refunds(company_id, correction_invoice_id);

create index if not exists sale_refunds_company_date_idx
on public.sale_refunds(company_id, refund_date);

create index if not exists sale_refunds_company_voided_idx
on public.sale_refunds(company_id, is_voided);

create index if not exists invoice_correction_audit_log_company_invoice_idx
on public.invoice_correction_audit_log(company_id, original_invoice_id, changed_at desc);

alter table public.invoices
    drop constraint if exists invoices_no_self_correction;

alter table public.invoices
    add constraint invoices_no_self_correction check (
        correction_of_invoice_id is null or correction_of_invoice_id <> id
    );

alter table public.invoices
    drop constraint if exists invoices_correction_scope_check;

alter table public.invoices
    add constraint invoices_correction_scope_check check (
        correction_scope is null or correction_scope in ('full', 'amount')
    );

alter table public.invoices
    drop constraint if exists invoices_correction_status_check;

alter table public.invoices
    add constraint invoices_correction_status_check check (
        correction_status is null or correction_status in (
            'DRAFT',
            'FINALIZATION_PENDING',
            'FINALIZED',
            'FINALIZATION_FAILED',
            'VOIDED',
            'CANCELLED',
            'PARTIALLY_CREDITED',
            'FULLY_CREDITED'
        )
    );

create or replace function public.next_sale_refund_reference(target_company_id uuid)
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
        hashtext(target_company_id::text || ':' || current_year || ':sale-refund-reference')
    );

    select coalesce(
        max(nullif(regexp_replace(refund_reference, '^REF-' || current_year || '-([0-9]+)$', '\1'), refund_reference)::integer),
        0
    ) + 1
    into next_number
    from public.sale_refunds
    where company_id = target_company_id
      and refund_reference ~ ('^REF-' || current_year || '-[0-9]+$');

    return 'REF-' || current_year || '-' || lpad(next_number::text, 6, '0');
end;
$$;

create or replace function public.set_sale_refunds_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    new.updated_at := now();
    if new.is_voided = true and old.is_voided = false then
        new.status := 'voided';
    end if;
    return new;
end;
$$;

drop trigger if exists trg_set_sale_refunds_updated_at on public.sale_refunds;
create trigger trg_set_sale_refunds_updated_at
before update on public.sale_refunds
for each row
execute function public.set_sale_refunds_updated_at();

create or replace function public.assert_invoice_correction_same_company()
returns trigger
language plpgsql
set search_path = public
as $$
declare
    referenced_company_id uuid;
begin
    if new.correction_of_invoice_id is not null then
        select company_id
        into referenced_company_id
        from public.invoices
        where id = new.correction_of_invoice_id;

        if referenced_company_id is null or referenced_company_id <> new.company_id then
            raise exception 'Korrekturbeleg und Originalrechnung müssen zum selben Unternehmen gehören.';
        end if;
    end if;

    if new.root_invoice_id is not null then
        select company_id
        into referenced_company_id
        from public.invoices
        where id = new.root_invoice_id;

        if referenced_company_id is null or referenced_company_id <> new.company_id then
            raise exception 'Korrekturkette muss zum selben Unternehmen gehören.';
        end if;
    end if;

    return new;
end;
$$;

drop trigger if exists trg_assert_invoice_correction_same_company on public.invoices;
create trigger trg_assert_invoice_correction_same_company
before insert or update of correction_of_invoice_id, root_invoice_id, company_id on public.invoices
for each row
execute function public.assert_invoice_correction_same_company();

alter table public.sale_refunds enable row level security;
alter table public.invoice_correction_audit_log enable row level security;

drop policy if exists "Users can manage sale refunds for their company" on public.sale_refunds;
create policy "Users can manage sale refunds for their company"
on public.sale_refunds
for all
using (
    exists (
        select 1
        from public.sales sale
        where sale.id = sale_refunds.sale_id
          and sale.company_id = sale_refunds.company_id
    )
)
with check (
    exists (
        select 1
        from public.sales sale
        where sale.id = sale_refunds.sale_id
          and sale.company_id = sale_refunds.company_id
    )
);

drop policy if exists "Users can read invoice correction audit for their company" on public.invoice_correction_audit_log;
create policy "Users can read invoice correction audit for their company"
on public.invoice_correction_audit_log
for select
using (
    exists (
        select 1
        from public.invoices invoice
        where invoice.id = coalesce(
            invoice_correction_audit_log.correction_invoice_id,
            invoice_correction_audit_log.original_invoice_id
        )
          and invoice.company_id = invoice_correction_audit_log.company_id
    )
);
