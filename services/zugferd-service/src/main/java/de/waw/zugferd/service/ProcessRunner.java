package de.waw.zugferd.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.TimeUnit;
import org.springframework.stereotype.Component;

@Component
public class ProcessRunner {
    public ProcessResult run(List<String> command, Duration timeout)
            throws IOException, InterruptedException {
        Process process = new ProcessBuilder(command)
                .redirectErrorStream(true)
                .start();

        boolean finished = process.waitFor(timeout.toMillis(), TimeUnit.MILLISECONDS);

        if (!finished) {
            process.destroyForcibly();
            throw new IOException("Process timed out");
        }

        String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);

        return new ProcessResult(process.exitValue(), output);
    }

    public record ProcessResult(int exitCode, String output) {
    }
}
