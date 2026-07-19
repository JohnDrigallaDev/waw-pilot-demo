package de.waw.zugferd.model;

public record GenerateResponse(
        String pdfBase64,
        String fileName,
        String sha256,
        String standardVersion,
        String profile,
        ValidationSummary validation
) {
}
