create index if not exists documents_company_sale_type_status_idx
on public.documents(company_id, sale_id, document_type, status)
where sale_id is not null;

create index if not exists documents_bzst_metadata_idx
on public.documents using gin (metadata)
where document_type in (
    'bzst_vat_verification_primary',
    'bzst_vat_verification_secondary'
);
