create or replace function public.next_document_reference(target_company_id uuid)
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
        hashtext(target_company_id::text || ':' || current_year || ':document-reference')
    );

    select coalesce(
        max(nullif(regexp_replace(document_reference, '^DOC-' || current_year || '-([0-9]+)$', '\1'), document_reference)::integer),
        0
    ) + 1
    into next_number
    from public.documents
    where company_id = target_company_id
      and document_reference ~ ('^DOC-' || current_year || '-[0-9]+$');

    return 'DOC-' || current_year || '-' || lpad(next_number::text, 6, '0');
end;
$$;

alter table public.documents
    add column if not exists document_reference text,
    add column if not exists title text,
    add column if not exists description text,
    add column if not exists archive_status text not null default 'ACTIVE',
    add column if not exists active_version_id uuid,
    add column if not exists updated_at timestamptz not null default now(),
    add column if not exists created_by uuid,
    add column if not exists updated_by uuid,
    add column if not exists archived_at timestamptz,
    add column if not exists archived_by uuid,
    add column if not exists archive_reason text,
    add column if not exists metadata jsonb not null default '{}'::jsonb;

create table if not exists public.document_versions (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null,
    document_id uuid not null references public.documents(id) on delete restrict,
    version_number integer not null,
    original_file_name text not null,
    stored_file_name text not null,
    storage_bucket text not null default 'documents',
    storage_path text not null,
    mime_type text not null,
    file_size_bytes bigint not null,
    checksum text,
    uploaded_at timestamptz not null default now(),
    uploaded_by uuid,
    is_active boolean not null default false,
    replaced_version_id uuid references public.document_versions(id) on delete restrict,
    replacement_reason text,
    metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.document_relations (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null,
    document_id uuid not null references public.documents(id) on delete restrict,
    relation_type text not null,
    relation_id uuid not null,
    created_at timestamptz not null default now(),
    created_by uuid,
    metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.document_audit_log (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null,
    document_id uuid not null references public.documents(id) on delete restrict,
    version_id uuid references public.document_versions(id) on delete restrict,
    action text not null,
    previous_values jsonb,
    new_values jsonb,
    changed_at timestamptz not null default now(),
    changed_by uuid,
    reason text
);

alter table public.documents
    drop constraint if exists documents_active_version_id_fkey;

alter table public.documents
    add constraint documents_active_version_id_fkey
    foreign key (active_version_id)
    references public.document_versions(id)
    on delete restrict;

create unique index if not exists documents_company_document_reference_key
on public.documents(company_id, document_reference)
where document_reference is not null;

create unique index if not exists document_versions_document_version_number_key
on public.document_versions(document_id, version_number);

create unique index if not exists document_versions_one_active_version_key
on public.document_versions(document_id)
where is_active;

create unique index if not exists document_versions_company_storage_path_key
on public.document_versions(company_id, storage_bucket, storage_path);

create unique index if not exists document_relations_unique_relation_key
on public.document_relations(document_id, relation_type, relation_id);

create index if not exists documents_company_type_idx
on public.documents(company_id, document_type);

create index if not exists documents_company_status_idx
on public.documents(company_id, status, archive_status);

create index if not exists documents_company_created_at_idx
on public.documents(company_id, created_at desc);

create index if not exists document_versions_document_id_idx
on public.document_versions(document_id, version_number desc);

create index if not exists document_versions_company_checksum_idx
on public.document_versions(company_id, checksum)
where checksum is not null;

create index if not exists document_relations_lookup_idx
on public.document_relations(company_id, relation_type, relation_id);

create index if not exists document_audit_log_document_id_idx
on public.document_audit_log(document_id, changed_at desc);

create or replace function public.prepare_document_center_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    if new.document_reference is null or btrim(new.document_reference) = '' then
        new.document_reference := public.next_document_reference(new.company_id);
    end if;

    if new.title is null or btrim(new.title) = '' then
        new.title := coalesce(nullif(btrim(new.file_name), ''), new.document_type, 'Dokument');
    end if;

    if new.archive_status is null or btrim(new.archive_status) = '' then
        new.archive_status := 'ACTIVE';
    end if;

    new.updated_at := now();

    return new;
end;
$$;

drop trigger if exists trg_prepare_document_center_columns on public.documents;
create trigger trg_prepare_document_center_columns
before insert or update on public.documents
for each row
execute function public.prepare_document_center_columns();

create or replace function public.sync_document_version_from_legacy_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    next_version_number integer;
    previous_active_version_id uuid;
    next_version_id uuid;
begin
    if new.file_path is null or btrim(new.file_path) = '' then
        return new;
    end if;

    if exists (
        select 1
        from public.document_versions existing_version
        where existing_version.company_id = new.company_id
          and existing_version.document_id = new.id
          and existing_version.storage_bucket = 'documents'
          and existing_version.storage_path = new.file_path
    ) then
        return new;
    end if;

    select active_version.id
    into previous_active_version_id
    from public.document_versions active_version
    where active_version.document_id = new.id
      and active_version.is_active = true
    limit 1;

    select coalesce(max(version_number), 0) + 1
    into next_version_number
    from public.document_versions
    where document_id = new.id;

    update public.document_versions
    set is_active = false
    where document_id = new.id
      and is_active = true;

    insert into public.document_versions (
        company_id,
        document_id,
        version_number,
        original_file_name,
        stored_file_name,
        storage_bucket,
        storage_path,
        mime_type,
        file_size_bytes,
        uploaded_at,
        uploaded_by,
        is_active,
        replaced_version_id,
        metadata
    )
    values (
        new.company_id,
        new.id,
        next_version_number,
        coalesce(nullif(btrim(new.file_name), ''), 'document'),
        coalesce(nullif(btrim(new.file_name), ''), 'document'),
        'documents',
        new.file_path,
        coalesce(nullif(btrim(new.mime_type), ''), 'application/octet-stream'),
        greatest(coalesce(new.file_size, 0), 1),
        coalesce(new.created_at, now()),
        new.created_by,
        true,
        previous_active_version_id,
        jsonb_build_object('source', 'legacy_documents_columns')
    )
    returning id into next_version_id;

    update public.documents
    set active_version_id = next_version_id
    where id = new.id;

    return new;
end;
$$;

drop trigger if exists trg_sync_document_version_from_legacy_columns on public.documents;
create trigger trg_sync_document_version_from_legacy_columns
after insert or update of file_path, file_name, mime_type, file_size on public.documents
for each row
execute function public.sync_document_version_from_legacy_columns();

with ordered_documents as (
    select
        id,
        company_id,
        coalesce(created_at, now()) as created_at,
        row_number() over (
            partition by company_id, to_char(coalesce(created_at, now()), 'YYYY')
            order by coalesce(created_at, now()), id
        ) as sequence_number
    from public.documents
    where document_reference is null
)
update public.documents target_document
set document_reference =
    'DOC-' ||
    to_char(ordered_documents.created_at, 'YYYY') ||
    '-' ||
    lpad(ordered_documents.sequence_number::text, 6, '0')
from ordered_documents
where target_document.id = ordered_documents.id;

update public.documents
set
    title = coalesce(nullif(btrim(title), ''), nullif(btrim(file_name), ''), document_type, 'Dokument'),
    archive_status = coalesce(nullif(btrim(archive_status), ''), 'ACTIVE'),
    updated_at = coalesce(updated_at, created_at, now())
where title is null
   or archive_status is null
   or updated_at is null;

insert into public.document_versions (
    company_id,
    document_id,
    version_number,
    original_file_name,
    stored_file_name,
    storage_bucket,
    storage_path,
    mime_type,
    file_size_bytes,
    uploaded_at,
    uploaded_by,
    is_active,
    metadata
)
select
    document.company_id,
    document.id,
    1,
    coalesce(nullif(btrim(document.file_name), ''), 'document'),
    coalesce(nullif(btrim(document.file_name), ''), 'document'),
    'documents',
    document.file_path,
    coalesce(nullif(btrim(document.mime_type), ''), 'application/octet-stream'),
    greatest(coalesce(document.file_size, 0), 1),
    coalesce(document.created_at, now()),
    document.created_by,
    true,
    jsonb_build_object('source', 'legacy_backfill')
from public.documents document
where document.file_path is not null
  and not exists (
      select 1
      from public.document_versions version
      where version.document_id = document.id
  );

update public.documents document
set active_version_id = version.id
from public.document_versions version
where version.document_id = document.id
  and version.is_active = true
  and document.active_version_id is null;

insert into public.document_relations (
    company_id,
    document_id,
    relation_type,
    relation_id,
    metadata
)
select company_id, id, 'VEHICLE', vehicle_id, jsonb_build_object('source', 'legacy_vehicle_id')
from public.documents
where vehicle_id is not null
on conflict do nothing;

insert into public.document_relations (
    company_id,
    document_id,
    relation_type,
    relation_id,
    metadata
)
select company_id, id, 'SALE', sale_id, jsonb_build_object('source', 'legacy_sale_id')
from public.documents
where sale_id is not null
on conflict do nothing;

do $$
begin
    if exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'documents'
          and column_name = 'purchase_case_id'
    ) then
        execute $sql$
            insert into public.document_relations (
                company_id,
                document_id,
                relation_type,
                relation_id,
                metadata
            )
            select company_id, id, 'PURCHASE', purchase_case_id, jsonb_build_object('source', 'legacy_purchase_case_id')
            from public.documents
            where purchase_case_id is not null
            on conflict do nothing
        $sql$;
    end if;
end;
$$;

insert into public.document_relations (
    company_id,
    document_id,
    relation_type,
    relation_id,
    metadata
)
select company_id, id, 'CUSTOMER', customer_id, jsonb_build_object('source', 'legacy_customer_id')
from public.documents
where customer_id is not null
on conflict do nothing;

insert into public.document_relations (
    company_id,
    document_id,
    relation_type,
    relation_id,
    metadata
)
select company_id, id, 'INVOICE', invoice_id, jsonb_build_object('source', 'legacy_invoice_id')
from public.documents
where invoice_id is not null
on conflict do nothing;

do $$
begin
    if exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'documents'
          and column_name = 'license_plate_case_id'
    ) then
        execute $sql$
            insert into public.document_relations (
                company_id,
                document_id,
                relation_type,
                relation_id,
                metadata
            )
            select company_id, id, 'LICENSE_PLATE_CASE', license_plate_case_id, jsonb_build_object('source', 'legacy_license_plate_case_id')
            from public.documents
            where license_plate_case_id is not null
            on conflict do nothing
        $sql$;
    end if;
