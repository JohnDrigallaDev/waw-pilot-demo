package de.waw.zugferd.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import org.springframework.stereotype.Component;

@Component
public class ProcessRunner {
    public ProcessResult run(List<String> command, Duration timeout)
            throws IOException, InterruptedException {
        Process process = new ProcessBuilder(command)
                .redirectErrorStream(true)
                .start();

        CompletableFuture<String> outputReader = CompletableFuture.supplyAsync(() -> {
            try {
                return new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            } catch (IOException error) {
                throw new ProcessOutputException(error);
            }
        });

        boolean finished = process.waitFor(timeout.toMillis(), TimeUnit.MILLISECONDS);

        if (!finished) {
            process.destroyForcibly();
            process.waitFor(5, TimeUnit.SECONDS);
            throw new IOException("Process timed out: " + commandName(command));
        }

        String output;

        try {
            output = outputReader.get(5, TimeUnit.SECONDS);
        } catch (ExecutionException error) {
            Throwable cause = error.getCause();

            if (cause instanceof ProcessOutputException outputException) {
                throw outputException.ioException;
            }

            throw new IOException("Could not read process output", cause);
        } catch (java.util.concurrent.TimeoutException error) {
            throw new IOException("Reading process output timed out: " + commandName(command), error);
        }

        return new ProcessResult(process.exitValue(), output);
    }

    private static String commandName(List<String> command) {
        return command.isEmpty() ? "unknown command" : command.get(0);
    }

    private static final class ProcessOutputException extends RuntimeException {
        private final IOException ioException;

        private ProcessOutputException(IOException ioException) {
            super(ioException);
            this.ioException = ioException;
        }
    }

    public record ProcessResult(int exitCode, String output) {
    }
}
