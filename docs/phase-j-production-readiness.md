# Phase J - Architektur-Konsolidierung und Produktionsreife

Stand: 2026-07-22

## Zusammenfassung

Phase J wurde gegen den tatsächlich vorhandenen Code geprüft. Der wichtigste produktionskritische Befund war der neue Verkaufsflow: Auswahl und Inline-Neuanlage von Kunde/Fahrzeug waren im UI vorhanden, aber die Inline-Neuanlage konnte bei späteren Fehlern halbfertige Kunden oder Fahrzeuge zurücklassen. Zusätzlich fehlten harte Datenbankgarantien für eindeutige Verkaufsnummern, VINs und interne Fahrzeugnummern.

Diese Lücken wurden korrigiert:

- serverseitige Kompensation für inline angelegte Kunden/Fahrzeuge im Verkaufsflow
- eindeutige Constraints für Verkaufsnummer, VIN und interne Fahrzeugnummer
- bestehender Race-Condition-Schutz für aktive Verkäufe pro Fahrzeug bestätigt und beibehalten
- technische Prüfungen erneut ausgeführt

Nicht als erledigt markiert wurden Anforderungen, die im Projekt keine ausführbare Testinfrastruktur besitzen. `package.json` enthält aktuell keine Unit-, Domain-, Integration-, RLS- oder E2E-Testskripte.

## Requirement Traceability Matrix

| ID | Phase | Anforderung | Status nach Prüfung | Dateien / Nachweis | Maßnahme |
| --- | --- | --- | --- | --- | --- |
| REQ-A-01 | A | Dashboard, Filter, Karten und Darstellung konsistent | Implementiert, automatisiert nur über Build geprüft | `lib/dashboard/dashboard-queries.ts`, `app/dashboard/page.tsx` | Kein neuer Fix in Phase J |
| REQ-B-01 | B | VAT-Regeln zentral für Inland/EU/Drittland und Firma/Privat | Implementiert und serverseitig genutzt | `utils/sale-tax-rules.ts`, `app/dashboard/sales/new/actions.ts` | Keine Duplikation ergänzt |
| REQ-B-02 | B | EU-Privatverkauf erzwingt 19 Prozent und blendet USt-ID aus | Implementiert und Build-geprüft | `utils/sale-tax-rules.ts`, `components/sales/sale-form.tsx` | Bestätigt |
| REQ-B-03 | B | Drittland-Privatverkauf erzwingt 0 Prozent und blendet USt-ID aus | Implementiert und Build-geprüft | `utils/sale-tax-rules.ts` | Bestätigt |
| REQ-C-01 | C | Fahrzeugbestand nutzt Baujahr, Schäden und Schadensanzeige | Implementiert | `components/vehicles/vehicle-form.tsx`, `components/sales/sale-form.tsx` | Inline-Fahrzeuganlage verwendet dieselben Feldregeln |
| REQ-D-01 | D | Verkaufsakte mit Zahlungen und Rechnungen | Implementiert, aber große Server Actions bleiben Architektur-Risiko | `app/dashboard/sales/[saleId]/payment-actions.ts`, `invoice-actions.ts` | Risiko dokumentiert |
| REQ-D-02 | D | Multi-Payment und Zahlungs-Audit | Implementiert | `sale_payments`, `sale_payment_audit_log`, `payment-actions.ts` | Kein Fix nötig |
| REQ-E-01 | E | Einheitlicher Ankauf mit Fahrzeug/Verkäufer-Auswahl oder Neuanlage | Implementiert | `components/purchases/purchase-form.tsx`, `app/dashboard/ankauf/new/actions.ts` | Kein Fix in Phase J |
| REQ-F-01 | F | Barseite und Buchhaltung/DATEV-Vorbereitung getrennt | Implementiert | `lib/accounting`, `lib/cashbook`, `app/dashboard/cashbook` | Kein Fix in Phase J |
| REQ-F-02 | F | Keine Doppelbuchung aus `sale_payments` | Teilweise implementiert, nicht automatisiert testbar | `lib/accounting/financial-sync.ts` | Testlücke dokumentiert |
| REQ-G-01 | G | Zentrales Dokumentmodell mit Versionierung | Implementiert | `src/modules/documents`, `supabase/migrations/20260721143000_add_document_center_versioning.sql` | Kein Fix in Phase J |
| REQ-G-02 | G | Private Dokumente und Signed URLs | Implementiert, nicht mit RLS-Test ausgeführt | `app/api/documents/[documentId]/file/route.ts`, Storage-Adapter | Testlücke dokumentiert |
| REQ-H-01 | H | Storno erzeugt neuen Beleg, Original bleibt unverändert | Implementiert | `src/modules/invoice-corrections`, `invoice-actions.ts` | Kein Fix in Phase J |
| REQ-H-02 | H | Rückzahlungen und Finanzjournal | Implementiert, automatisiert ungetestet | `sale_refunds`, `financial_entries` | Testlücke dokumentiert |
| REQ-I-01 | I | Bestätigungs-PDFs nutzen zentralen Header, Logo, Firmendaten | Implementiert | `lib/pdf/core/company-document-header.ts` | Bestätigt |
| REQ-I-02 | I | EU-Transitdatum zentral und manuell überschreibbar | Implementiert | `DocumentDatePolicy`, `EuTransitTimePolicy` | Bestätigt |
| REQ-I-03 | I | BZSt-Link und zwei Nachweis-Slots bei EU-Firma | Implementiert | `BzstVatVerificationCard`, `sale-required-documents.ts` | Bestätigt |
| REQ-SALE-01 | Zusatz | Verkauf ohne Menüwechsel vollständig anlegen | Implementiert, Build-geprüft | `components/sales/sale-form.tsx` | Bestätigt |
| REQ-SALE-02 | Zusatz | Bestehender Kunde per Suche | Implementiert | `CustomerCombobox`, `SearchCombobox` | Bestätigt |
| REQ-SALE-03 | Zusatz | Neuer Kunde inline | Implementiert | `components/sales/sale-form.tsx`, `createSaleAction` | Kompensation ergänzt |
| REQ-SALE-04 | Zusatz | Bestehendes Fahrzeug per Suche | Implementiert | `VehicleCombobox` | Bestätigt |
| REQ-SALE-05 | Zusatz | Neues Fahrzeug inline | Implementiert | `NewVehicleFields`, `createVehicleFromSaleForm` | Kompensation ergänzt |
| REQ-SALE-06 | Zusatz | Alle vier Kunde/Fahrzeug-Kombinationen | Implementiert, nicht E2E-automatisiert | `createSaleAction` | Build/TypeScript geprüft |
| REQ-SALE-07 | Zusatz | VIN-Dublette serverseitig verhindern | Implementiert und DB-Constraint ergänzt | `normalizeVinForSale`, `vehicles_company_vin_key` | Fix in Phase J |
| REQ-SALE-08 | Zusatz | Doppelte aktive Verkäufe desselben Fahrzeugs verhindern | Implementiert | `sales_one_active_sale_per_vehicle_idx` | Bestätigt |
| REQ-SALE-09 | Zusatz | Verkaufsnummer konkurrenzsicher | Implementiert und DB-Constraint ergänzt | `next_sale_number`, `sales_company_sale_number_key` | Fix in Phase J |

