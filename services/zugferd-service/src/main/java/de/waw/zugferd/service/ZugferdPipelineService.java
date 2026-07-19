package de.waw.zugferd.service;

import de.waw.zugferd.model.CanonicalInvoice;
import de.waw.zugferd.model.GenerateRequest;
import de.waw.zugferd.model.GenerateResponse;
import de.waw.zugferd.model.HealthResponse;
import de.waw.zugferd.model.ValidationIssue;
import de.waw.zugferd.model.ValidationResponse;
import de.waw.zugferd.model.ValidationSummary;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Date;
import java.util.HexFormat;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathFactory;
import org.mustangproject.BankDetails;
import org.mustangproject.Invoice;
import org.mustangproject.Item;
import org.mustangproject.LegalOrganisation;
import org.mustangproject.Product;
import org.mustangproject.TradeParty;
import org.mustangproject.ZUGFeRD.IZUGFeRDExporter;
import org.mustangproject.ZUGFeRD.Profiles;
import org.mustangproject.ZUGFeRD.ZUGFeRD2PullProvider;
import org.mustangproject.ZUGFeRD.ZUGFeRDExporterFromPDFA;
import org.mustangproject.validator.ZUGFeRDValidator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.w3c.dom.Document;

@Service
public class ZugferdPipelineService {
    private static final String MUSTANG_VERSION = "2.24.0";
    private static final String VERAPDF_VERSION = "1.30.2";
    private static final String STANDARD_VERSION = "ZUGFeRD 2.5 / Factur-X 1.09";
    private static final String PROFILE = "EN16931";

    private final ProcessRunner processRunner;
    private final String ghostscriptCommand;
    private final String veraPdfCommand;
    private final String iccProfilePath;
    private final int maxUploadMb;

    public ZugferdPipelineService(
            ProcessRunner processRunner,
            @Value("${zugferd.ghostscript-command}") String ghostscriptCommand,
            @Value("${zugferd.verapdf-command}") String veraPdfCommand,
            @Value("${zugferd.icc-profile-path}") String iccProfilePath,
            @Value("${zugferd.max-upload-mb}") int maxUploadMb
    ) {
        this.processRunner = processRunner;
        this.ghostscriptCommand = ghostscriptCommand;
        this.veraPdfCommand = veraPdfCommand;
        this.iccProfilePath = iccProfilePath;
        this.maxUploadMb = maxUploadMb;
    }

    public HealthResponse health() {
        return new HealthResponse(
                "ok",
                MUSTANG_VERSION,
                VERAPDF_VERSION,
                commandStatus(List.of(ghostscriptCommand, "--version")),
                commandStatus(List.of(veraPdfCommand, "--version"))
        );
    }

    public GenerateResponse generate(GenerateRequest request) throws Exception {
        Path workDir = Files.createTempDirectory("waw-zugferd-");

        try {
            validateRequest(request);

            byte[] visiblePdf = decodePdf(request.visiblePdfBase64());
            Path inputPdf = workDir.resolve("visible.pdf");
            Path pdfaPdf = workDir.resolve("visible-pdfa3b.pdf");
            Path xml = workDir.resolve("factur-x.xml");
            Path outputPdf = workDir.resolve("zugferd.pdf");

            Files.write(inputPdf, visiblePdf);
            convertToPdfA3b(inputPdf, pdfaPdf);

            byte[] xmlBytes = generateXml(request.invoice());
            Files.write(xml, xmlBytes);

            List<ValidationIssue> issues = new ArrayList<>();
            boolean xmlValid = validateWithMustang(xml, issues, "xml");

            if (!xmlValid) {
                throw new ValidationFailedException(issues);
            }

            embedXmlWithMustang(pdfaPdf, xmlBytes, outputPdf);

            boolean mustangValid = validateWithMustang(outputPdf, issues, "mustang");
            boolean pdfAValid = validateWithVeraPdf(outputPdf, issues);
            boolean consistencyValid = validateConsistency(xml, request.invoice(), issues);

            if (!mustangValid || !pdfAValid || !consistencyValid) {
                throw new ValidationFailedException(issues);
            }

            byte[] resultPdf = Files.readAllBytes(outputPdf);
            String sha256 = sha256(resultPdf);

            return new GenerateResponse(
                    Base64.getEncoder().encodeToString(resultPdf),
                    "rechnung-" + safeFilePart(request.invoice().invoiceNumber()) + "-zugferd.pdf",
                    sha256,
                    STANDARD_VERSION,
                    PROFILE,
                    new ValidationSummary(
                            "valid",
                            MUSTANG_VERSION,
                            VERAPDF_VERSION,
                            true,
                            true,
                            true,
                            issues
                    )
            );
        } finally {
            FileCleanup.deleteRecursively(workDir);
        }
    }

