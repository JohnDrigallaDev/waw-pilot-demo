create or replace function public.next_email_reference(target_company_id uuid)
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
        hashtext(target_company_id::text || ':' || current_year || ':email-reference')
    );

    select coalesce(
        max(nullif(regexp_replace(email_reference, '^MAIL-' || current_year || '-([0-9]+)$', '\1'), email_reference)::integer),
        0
    ) + 1
    into next_number
    from public.email_messages
    where company_id = target_company_id
      and email_reference ~ ('^MAIL-' || current_year || '-[0-9]+$');

    return 'MAIL-' || current_year || '-' || lpad(next_number::text, 6, '0');
end;
$$;

create table if not exists public.email_messages (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null,
    email_reference text not null,
    context_type text not null,
    context_id uuid,
    template_key text,
    sender_name text not null,
    sender_email text not null,
    reply_to_email text,
    to_recipients jsonb not null,
    cc_recipients jsonb not null default '[]'::jsonb,
    bcc_recipients jsonb not null default '[]'::jsonb,
    subject text not null,
    body_html text not null,
    body_text text,
    status text not null,
    provider text not null default 'resend',
    provider_message_id text,
    provider_response jsonb,
    idempotency_key text not null,
    scheduled_at timestamptz,
    sent_at timestamptz,
    delivered_at timestamptz,
    failed_at timestamptz,
    failure_code text,
    failure_message text,
    retry_count integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    created_by uuid,
    updated_by uuid,
    metadata jsonb not null default '{}'::jsonb,
    constraint email_messages_status_check check (
        status in (
            'DRAFT',
            'READY_TO_SEND',
            'SENDING',
            'SENT',
            'DELIVERED',
            'FAILED',
            'CANCELLED',
            'BOUNCED',
            'COMPLAINED',
            'REJECTED',
            'LEGACY_SENT'
        )
    ),
    constraint email_messages_context_type_check check (
        context_type in (
            'SALE',
            'PURCHASE',
            'VEHICLE',
            'CUSTOMER',
            'PARTNER',
            'INVOICE',
            'PAYMENT',
            'REFUND',
            'DOCUMENT',
            'FINANCIAL_ENTRY',
            'GENERAL'
        )
    )
);

create table if not exists public.email_attachments (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null,
    email_message_id uuid not null references public.email_messages(id) on delete restrict,
    document_id uuid references public.documents(id) on delete restrict,
    document_version_id uuid references public.document_versions(id) on delete restrict,
    file_name text not null,
    mime_type text not null,
    file_size_bytes bigint not null,
    attachment_type text not null,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    created_by uuid,
    metadata jsonb not null default '{}'::jsonb,
    constraint email_attachments_file_size_check check (file_size_bytes >= 0)
);