## Architekturentscheidungen

- VAT-Regeln bleiben in `utils/sale-tax-rules.ts`; keine zweite VAT-Policy eingeführt.
- Fahrzeug-Verkaufsfähigkeit bleibt in `lib/sales/vehicle-sale-eligibility.ts`.
- Nummernkreise werden serverseitig erzeugt. Für Verkauf nutzt `next_sale_number(...)` einen PostgreSQL-Advisory-Lock.
- Dokumentversionierung bleibt in der bestehenden Dokumentarchitektur aus `src/modules/documents`.
- PDF-Regeln für Bestätigungsdokumente bleiben in `DocumentDatePolicy` und `company-document-header`.
- Verkaufsflow-Kompensation ist bewusst Best-Effort, weil die bestehende Supabase-Server-Action noch kein vollständiges RPC-/Unit-of-Work-Transaktionsmodell besitzt.

## Geänderte Datenbankstruktur in Phase J

Migration: `supabase/migrations/20260721193000_harden_sale_creation_workflow.sql`

- `public.next_sale_number(target_company_id uuid)`
- `sales_one_active_sale_per_vehicle_idx`
- `sales_company_sale_number_key`
- `vehicles_company_vin_key`
- `vehicles_company_internal_number_key`
- Suchindizes für Kunden und Fahrzeuge im Verkaufsflow

## Sicherheits- und Konsistenzprüfung

Geprüft:

- keine direkten Supabase-Abfragen in React-Komponenten gefunden
- `company_id` wird in den relevanten Query- und Action-Pfaden serverseitig über `getCurrentCompanyId()` aufgelöst
- Verkaufsflow blockiert fremde Kunden/Fahrzeuge über `company_id`-Filter
- neue DB-Constraints verhindern Doppelverkauf, doppelte Verkaufsnummern und doppelte VINs
- Dokumentzugriff läuft über serverseitige Routes/Storage-Adapter, keine Public-URL-Strategie ergänzt

Nicht vollständig ausführbar in dieser Umgebung:

- Zwei-Mandanten-RLS-Test
- Fresh-Database-Test
- Existing-Database-Upgrade-Test
- Browser-E2E inklusive Mobile-Review
- visuelle PDF-Abnahme mit echten Seed-Daten

## Technische Prüfungen

- `npm run lint`: bestanden
- `npx tsc --noEmit`: bestanden
- `npm run build`: bestanden

Build-Hinweis:

- Next.js meldet die bestehende Deprecation der `middleware`-Konvention zugunsten von `proxy`. Kein Buildfehler.

## Verbleibende Risiken

- Es existiert noch keine automatisierte Testpyramide im Projekt. `package.json` enthält keine Testskripte.
- Mehrere bestehende Server Actions sind groß und enthalten weiterhin Orchestrierungslogik. Der kritischste Verkaufsflow wurde in Phase J kompensiert, aber eine vollständige Unit-of-Work/RPC-Transaktion wäre eine spätere technische Härtung.
- RLS, Storage-Policies, PDF-Layout und Mobile UX konnten ohne laufende Testdatenbank und Browser-Abnahme nicht abschließend praktisch verifiziert werden.