    public ValidationResponse validateGeneratedResult(GenerateRequest request) throws Exception {
        try {
            GenerateResponse response = generate(request);
            return new ValidationResponse(response.validation().status(), response.validation().issues());
        } catch (ValidationFailedException exception) {
            return new ValidationResponse("invalid", exception.issues());
        }
    }

    private void validateRequest(GenerateRequest request) {
        List<ValidationIssue> issues = new ArrayList<>();

        if (!STANDARD_VERSION.equals(request.standardVersion())) {
            issues.add(error("STANDARD_VERSION", "Es wird nur ZUGFeRD 2.5 / Factur-X 1.09 unterstützt."));
        }

        if (!PROFILE.equals(request.profile())) {
            issues.add(error("PROFILE", "Es wird nur das Profil EN16931 unterstützt."));
        }

        CanonicalInvoice invoice = request.invoice();

        if (!"EUR".equals(invoice.currency())) {
            issues.add(error("CURRENCY", "Es wird aktuell nur EUR unterstützt."));
        }

        if (invoice.lines().size() != 1) {
            issues.add(error("LINES", "Für Fahrzeugrechnungen wird genau eine Rechnungsposition erwartet."));
        }

        if (isBlank(invoice.seller().vatId()) &&
                isBlank(invoice.seller().registrationId()) &&
                isBlank(invoice.seller().identifier())) {
            issues.add(new ValidationIssue(
                    "EN16931",
                    "error",
                    "BR-CO-26",
                    "Für die E-Rechnung fehlt eine eindeutige Verkäuferkennung. Bitte hinterlege die USt-IdNr. oder Handelsregisternummer von W.A.W Nutzfahrzeuge.",
                    null,
                    true
            ));
        }

        if (!isBlank(invoice.seller().vatId()) &&
                !isValidVatIdForCountry(invoice.seller().vatId(), invoice.seller().countryCode())) {
            issues.add(new ValidationIssue(
                    "EN16931",
                    "error",
                    "BR-CO-09",
                    "Die USt-IdNr. des Verkäufers ist ungültig. Erwartetes Format: DE123456789.",
                    null,
                    true
            ));
        }

        if (!isBlank(invoice.buyer().vatId()) &&
                !isValidVatIdForCountry(invoice.buyer().vatId(), invoice.buyer().countryCode())) {
            issues.add(new ValidationIssue(
                    "EN16931",
                    "error",
                    "BR-CO-09",
                    "Die USt-IdNr. des Käufers ist ungültig. Bitte hinterlege sie mit ISO-Ländercode, z. B. DE123456789.",
                    null,
                    true
            ));
        }

        BigDecimal expectedGross = invoice.totals().taxBasisTotal()
                .add(invoice.totals().taxTotal())
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal actualGross = invoice.totals().grandTotal().setScale(2, RoundingMode.HALF_UP);

        if (expectedGross.compareTo(actualGross) != 0) {
            issues.add(error("TOTALS", "Netto-, Steuer- und Bruttobetrag sind nicht konsistent."));
        }

        if (!issues.isEmpty()) {
            throw new ValidationFailedException(issues);
        }
    }

    private byte[] decodePdf(String visiblePdfBase64) {
        byte[] bytes;

        try {
            bytes = Base64.getDecoder().decode(visiblePdfBase64);
        } catch (IllegalArgumentException error) {
            throw new ValidationFailedException(List.of(error("PDF_BASE64", "Die sichtbare PDF konnte nicht gelesen werden.")));
        }

        int maxBytes = maxUploadMb * 1024 * 1024;

        if (bytes.length > maxBytes) {
            throw new ValidationFailedException(List.of(error("PDF_SIZE", "Die sichtbare PDF ist zu groß.")));
        }

        return bytes;
    }

