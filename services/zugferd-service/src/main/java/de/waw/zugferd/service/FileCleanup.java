package de.waw.zugferd.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;

public final class FileCleanup {
    private FileCleanup() {
    }

    public static void deleteRecursively(Path directory) {
        if (directory == null || !Files.exists(directory)) {
            return;
        }

        try (var paths = Files.walk(directory)) {
            paths.sorted(Comparator.reverseOrder()).forEach(path -> {
                try {
                    Files.deleteIfExists(path);
                } catch (IOException ignored) {
                    // Best-effort cleanup. Do not expose paths or contents.
                }
            });
        } catch (IOException ignored) {
            // Best-effort cleanup. Do not expose paths or contents.
        }
    }
}
