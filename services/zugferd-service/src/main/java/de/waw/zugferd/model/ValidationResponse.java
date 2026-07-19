package de.waw.zugferd.model;

import java.util.List;

public record ValidationResponse(
        String status,
        List<ValidationIssue> issues
) {
}