    private byte[] generateXml(CanonicalInvoice canonicalInvoice) {
        Invoice invoice = new Invoice()
                .setIssueDate(toDate(canonicalInvoice.invoiceDate()))
                .setDueDate(toDate(canonicalInvoice.invoiceDate()))
                .setDeliveryDate(toDate(canonicalInvoice.deliveryDate()))
                .setSender(toTradeParty(canonicalInvoice.seller(), true, canonicalInvoice.payment()))
                .setRecipient(toTradeParty(canonicalInvoice.buyer(), false, canonicalInvoice.payment()))
                .setNumber(canonicalInvoice.invoiceNumber())
                .setCurrency(canonicalInvoice.currency());

        for (CanonicalInvoice.InvoiceLine line : canonicalInvoice.lines()) {
            Product product = new Product(
                    line.name(),
                    line.vin() == null ? "" : "VIN " + line.vin(),
                    line.unitCode(),
                    line.vatRate()
            );
            invoice.addItem(new Item(product, line.netUnitPrice(), line.quantity()));
        }

        ZUGFeRD2PullProvider provider = new ZUGFeRD2PullProvider();
        provider.setProfile(Profiles.getByName("EN16931"));
        provider.generateXML(invoice);

        return provider.getXML();
    }

    private TradeParty toTradeParty(
            CanonicalInvoice.Party party,
            boolean seller,
            CanonicalInvoice.Payment payment
    ) {
        TradeParty tradeParty = new TradeParty(
                party.name(),
                party.street(),
                party.postalCode(),
                party.city(),
                party.countryCode()
        );

        if (party.vatId() != null && !party.vatId().isBlank()) {
            tradeParty.addVATID(party.vatId());
        }

        if (party.registrationId() != null && !party.registrationId().isBlank()) {
            tradeParty.setLegalOrganisation(new LegalOrganisation(party.registrationId()));
        }

        if (party.identifier() != null && !party.identifier().isBlank()) {
            tradeParty.setID(party.identifier());
        }

        if (party.taxNumber() != null && !party.taxNumber().isBlank()) {
            tradeParty.addTaxID(party.taxNumber());
        }

        if (party.email() != null && !party.email().isBlank()) {
            tradeParty.setEmail(party.email());
        }

        if (seller) {
            tradeParty.addBankDetails(new BankDetails(payment.iban(), payment.bic()));
        }

        return tradeParty;
    }

    private void convertToPdfA3b(Path inputPdf, Path outputPdf) throws IOException, InterruptedException {
        List<String> command = List.of(
                ghostscriptCommand,
                "-dBATCH",
                "-dNOPAUSE",
                "-dNOOUTERSAVE",
                "-dSAFER",
                "-sDEVICE=pdfwrite",
                "-dPDFA=3",
                "-dPDFACompatibilityPolicy=1",
                "-sColorConversionStrategy=RGB",
                "-sProcessColorModel=DeviceRGB",
                "-sOutputICCProfile=" + iccProfilePath,
                "-sOutputFile=" + outputPdf,
                inputPdf.toString()
        );

        ProcessRunner.ProcessResult result = processRunner.run(command, Duration.ofSeconds(60));

        if (result.exitCode() != 0 || !Files.exists(outputPdf)) {
            throw new ValidationFailedException(List.of(error("PDFA_CONVERSION", "Die sichtbare PDF konnte nicht zuverlässig in PDF/A-3b konvertiert werden.")));
        }
    }

    private void embedXmlWithMustang(Path pdfaPdf, byte[] xml, Path outputPdf) throws Exception {
        try (IZUGFeRDExporter exporter = new ZUGFeRDExporterFromPDFA()) {
            exporter.load(pdfaPdf.toString());
            exporter
                    .setProducer("WAW Pilot ZUGFeRD Service")
                    .setCreator("WAW Pilot")
                    .setZUGFeRDVersion(2)
                    .setProfile(Profiles.getByName("EN16931"));
            exporter.setXML(xml);
            exporter.export(outputPdf.toString());
        }
    }

    private boolean validateWithMustang(Path file, List<ValidationIssue> issues, String phase) {
        ZUGFeRDValidator validator = new ZUGFeRDValidator();
        String result = validator.validate(file.toString());

        if (validator.wasCompletelyValid()) {
            return true;
        }

        List<ValidationIssue> reportIssues = classifyMustangReport(result, phase);
        issues.addAll(reportIssues);

        return reportIssues.stream().noneMatch(ValidationIssue::blocking);
    }