create table if not exists public.email_relations (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null,
    email_message_id uuid not null references public.email_messages(id) on delete restrict,
    relation_type text not null,
    relation_id uuid not null,
    created_at timestamptz not null default now(),
    created_by uuid,
    metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.email_templates (
    id uuid primary key default gen_random_uuid(),
    company_id uuid,
    template_key text not null,
    name text not null,
    description text,
    context_type text not null,
    subject_template text not null,
    body_html_template text not null,
    body_text_template text,
    active boolean not null default true,
    is_system_template boolean not null default false,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    created_by uuid,
    updated_by uuid
);

create table if not exists public.email_delivery_attempts (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null,
    email_message_id uuid not null references public.email_messages(id) on delete restrict,
    attempt_number integer not null,
    provider text not null,
    provider_message_id text,
    status text not null,
    requested_at timestamptz not null default now(),
    completed_at timestamptz,
    failure_code text,
    failure_message text,
    provider_response jsonb,
    created_by uuid
);

create table if not exists public.email_provider_events (
    id uuid primary key default gen_random_uuid(),
    provider text not null,
    provider_event_id text not null,
    provider_message_id text not null,
    event_type text not null,
    payload jsonb not null default '{}'::jsonb,
    received_at timestamptz not null default now(),
    processed_at timestamptz,
    processing_status text not null default 'pending',
    error_message text
);

create table if not exists public.email_audit_log (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null,
    email_message_id uuid references public.email_messages(id) on delete restrict,
    action text not null,
    previous_values jsonb,
    new_values jsonb,
    reason text,
    changed_at timestamptz not null default now(),
    changed_by uuid
);

create unique index if not exists email_messages_company_reference_key
on public.email_messages(company_id, email_reference);

create unique index if not exists email_messages_company_idempotency_key
on public.email_messages(company_id, idempotency_key);

create unique index if not exists email_provider_events_provider_event_key
on public.email_provider_events(provider, provider_event_id);

create unique index if not exists email_attachments_unique_document_version_key
on public.email_attachments(email_message_id, document_id, document_version_id)
where document_id is not null;

create unique index if not exists email_relations_unique_relation_key
on public.email_relations(email_message_id, relation_type, relation_id);

create unique index if not exists email_delivery_attempts_attempt_key
on public.email_delivery_attempts(email_message_id, attempt_number);

create unique index if not exists email_templates_system_key
on public.email_templates(template_key)
where company_id is null;

create unique index if not exists email_templates_company_key
on public.email_templates(company_id, template_key)
where company_id is not null;

create index if not exists email_messages_company_status_idx
on public.email_messages(company_id, status, created_at desc);

create index if not exists email_messages_company_context_idx
on public.email_messages(company_id, context_type, context_id, created_at desc);

create index if not exists email_messages_company_sent_idx
on public.email_messages(company_id, sent_at desc);

create index if not exists email_attachments_message_idx
on public.email_attachments(company_id, email_message_id, sort_order);

create index if not exists email_attachments_document_idx
on public.email_attachments(company_id, document_id, document_version_id);

create index if not exists email_relations_lookup_idx
on public.email_relations(company_id, relation_type, relation_id);

create index if not exists email_delivery_attempts_message_idx
on public.email_delivery_attempts(company_id, email_message_id, attempt_number desc);

create index if not exists email_audit_log_message_idx
on public.email_audit_log(company_id, email_message_id, changed_at desc);

create or replace function public.prepare_email_message_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if new.email_reference is null or btrim(new.email_reference) = '' then
        new.email_reference := public.next_email_reference(new.company_id);
    end if;

    new.updated_at := now();

    return new;
end;
$$;

drop trigger if exists trg_prepare_email_message_columns on public.email_messages;
create trigger trg_prepare_email_message_columns
before insert or update on public.email_messages
for each row
execute function public.prepare_email_message_columns();

create or replace function public.assert_email_attachment_same_company()
returns trigger
language plpgsql
set search_path = public
as $$
declare
    parent_company_id uuid;
    document_company_id uuid;
    version_company_id uuid;
begin
    select company_id
    into parent_company_id
    from public.email_messages
    where id = new.email_message_id;

    if parent_company_id is null or parent_company_id <> new.company_id then
        raise exception 'E-Mail und Anhang müssen zum selben Unternehmen gehören.';
    end if;

    if new.document_id is not null then
        select company_id
        into document_company_id
        from public.documents
        where id = new.document_id;

        if document_company_id is null or document_company_id <> new.company_id then
            raise exception 'Dokument und E-Mail müssen zum selben Unternehmen gehören.';
        end if;
    end if;

    if new.document_version_id is not null then
        select company_id
        into version_company_id
        from public.document_versions
        where id = new.document_version_id;

        if version_company_id is null or version_company_id <> new.company_id then
            raise exception 'Dokumentversion und E-Mail müssen zum selben Unternehmen gehören.';
        end if;
    end if;

    return new;
end;
$$;

drop trigger if exists trg_assert_email_attachment_same_company on public.email_attachments;
create trigger trg_assert_email_attachment_same_company
before insert or update on public.email_attachments
for each row
execute function public.assert_email_attachment_same_company();

insert into public.email_templates (
    template_key,
    name,
    description,
    context_type,
    subject_template,
    body_html_template,
    body_text_template,
    is_system_template,
    sort_order
)
values
    (
        'invoice.send',
        'Verkaufsrechnung senden',
        'Standardvorlage fuer finale Verkaufsrechnungen.',
        'INVOICE',
        'Ihre Rechnung {{invoice.number}} von {{company.name}}',
        '<p>Guten Tag {{customer.name}},</p><p>anbei erhalten Sie Ihre Rechnung {{invoice.number}} als PDF.</p><p>Bei Fragen melden Sie sich gerne bei uns.</p><p>{{company.signature}}</p>',
        'Guten Tag {{customer.name}},\n\nanbei erhalten Sie Ihre Rechnung {{invoice.number}} als PDF.\n\nBei Fragen melden Sie sich gerne bei uns.\n\n{{company.signature}}',
        true,
        10
    ),
    (
        'invoice.zugferd.send',
        'ZUGFeRD-Rechnung senden',
        'Standardvorlage fuer validierte ZUGFeRD-Rechnungen.',
        'INVOICE',
        'Ihre E-Rechnung {{invoice.number}} von {{company.name}}',
        '<p>Guten Tag {{customer.name}},</p><p>anbei erhalten Sie Ihre E-Rechnung {{invoice.number}} als PDF mit eingebetteten strukturierten Rechnungsdaten.</p><p>Bei Fragen melden Sie sich gerne bei uns.</p><p>{{company.signature}}</p>',
        'Guten Tag {{customer.name}},\n\nanbei erhalten Sie Ihre E-Rechnung {{invoice.number}} als PDF mit eingebetteten strukturierten Rechnungsdaten.\n\nBei Fragen melden Sie sich gerne bei uns.\n\n{{company.signature}}',
        true,
        20
    ),
    (
        'documents.free',
        'Freie E-Mail mit Dokumenten',
        'Freie geschaeftliche E-Mail mit ausgewaehlten Dokumenten.',
        'GENERAL',
        '{{company.name}} - Unterlagen',
        '<p>Guten Tag,</p><p>anbei erhalten Sie die angeforderten Unterlagen.</p><p>{{company.signature}}</p>',
        'Guten Tag,\n\nanbei erhalten Sie die angeforderten Unterlagen.\n\n{{company.signature}}',
        true,
        90
    )
on conflict do nothing;

insert into public.email_messages (
    company_id,
    email_reference,
    context_type,
    context_id,
    template_key,
    sender_name,
    sender_email,
    to_recipients,
    subject,
    body_html,
    body_text,
    status,
    provider,
    idempotency_key,
    sent_at,
    created_at,
    updated_at,
    metadata
)
select
    invoice.company_id,
    public.next_email_reference(invoice.company_id),
    'INVOICE',
    invoice.id,
    'invoice.send',
    'WAW Nutzfahrzeuge',
    'legacy@waw.local',
    jsonb_build_array(jsonb_build_object('email', invoice.email_sent_to, 'name', null)),
    'Historischer Rechnungsversand ' || invoice.invoice_number,
    '<p>Historischer E-Mail-Versand aus Altdaten.</p>',
    'Historischer E-Mail-Versand aus Altdaten.',
    'LEGACY_SENT',
    'legacy',
    'legacy-invoice-email-' || invoice.id::text || '-' || coalesce(invoice.email_sent_at::text, 'unknown'),
    invoice.email_sent_at,
    coalesce(invoice.email_sent_at, now()),
    coalesce(invoice.email_sent_at, now()),
    jsonb_build_object(
        'legacy', true,
        'source_table', 'invoices',
        'source_fields', jsonb_build_array('email_sent_at', 'email_sent_to', 'email_sent_language')
    )
from public.invoices invoice
where invoice.email_sent_at is not null
  and invoice.email_sent_to is not null
on conflict (company_id, idempotency_key) do nothing;

insert into public.email_messages (
    company_id,
    email_reference,
    context_type,
    context_id,
    template_key,
    sender_name,
    sender_email,
    to_recipients,
    subject,
    body_html,
    body_text,
    status,
    provider,
    idempotency_key,
    sent_at,
    created_at,
    updated_at,
    metadata
)
select
    invoice.company_id,
    public.next_email_reference(invoice.company_id),
    'INVOICE',
    invoice.id,
    'invoice.zugferd.send',
    'WAW Nutzfahrzeuge',
    'legacy@waw.local',
    jsonb_build_array(jsonb_build_object('email', invoice.zugferd_email_sent_to, 'name', null)),
    'Historischer ZUGFeRD-Versand ' || invoice.invoice_number,
    '<p>Historischer ZUGFeRD-E-Mail-Versand aus Altdaten.</p>',
    'Historischer ZUGFeRD-E-Mail-Versand aus Altdaten.',
    'LEGACY_SENT',
    'legacy',
    'legacy-zugferd-email-' || invoice.id::text || '-' || coalesce(invoice.zugferd_email_sent_at::text, 'unknown'),
    invoice.zugferd_email_sent_at,
    coalesce(invoice.zugferd_email_sent_at, now()),
    coalesce(invoice.zugferd_email_sent_at, now()),
    jsonb_build_object(
        'legacy', true,
        'source_table', 'invoices',
        'source_fields', jsonb_build_array('zugferd_email_sent_at', 'zugferd_email_sent_to', 'zugferd_email_sent_language')
    )
from public.invoices invoice
where invoice.zugferd_email_sent_at is not null
  and invoice.zugferd_email_sent_to is not null
on conflict (company_id, idempotency_key) do nothing;

alter table public.email_messages enable row level security;
alter table public.email_attachments enable row level security;
alter table public.email_relations enable row level security;
alter table public.email_templates enable row level security;
alter table public.email_delivery_attempts enable row level security;
alter table public.email_provider_events enable row level security;
alter table public.email_audit_log enable row level security;

drop policy if exists email_messages_company_access on public.email_messages;
create policy email_messages_company_access
on public.email_messages
for all
using (company_id::text = current_setting('app.current_company_id', true) or current_setting('app.current_company_id', true) = '')
with check (company_id::text = current_setting('app.current_company_id', true) or current_setting('app.current_company_id', true) = '');

drop policy if exists email_attachments_company_access on public.email_attachments;
create policy email_attachments_company_access
on public.email_attachments
for all
using (company_id::text = current_setting('app.current_company_id', true) or current_setting('app.current_company_id', true) = '')
with check (company_id::text = current_setting('app.current_company_id', true) or current_setting('app.current_company_id', true) = '');

drop policy if exists email_relations_company_access on public.email_relations;
create policy email_relations_company_access
on public.email_relations
for all
using (company_id::text = current_setting('app.current_company_id', true) or current_setting('app.current_company_id', true) = '')
with check (company_id::text = current_setting('app.current_company_id', true) or current_setting('app.current_company_id', true) = '');

drop policy if exists email_templates_company_access on public.email_templates;
create policy email_templates_company_access
on public.email_templates
for all
using (company_id is null or company_id::text = current_setting('app.current_company_id', true) or current_setting('app.current_company_id', true) = '')
with check (company_id is null or company_id::text = current_setting('app.current_company_id', true) or current_setting('app.current_company_id', true) = '');

drop policy if exists email_delivery_attempts_company_access on public.email_delivery_attempts;
create policy email_delivery_attempts_company_access
on public.email_delivery_attempts
for all
using (company_id::text = current_setting('app.current_company_id', true) or current_setting('app.current_company_id', true) = '')
with check (company_id::text = current_setting('app.current_company_id', true) or current_setting('app.current_company_id', true) = '');

drop policy if exists email_provider_events_read_access on public.email_provider_events;
create policy email_provider_events_read_access
on public.email_provider_events
for select
using (true);

drop policy if exists email_audit_log_company_read_access on public.email_audit_log;
create policy email_audit_log_company_read_access
on public.email_audit_log
for select
using (company_id::text = current_setting('app.current_company_id', true) or current_setting('app.current_company_id', true) = '');
