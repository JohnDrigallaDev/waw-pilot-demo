package de.waw.zugferd.model;

import java.util.List;

public record ValidationSummary(
        String status,
        String mustangVersion,
        String veraPdfVersion,
        boolean xmlValid,
        boolean pdfAValid,
        boolean consistencyValid,
        List<ValidationIssue> issues,
        List<ValidationIssue> blockingErrors,
        List<ValidationIssue> warnings,
        List<ValidationIssue> profileNotices
) {
    public static ValidationSummary of(
            String status,
            String mustangVersion,
            String veraPdfVersion,
            boolean xmlValid,
            boolean pdfAValid,
            boolean consistencyValid,
            List<ValidationIssue> issues
    ) {
        List<ValidationIssue> safeIssues = issues == null ? List.of() : issues;

        return new ValidationSummary(
                status,
                mustangVersion,
                veraPdfVersion,
                xmlValid,
                pdfAValid,
                consistencyValid,
                safeIssues,
                safeIssues.stream().filter(ValidationIssue::blocking).toList(),
                safeIssues.stream()
                        .filter((issue) -> !issue.blocking())
                        .filter((issue) -> !"XRECHNUNG".equals(issue.source()))
                        .toList(),
                safeIssues.stream()
                        .filter((issue) -> !issue.blocking())
                        .filter((issue) -> "XRECHNUNG".equals(issue.source()))
                        .toList()
        );
    }
}
