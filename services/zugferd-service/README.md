# WAW ZUGFeRD Service

Separater, zustandsloser HTTP-Service für echte ZUGFeRD-/Factur-X-Erzeugung
und Validierung.

Der Service ist bewusst von der Next.js-App getrennt, weil Mustangproject,
Ghostscript und veraPDF Java-/CLI-Komponenten sind und nicht zuverlässig in
Vercel-/Serverless-Funktionen laufen.

## Verwendete Komponenten

- Java 21
- Mustangproject `2.24.0`
- veraPDF `1.30.2`
- Ghostscript aus dem Debian/Ubuntu-Paket für die PDF/A-3b-Konvertierung

Wichtiger Befund zur Mustang-API:
Mustang bettet ZUGFeRD/Factur-X über `ZUGFeRDExporterFromPDFA` in eine
PDF/A-Eingangsdatei ein. Eine normale PDF wird nicht als ausreichend betrachtet.
Der Service konvertiert deshalb die sichtbare Rechnung zuerst nach PDF/A-3b und
gibt das Ergebnis erst frei, wenn veraPDF die fertige Datei als PDF/A-3b bestätigt.

## Lokaler Start

Im Repository-Root:

```bash
ZUGFERD_SERVICE_API_KEY=local-zugferd-secret docker compose up --build zugferd-service
```

Danach in `.env.local` der Next.js-App:

```env
ZUGFERD_SERVICE_URL=http://localhost:8087
ZUGFERD_SERVICE_API_KEY=local-zugferd-secret
```

Next.js neu starten, dann ist der Button `ZUGFeRD erstellen und prüfen` aktiv.

## Endpoints

### `GET /health`

Kein Auth nötig. Prüft nur, ob der Dienst läuft und ob Ghostscript/veraPDF
auffindbar sind.

### `POST /generate`

Auth:

```text
Authorization: Bearer <ZUGFERD_SERVICE_API_KEY>
Content-Type: application/json
```

Request aus WAW Pilot:

```json
{
  "standardVersion": "ZUGFeRD 2.5 / Factur-X 1.09",
  "profile": "EN16931",
  "invoice": {},
  "visiblePdfBase64": "..."
}
```

Pipeline:

1. Eingangs-PDF wird temporär gespeichert.
2. Ghostscript konvertiert sie nach PDF/A-3b.
3. Mustangproject erzeugt `factur-x.xml` aus den kanonischen Rechnungsdaten.
4. Mustangproject validiert XML/EN16931.
5. Mustangproject bettet XML in die PDF/A-Datei ein.
6. Mustangproject validiert die fertige hybride Datei.
7. veraPDF prüft unabhängig PDF/A-3b.
8. Der Service prüft PDF/XML-Konsistenz gegen die kanonischen Rechnungsdaten.
9. Nur bei vollständigem Erfolg wird die PDF base64-kodiert zurückgegeben.

Temporäre Dateien werden in jedem Fall nach dem Request gelöscht.

## Sicherheit

- Keine Datenbank
- Kein persistenter Zustand
- Auth per Bearer Secret
- Keine Rechnungsinhalte in Logs
- Uploadgrößenlimit über `MAX_UPLOAD_MB`
- Temporäre Arbeitsverzeichnisse werden nach jedem Request gelöscht

## Hinweise

Wenn Ghostscript keine veraPDF-konforme PDF/A-3b erzeugen kann, schlägt der
Request fehl. Das ist Absicht: WAW Pilot darf keine nicht validierte ZUGFeRD-Datei
speichern, herunterladen oder per E-Mail versenden.
