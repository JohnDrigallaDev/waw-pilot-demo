package de.waw.zugferd.service;

import static org.assertj.core.api.Assertions.assertThat;

import de.waw.zugferd.model.InvoiceProfile;
import de.waw.zugferd.model.ValidationIssue;
import java.util.List;
import org.junit.jupiter.api.Test;

class ZugferdPipelineServiceTest {
    private static final String XRECHNUNG_NOTICE_REPORT = """
            Parsed PDF:absent
            XML:valid
            Profile:urn:cen.eu:en16931:2017
            Errors:[27,27,27,27,27]
            /xslt/XR_30/XRechnung-CII-validation.xslt
            PEPPOL-EN16931-R001
            PEPPOL-EN16931-R010
            BR-DE-15
            BR-DE-21
            BR-DE-2
            """;

    @Test
    void knownXrechnungNoticesAreNotBlockingForZugferdEn16931() {
        List<ValidationIssue> issues = ZugferdPipelineService.classifyMustangReport(
                XRECHNUNG_NOTICE_REPORT,
                "xml",
                InvoiceProfile.ZUGFERD_EN16931
        );

        assertThat(issues).noneMatch(ValidationIssue::blocking);
        assertThat(issues)
                .filteredOn((issue) -> "XRECHNUNG".equals(issue.source()))
                .extracting(ValidationIssue::ruleId)
                .contains(
                        "PEPPOL-EN16931-R001",
                        "PEPPOL-EN16931-R010",
                        "BR-DE-15",
                        "BR-DE-21",
                        "BR-DE-2"
                );
        assertThat(issues)
                .anyMatch((issue) -> "MUSTANG_XML_ONLY".equals(issue.ruleId()) && !issue.blocking());
    }

    @Test
    void xrechnungRulesStayBlockingForXrechnungProfile() {
        List<ValidationIssue> issues = ZugferdPipelineService.classifyMustangReport(
                XRECHNUNG_NOTICE_REPORT,
                "xml",
                InvoiceProfile.XRECHNUNG
        );

        assertThat(issues)
                .filteredOn((issue) -> "XRECHNUNG".equals(issue.source()))
                .filteredOn(ValidationIssue::blocking)
                .extracting(ValidationIssue::ruleId)
                .contains("BR-DE-15", "BR-DE-21", "BR-DE-2");
    }

    @Test
    void realEn16931ErrorStaysBlocking() {
        List<ValidationIssue> issues = ZugferdPipelineService.classifyMustangReport(
                "XML:invalid FACTUR-X_EN16931.xslt BR-CO-09",
                "xml",
                InvoiceProfile.ZUGFERD_EN16931
        );

        assertThat(issues)
                .anyMatch((issue) -> "BR-CO-09".equals(issue.ruleId()) && issue.blocking());
    }

    @Test
    void unknownXrechnungRuleIsNotSilentlyReleasedForZugferd() {
        List<ValidationIssue> issues = ZugferdPipelineService.classifyMustangReport(
                "XML:valid /xslt/XR_30/XRechnung-CII-validation.xslt BR-DE-99",
                "xml",
                InvoiceProfile.ZUGFERD_EN16931
        );

        assertThat(issues)
                .anyMatch((issue) -> "XRECHNUNG_UNKNOWN_RULE".equals(issue.ruleId()) && issue.blocking());
    }
}
