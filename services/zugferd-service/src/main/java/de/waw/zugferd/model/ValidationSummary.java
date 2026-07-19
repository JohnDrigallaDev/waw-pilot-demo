package de.waw.zugferd.model;

import java.util.List;

public record ValidationSummary(
        String status,
        String mustangVersion,
        String veraPdfVersion,
        boolean xmlValid,
        boolean pdfAValid,
        boolean consistencyValid,
        List<ValidationIssue> issues
) {
}