    private boolean validateWithVeraPdf(Path file, List<ValidationIssue> issues) throws IOException, InterruptedException {
        ProcessRunner.ProcessResult result = processRunner.run(
                List.of(veraPdfCommand, "--format", "xml", "--flavour", "3b", file.toString()),
                Duration.ofSeconds(60)
        );

        String output = result.output();
        boolean compliant = result.exitCode() == 0 &&
                (output.contains("isCompliant=\"true\"") ||
                        output.contains("<isCompliant>true</isCompliant>") ||
                        output.contains("isCompliant='true'"));

        if (compliant) {
            return true;
        }

        issues.add(new ValidationIssue(
                "PDF_A",
                "error",
                "VERAPDF_3B",
                "veraPDF hat die Datei nicht als PDF/A-3b-konform bestätigt.",
                null,
                true
        ));
        issues.add(new ValidationIssue(
                "PDF_A",
                "notice",
                "VERAPDF_REPORT",
                sanitizeValidatorReport(output),
                null,
                false
        ));

        return false;
    }

    private boolean validateConsistency(Path xml, CanonicalInvoice invoice, List<ValidationIssue> issues) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(true);
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            Document document = factory.newDocumentBuilder().parse(xml.toFile());
            var xpath = XPathFactory.newInstance().newXPath();

            String invoiceNumber = text(xpath.evaluate(
                    "//*[local-name()='ExchangedDocument']/*[local-name()='ID'][1]",
                    document,
                    XPathConstants.STRING
            ));
            String currency = text(xpath.evaluate(
                    "//*[local-name()='InvoiceCurrencyCode'][1]",
                    document,
                    XPathConstants.STRING
            ));
            String grandTotal = text(xpath.evaluate(
                    "//*[local-name()='GrandTotalAmount'][1]",
                    document,
                    XPathConstants.STRING
            ));

            boolean valid = true;

            if (!invoice.invoiceNumber().equals(invoiceNumber)) {
                issues.add(error("CONSISTENCY_INVOICE_NUMBER", "Rechnungsnummer in XML und Ausgangsdaten stimmt nicht überein."));
                valid = false;
            }

            if (!invoice.currency().equals(currency)) {
                issues.add(error("CONSISTENCY_CURRENCY", "Währung in XML und Ausgangsdaten stimmt nicht überein."));
                valid = false;
            }

            if (!sameMoney(invoice.totals().grandTotal(), grandTotal)) {
                issues.add(error("CONSISTENCY_TOTAL", "Bruttobetrag in XML und Ausgangsdaten stimmt nicht überein."));
                valid = false;
            }