end;
$$;

alter table public.document_versions enable row level security;
alter table public.document_relations enable row level security;
alter table public.document_audit_log enable row level security;

drop policy if exists "Users can read document versions for their company" on public.document_versions;
create policy "Users can read document versions for their company"
on public.document_versions
for select
using (
    exists (
        select 1
        from public.documents document
        where document.id = document_versions.document_id
          and document.company_id = document_versions.company_id
    )
);

drop policy if exists "Users can manage document versions for their company" on public.document_versions;
create policy "Users can manage document versions for their company"
on public.document_versions
for all
using (
    exists (
        select 1
        from public.documents document
        where document.id = document_versions.document_id
          and document.company_id = document_versions.company_id
    )
)
with check (
    exists (
        select 1
        from public.documents document
        where document.id = document_versions.document_id
          and document.company_id = document_versions.company_id
    )
);

drop policy if exists "Users can read document relations for their company" on public.document_relations;
create policy "Users can read document relations for their company"
on public.document_relations
for select
using (
    exists (
        select 1
        from public.documents document
        where document.id = document_relations.document_id
          and document.company_id = document_relations.company_id
    )
);

drop policy if exists "Users can manage document relations for their company" on public.document_relations;
create policy "Users can manage document relations for their company"
on public.document_relations
for all
using (
    exists (
        select 1
        from public.documents document
        where document.id = document_relations.document_id
          and document.company_id = document_relations.company_id
    )
)
with check (
    exists (
        select 1
        from public.documents document
        where document.id = document_relations.document_id
          and document.company_id = document_relations.company_id
    )
);

drop policy if exists "Users can read document audit log for their company" on public.document_audit_log;
create policy "Users can read document audit log for their company"
on public.document_audit_log
for select
using (
    exists (
        select 1
        from public.documents document
        where document.id = document_audit_log.document_id
          and document.company_id = document_audit_log.company_id
    )
);
