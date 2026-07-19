package de.waw.zugferd.api;

import de.waw.zugferd.model.GenerateRequest;
import de.waw.zugferd.model.GenerateResponse;
import de.waw.zugferd.model.HealthResponse;
import de.waw.zugferd.model.ValidationIssue;
import de.waw.zugferd.model.ValidationResponse;
import de.waw.zugferd.service.ZugferdPipelineService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ZugferdController {
    private final ZugferdPipelineService pipelineService;

    public ZugferdController(ZugferdPipelineService pipelineService) {
        this.pipelineService = pipelineService;
    }

    @GetMapping("/health")
    public HealthResponse health() {
        return pipelineService.health();
    }

    @PostMapping("/generate")
    public GenerateResponse generate(@Valid @RequestBody GenerateRequest request) throws Exception {
        return pipelineService.generate(request);
    }

    @PostMapping("/validate")
    public ValidationResponse validate(@Valid @RequestBody GenerateRequest request) throws Exception {
        return pipelineService.validateGeneratedResult(request);
    }

    @ExceptionHandler(ZugferdPipelineService.ValidationFailedException.class)
    public ResponseEntity<ValidationResponse> validationFailed(
            ZugferdPipelineService.ValidationFailedException exception
    ) {
        return ResponseEntity
                .status(HttpStatus.UNPROCESSABLE_ENTITY)
                .body(new ValidationResponse("invalid", exception.issues()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ValidationResponse> generalError(Exception exception) {
        ValidationIssue issue = new ValidationIssue(
                "FACTUR_X",
                "error",
                null,
                "ZUGFeRD-Service konnte die Rechnung nicht erstellen oder validieren.",
                null,
                true
        );

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ValidationResponse("invalid", List.of(issue)));
    }
}
