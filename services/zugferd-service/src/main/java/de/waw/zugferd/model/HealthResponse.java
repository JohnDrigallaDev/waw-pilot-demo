package de.waw.zugferd.model;

public record HealthResponse(
        String status,
        String mustangVersion,
        String veraPdfVersion,
        String ghostscriptAvailable,
        String veraPdfAvailable
) {
}
