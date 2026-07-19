package de.waw.zugferd.model;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record GenerateRequest(
        @NotBlank String standardVersion,
        @NotBlank String profile,
        @Valid @NotNull CanonicalInvoice invoice,
        @NotBlank String visiblePdfBase64
) {
}