            return valid;
        } catch (Exception error) {
            issues.add(new ValidationIssue(
                    "EN16931",
                    "error",
                    "CONSISTENCY_PARSE",
                    "XML-/Rechnungsdaten-Konsistenz konnte nicht geprüft werden.",
                    null,
                    true
            ));
            return false;
        }
    }

    private String commandStatus(List<String> command) {
        try {
            ProcessRunner.ProcessResult result = processRunner.run(command, Duration.ofSeconds(5));
            return result.exitCode() == 0 ? "available" : "error";
        } catch (Exception error) {
            return "missing";
        }
    }

    private static Date toDate(String isoDate) {
        return Date.from(LocalDate.parse(isoDate).atStartOfDay(ZoneId.of("UTC")).toInstant());
    }

    private static ValidationIssue error(String ruleId, String message) {
        return new ValidationIssue("EN16931", "error", ruleId, message, null, true);
    }

    private static List<ValidationIssue> classifyMustangReport(String report, String phase) {
        if (report == null || report.isBlank()) {
            return List.of(new ValidationIssue(
                    "FACTUR_X",
                    "error",
                    "MUSTANG_" + phase.toUpperCase(),
                    "Mustangproject-Validierung ist fehlgeschlagen.",
                    null,
                    true
            ));
        }

        List<ValidationIssue> issues = new ArrayList<>();
        String sanitizedReport = sanitizeValidatorReport(report);
        List<String> xrechnungNoticeRules = List.of(
                "PEPPOL-EN16931-R001",
                "PEPPOL-EN16931-R010",
                "BR-DE-15",
                "BR-DE-21",
                "BR-DE-2"
        );
        List<String> blockingFacturXRules = List.of("BR-CO-09", "BR-CO-26");
        List<String> detectedRuleIds = extractRuleIds(report);

        for (String rule : blockingFacturXRules) {
            if (!report.contains(rule)) {
                continue;
            }

            issues.add(new ValidationIssue(
                    "EN16931",
                    "error",
                    rule,
                    getFriendlyFacturXRuleMessage(rule),
                    null,
                    true
            ));
        }

        for (String rule : xrechnungNoticeRules) {
            if (!report.contains(rule)) {
                continue;
            }

            issues.add(new ValidationIssue(
                    "XRECHNUNG",
                    "notice",
                    rule,
                    "XRechnung-spezifischer Hinweis aus der Mustang-Validierung; für Factur-X EN16931 nicht blockierend.",
                    null,
                    false
            ));
        }

        boolean hasBlocking = issues.stream().anyMatch(ValidationIssue::blocking);
        boolean onlyKnownXrechnungNotices =
                !detectedRuleIds.isEmpty() &&
                        detectedRuleIds.stream().allMatch(xrechnungNoticeRules::contains);

        if (hasBlocking) {
            issues.add(new ValidationIssue(
                    "FACTUR_X",
                    "notice",
                    "MUSTANG_REPORT",
                    sanitizedReport,
                    null,
                    false
            ));
        } else if (onlyKnownXrechnungNotices) {
            issues.add(new ValidationIssue(
                    "XRECHNUNG",
                    "notice",
                    "MUSTANG_REPORT",
                    sanitizedReport,
                    null,
                    false
            ));
        } else {
            issues.add(new ValidationIssue(
                    "FACTUR_X",
                    "error",
                    "MUSTANG_REPORT",
                    sanitizedReport,
                    null,
                    true
            ));
        }

        return issues;
    }

    private static String getFriendlyFacturXRuleMessage(String ruleId) {
        if ("BR-CO-09".equals(ruleId)) {
            return "Die USt-IdNr. des Verkäufers ist ungültig. Erwartetes Format: DE123456789.";
        }

        if ("BR-CO-26".equals(ruleId)) {
            return "Für die E-Rechnung fehlt eine eindeutige Verkäuferkennung. Bitte hinterlege die USt-IdNr. oder Handelsregisternummer von W.A.W Nutzfahrzeuge.";
        }

        return "Factur-X/EN16931-Regel verletzt: " + ruleId;
    }

    private static boolean isValidVatIdForCountry(String vatId, String countryCode) {
        if (isBlank(vatId)) {
            return true;
        }

        String normalizedVatId = vatId.trim().toUpperCase();
        String normalizedCountryCode = countryCode == null ? "" : countryCode.trim().toUpperCase();

        if ("DE".equals(normalizedCountryCode)) {
            return Pattern.matches("^DE[0-9]{9}$", normalizedVatId);
        }

        return Pattern.matches("^[A-Z]{2}.+", normalizedVatId);
    }

    private static List<String> extractRuleIds(String report) {
        if (report == null || report.isBlank()) {
            return List.of();
        }

        Pattern pattern = Pattern.compile("(PEPPOL-EN16931-R\\d+|BR-[A-Z]{2}-\\d+|BR-CO-\\d+)");
        Matcher matcher = pattern.matcher(report);
        List<String> ruleIds = new ArrayList<>();

        while (matcher.find()) {
            String ruleId = matcher.group(1);
            if (!ruleIds.contains(ruleId)) {
                ruleIds.add(ruleId);
            }
        }

        return ruleIds;
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private static String sanitizeValidatorReport(String report) {
        if (report == null) {
            return "";
        }

        String compact = report.replaceAll("\\s+", " ").trim();
        return compact.length() > 800 ? compact.substring(0, 800) + "..." : compact;
    }

    private static String safeFilePart(String value) {
        return value.replaceAll("[^A-Za-z0-9._-]", "-");
    }

    private static String sha256(byte[] bytes) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        return HexFormat.of().formatHex(digest.digest(bytes));
    }

    private static String text(Object value) {
        return String.valueOf(value == null ? "" : value).trim();
    }

    private static boolean sameMoney(BigDecimal expected, String actual) {
        try {
            return expected.setScale(2, RoundingMode.HALF_UP)
                    .compareTo(new BigDecimal(actual).setScale(2, RoundingMode.HALF_UP)) == 0;
        } catch (Exception error) {
            return false;
        }
    }

    public static class ValidationFailedException extends RuntimeException {
        private final List<ValidationIssue> issues;

        public ValidationFailedException(List<ValidationIssue> issues) {
            super("ZUGFeRD validation failed");
            this.issues = issues;
        }

        public List<ValidationIssue> issues() {
            return issues;
        }
    }
}
