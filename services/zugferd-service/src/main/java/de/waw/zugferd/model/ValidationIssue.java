package de.waw.zugferd.model;

public record ValidationIssue(
        String source,
        String severity,
        String ruleId,
        String message,
        String location,
        boolean blocking
) {
}
