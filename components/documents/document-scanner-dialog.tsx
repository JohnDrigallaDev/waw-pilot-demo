"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Loader2, ScanLine, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

type DocumentScannerDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onScanComplete: (file: File) => void;
};

type JscanifyConstructor = new () => JscanifyScanner;

type JscanifyScanner = {
    highlightPaper: (
        image: HTMLCanvasElement,
        options?: { color?: string; thickness?: number },
    ) => HTMLCanvasElement;
    extractPaper: (
        image: HTMLCanvasElement,
        resultWidth: number,
        resultHeight: number,
    ) => HTMLCanvasElement | null;
};

declare global {
    interface Window {
        cv?: unknown;
    }
}

const CAMERA_TIMEOUT_MS = 9000;
const VIDEO_READY_TIMEOUT_MS = 8000;
const SCANNER_LOAD_TIMEOUT_MS = 12000;
const DETECTION_INTERVAL_MS = 700;
const OPENCV_SCRIPT_SRC = "/vendor/jscanify-opencv.js";

let jscanifyPromise: Promise<JscanifyConstructor> | null = null;

function createTimeoutError(message: string): Error {
    return new Error(message);
}

function withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    message: string,
): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
            reject(createTimeoutError(message));
        }, timeoutMs);

        promise.then(
            (value) => {
                window.clearTimeout(timeoutId);
                resolve(value);
            },
            (error) => {
                window.clearTimeout(timeoutId);
                reject(error);
            },
        );
    });
}

function stopMediaStream(stream: MediaStream | null) {
    stream?.getTracks().forEach((track) => track.stop());
}

function isVideoDimensionReady(video: HTMLVideoElement): boolean {
    return video.videoWidth > 0 && video.videoHeight > 0;
}

function waitForVideoReady(video: HTMLVideoElement): Promise<void> {
    if (isVideoDimensionReady(video)) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        let intervalId: number | null = null;
        let timeoutId: number | null = null;

        const cleanup = () => {
            video.removeEventListener("loadedmetadata", handleReady);
            video.removeEventListener("loadeddata", handleReady);
            video.removeEventListener("canplay", handleReady);
            video.removeEventListener("playing", handleReady);
            video.removeEventListener("resize", handleReady);

            if (intervalId !== null) window.clearInterval(intervalId);
            if (timeoutId !== null) window.clearTimeout(timeoutId);
        };

        const handleReady = () => {
            if (!isVideoDimensionReady(video)) return;

            console.info("[scanner] video ready width/height", {
                width: video.videoWidth,
                height: video.videoHeight,
                readyState: video.readyState,
            });

            cleanup();
            resolve();
        };

        video.addEventListener("loadedmetadata", handleReady);
        video.addEventListener("loadeddata", handleReady);
        video.addEventListener("canplay", handleReady);
        video.addEventListener("playing", handleReady);
        video.addEventListener("resize", handleReady);

        intervalId = window.setInterval(handleReady, 150);
        timeoutId = window.setTimeout(() => {
            cleanup();
            console.warn("[scanner] waitForVideoReady timeout", {
                width: video.videoWidth,
                height: video.videoHeight,
                readyState: video.readyState,
            });
            reject(
                createTimeoutError(
                    "Kameravorschau konnte nicht gestartet werden.",
                ),
            );
        }, VIDEO_READY_TIMEOUT_MS);

        handleReady();
    });
}

function startVideoPlayback(video: HTMLVideoElement) {
    console.info("[scanner] video.play started");
    let playSettled = false;

    void video.play().then(
        () => {
            playSettled = true;
        },
        () => {
            playSettled = true;
            console.warn("[scanner] video.play rejected/ignored");
        },
    );

    window.setTimeout(() => {
        if (!playSettled) {
            console.warn("[scanner] video.play timeout/ignored");
        }
    }, 1000);
}

function getCameraErrorMessage(hasStream: boolean): string {
    if (hasStream) {
        return "Kameravorschau konnte nicht gestartet werden. Bitte Seite neu laden oder Datei manuell hochladen.";
    }

    return "Kamera konnte nicht geöffnet werden. Bitte Berechtigung prüfen oder Datei manuell hochladen.";
}

function getScanFileName(): string {
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const time = [now.getHours(), now.getMinutes(), now.getSeconds()]
        .map((value) => String(value).padStart(2, "0"))
        .join("-");

    return `scan-${date}-${time}.jpg`;
}

function canvasToFile(canvas: HTMLCanvasElement): Promise<File> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error("Scan konnte nicht als Bild gespeichert werden."));
                    return;
                }

                resolve(
                    new File([blob], getScanFileName(), {
                        type: "image/jpeg",
                        lastModified: Date.now(),
                    }),
                );
            },
            "image/jpeg",
            0.92,
        );
    });
}

function drawVideoFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
        throw new Error("Kamerabild konnte nicht gelesen werden.");
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
}

async function getCameraStreamWithFallback(
    onLateStream: (stream: MediaStream) => void,
): Promise<MediaStream> {
    const constraints: MediaStreamConstraints[] = [
        {
            audio: false,
            video: {
                facingMode: { ideal: "environment" },
                width: { ideal: 1280 },
                height: { ideal: 720 },
            },
        },
        {
            audio: false,
            video: { facingMode: "environment" },
        },
        {
            audio: false,
            video: true,
        },
    ];

    let lastError: unknown = null;

    for (const constraint of constraints) {
        let timedOut = false;
        const cameraPromise = navigator.mediaDevices
            .getUserMedia(constraint)
            .then((stream) => {
                if (timedOut) onLateStream(stream);
                return stream;
            });

        try {
            return await withTimeout(
                cameraPromise,
                CAMERA_TIMEOUT_MS,
                "Kamera konnte nicht geöffnet werden.",
            );
        } catch (error) {
            timedOut = true;
            lastError = error;
        }
    }

    throw lastError instanceof Error
        ? lastError
        : new Error("Kamera konnte nicht geöffnet werden.");
}

function isCvReady(value: unknown): boolean {
    if (!value || typeof value !== "object") return false;

    const runtime = value as {
        Mat?: unknown;
        imread?: unknown;
        Canny?: unknown;
        findContours?: unknown;
        warpPerspective?: unknown;
    };

    return (
        typeof runtime.Mat === "function" &&
        typeof runtime.imread === "function" &&
        typeof runtime.Canny === "function" &&
        typeof runtime.findContours === "function" &&
        typeof runtime.warpPerspective === "function"
    );
}

function loadOpenCvScript(): Promise<void> {
    if (isCvReady(window.cv)) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        let settled = false;
        let intervalId: number | null = null;
        let timeoutId: number | null = null;

        const cleanup = () => {
            if (intervalId !== null) window.clearInterval(intervalId);
            if (timeoutId !== null) window.clearTimeout(timeoutId);
        };

        const tryResolve = () => {
            if (!isCvReady(window.cv) || settled) return;

            settled = true;
            cleanup();
            resolve();
        };

        const existingScript = document.querySelector<HTMLScriptElement>(
            'script[data-document-scanner-opencv="jscanify"]',
        );

        if (!existingScript) {
            const script = document.createElement("script");
            script.src = OPENCV_SCRIPT_SRC;
            script.async = true;
            script.dataset.documentScannerOpencv = "jscanify";
            script.addEventListener("load", tryResolve);
            script.addEventListener(
                "error",
                () => {
                    if (settled) return;
                    settled = true;
                    cleanup();
                    reject(new Error("OpenCV konnte nicht geladen werden."));
                },
                { once: true },
            );
            document.head.appendChild(script);
        }

        intervalId = window.setInterval(tryResolve, 100);
        timeoutId = window.setTimeout(() => {
            if (settled) return;
            settled = true;
            cleanup();
            reject(new Error("Scanner konnte nicht geladen werden."));
        }, SCANNER_LOAD_TIMEOUT_MS);

        tryResolve();
    });
}

function loadJscanify(): Promise<JscanifyConstructor> {
    if (jscanifyPromise) return jscanifyPromise;

    jscanifyPromise = Promise.all([
        loadOpenCvScript(),
        import("jscanify/client") as Promise<{
            default: JscanifyConstructor;
        }>,
    ])
        .then(([, module]) => module.default)
        .catch((error) => {
            jscanifyPromise = null;
            throw error;
        });

    return jscanifyPromise;
}

export function DocumentScannerDialog({
                                          open,
                                          onOpenChange,
                                          onScanComplete,
                                      }: DocumentScannerDialogProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const frameCanvasRef = useRef<HTMLCanvasElement>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const outputCanvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const detectionIntervalRef = useRef<number | null>(null);
    const scannerRef = useRef<JscanifyScanner | null>(null);
    const detectionRunningRef = useRef(false);

    const [isLoadingScanner, setIsLoadingScanner] = useState(false);
    const [isOpeningCamera, setIsOpeningCamera] = useState(false);
    const [isPreparingVideo, setIsPreparingVideo] = useState(false);
    const [isVideoReady, setIsVideoReady] = useState(false);
    const [canCapturePhoto, setCanCapturePhoto] = useState(false);
    const [isProcessingScan, setIsProcessingScan] = useState(false);
    const [isScannerUnavailable, setIsScannerUnavailable] = useState(false);
    const [documentDetected, setDocumentDetected] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const stopScanner = useCallback(() => {
        if (detectionIntervalRef.current !== null) {
            window.clearInterval(detectionIntervalRef.current);
            detectionIntervalRef.current = null;
        }

        stopMediaStream(streamRef.current);
        streamRef.current = null;

        const video = videoRef.current;
        if (video) {
            video.pause();
            video.srcObject = null;
            video.removeAttribute("src");
            video.load();
        }

        detectionRunningRef.current = false;
        scannerRef.current = null;
        setDocumentDetected(false);

        const overlayCanvas = overlayCanvasRef.current;
        const overlayContext = overlayCanvas?.getContext("2d");
        if (overlayCanvas && overlayContext) {
            overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        }
    }, []);

    const resetScannerState = useCallback(() => {
        setIsLoadingScanner(false);
        setIsOpeningCamera(false);
        setIsPreparingVideo(false);
        setIsVideoReady(false);
        setCanCapturePhoto(false);
        setIsProcessingScan(false);
        setIsScannerUnavailable(false);
        setDocumentDetected(false);
        setErrorMessage(null);
    }, []);

    const handleCancel = useCallback(() => {
        stopScanner();
        resetScannerState();
        onOpenChange(false);
    }, [onOpenChange, resetScannerState, stopScanner]);

    const analyzeFrame = useCallback(() => {
        if (detectionRunningRef.current) return;

        const scanner = scannerRef.current;
        const video = videoRef.current;
        const frameCanvas = frameCanvasRef.current;
        const overlayCanvas = overlayCanvasRef.current;
        const overlayContext = overlayCanvas?.getContext("2d", {
            willReadFrequently: true,
        });

        if (
            !scanner ||
            !video ||
            !frameCanvas ||
            !overlayCanvas ||
            !overlayContext ||
            !isVideoDimensionReady(video)
        ) {
            return;
        }

        detectionRunningRef.current = true;

        try {
            const analysisWidth = Math.min(960, video.videoWidth);
            const analysisHeight = Math.round(
                video.videoHeight * (analysisWidth / video.videoWidth),
            );

            frameCanvas.width = analysisWidth;
            frameCanvas.height = analysisHeight;
            overlayCanvas.width = analysisWidth;
            overlayCanvas.height = analysisHeight;

            const frameContext = frameCanvas.getContext("2d", {
                willReadFrequently: true,
            });
            if (!frameContext) return;

            frameContext.drawImage(video, 0, 0, analysisWidth, analysisHeight);

            const highlightedCanvas = scanner.highlightPaper(frameCanvas, {
                color: "#22d3ee",
                thickness: Math.max(4, analysisWidth / 180),
            });

            overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
            overlayContext.drawImage(
                highlightedCanvas,
                0,
                0,
                overlayCanvas.width,
                overlayCanvas.height,
            );

            setDocumentDetected(true);
        } catch {
            const overlayContext = overlayCanvas.getContext("2d");
            overlayContext?.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
            setDocumentDetected(false);
        } finally {
            detectionRunningRef.current = false;
        }
    }, []);

    const startDetection = useCallback(() => {
        const video = videoRef.current;

        if (
            detectionIntervalRef.current !== null ||
            !scannerRef.current ||
            !video ||
            !isVideoDimensionReady(video)
        ) {
            return;
        }

        detectionIntervalRef.current = window.setInterval(
            analyzeFrame,
            DETECTION_INTERVAL_MS,
        );
        analyzeFrame();
    }, [analyzeFrame]);

    useEffect(() => {
        if (!open) {
            stopScanner();
            resetScannerState();
            return;
        }

        let cancelled = false;

        async function startScannerLibrary() {
            setIsLoadingScanner(true);
            setIsScannerUnavailable(false);

            try {
                const Jscanify = await loadJscanify();
                if (cancelled) return;

                scannerRef.current = new Jscanify();
                setIsScannerUnavailable(false);
                startDetection();
            } catch {
                if (cancelled) return;

                scannerRef.current = null;
                setIsScannerUnavailable(true);
                setDocumentDetected(false);
            } finally {
                if (!cancelled) setIsLoadingScanner(false);
            }
        }

        async function startCamera() {
            stopScanner();
            resetScannerState();

            try {
                if (!navigator.mediaDevices?.getUserMedia) {
                    throw new Error("Kamera-API ist in diesem Browser nicht verfügbar.");
                }

                setIsOpeningCamera(true);
                const stream = await getCameraStreamWithFallback((lateStream) => {
                    stopMediaStream(lateStream);
                });
                console.info("[scanner] getUserMedia resolved");

                if (cancelled) {
                    stopMediaStream(stream);
                    return;
                }

                setIsOpeningCamera(false);
                setIsPreparingVideo(true);
                streamRef.current = stream;

                const video = videoRef.current;
                if (!video) {
                    throw new Error("Kameravorschau konnte nicht initialisiert werden.");
                }

                video.muted = true;
                video.playsInline = true;
                video.autoplay = true;
                video.srcObject = stream;

                console.info("[scanner] video srcObject set");
                startVideoPlayback(video);
                console.info("[scanner] waiting for video ready");
                await waitForVideoReady(video);

                if (cancelled) return;

                setIsVideoReady(true);
                setCanCapturePhoto(true);
                startDetection();
            } catch {
                if (cancelled) return;

                const hadStream = Boolean(streamRef.current);
                stopScanner();
                setIsOpeningCamera(false);
                setIsPreparingVideo(false);
                setIsVideoReady(false);
                setCanCapturePhoto(false);
                setErrorMessage(getCameraErrorMessage(hadStream));
                return;
            } finally {
                if (!cancelled) {
                    setIsOpeningCamera(false);
                    setIsPreparingVideo(false);
                }
            }
        }

        void startCamera();
        void startScannerLibrary();

        return () => {
            cancelled = true;
            stopScanner();
        };
    }, [open, resetScannerState, startDetection, stopScanner]);

    useEffect(() => {
        if (!open) return;

        const intervalId = window.setInterval(() => {
            const video = videoRef.current;

            if (!video || !isVideoDimensionReady(video)) return;

            setCanCapturePhoto(true);
            setIsVideoReady(true);
            setIsPreparingVideo(false);
            startDetection();
        }, 150);

        return () => window.clearInterval(intervalId);
    }, [open, startDetection]);

    async function handlePhotoCapture() {
        const video = videoRef.current;
        const outputCanvas = outputCanvasRef.current;

        if (!video || !outputCanvas || !isVideoDimensionReady(video)) {
            setErrorMessage("Foto konnte nicht verarbeitet werden.");
            return;
        }

        setIsProcessingScan(true);
        setErrorMessage(null);

        try {
            drawVideoFrame(video, outputCanvas);

            const file = await canvasToFile(outputCanvas);
            stopScanner();
            onScanComplete(file);
            onOpenChange(false);
        } catch {
            setErrorMessage(
                "Foto konnte nicht verarbeitet werden. Bitte erneut versuchen oder Datei manuell hochladen.",
            );
        } finally {
            setIsProcessingScan(false);
        }
    }

    async function handleDocumentScan() {
        const video = videoRef.current;
        const scanner = scannerRef.current;
        const frameCanvas = frameCanvasRef.current;
        const outputCanvas = outputCanvasRef.current;

        if (!video || !scanner || !frameCanvas || !outputCanvas) {
            await handlePhotoCapture();
            return;
        }

        setIsProcessingScan(true);
        setErrorMessage(null);

        try {
            drawVideoFrame(video, frameCanvas);

            const targetWidth = Math.min(1600, frameCanvas.width);
            const targetHeight = Math.max(
                1,
                Math.round(frameCanvas.height * (targetWidth / frameCanvas.width)),
            );
            const scannedCanvas = scanner.extractPaper(
                frameCanvas,
                targetWidth,
                targetHeight,
            );

            if (!scannedCanvas) {
                setIsProcessingScan(false);
                await handlePhotoCapture();
                return;
            }

            outputCanvas.width = scannedCanvas.width;
            outputCanvas.height = scannedCanvas.height;
            const outputContext = outputCanvas.getContext("2d", {
                willReadFrequently: true,
            });
            if (!outputContext) {
                throw new Error("Scan konnte nicht verarbeitet werden.");
            }

            outputContext.drawImage(scannedCanvas, 0, 0);

            const file = await canvasToFile(outputCanvas);
            stopScanner();
            onScanComplete(file);
            onOpenChange(false);
        } catch {
            setIsProcessingScan(false);
            await handlePhotoCapture();
        } finally {
            setIsProcessingScan(false);
        }
    }

    async function handlePrimaryAction() {
        if (scannerRef.current && documentDetected) {
            await handleDocumentScan();
            return;
        }

        await handlePhotoCapture();
    }

    const hasCameraError = Boolean(errorMessage && !isVideoReady);
    const showCameraLoading = open && isOpeningCamera && !isVideoReady && !hasCameraError;
    const showVideoPreparing =
        open &&
        isPreparingVideo &&
        !isOpeningCamera &&
        !isVideoReady &&
        !hasCameraError;
    const primaryButtonLabel = isProcessingScan
        ? "Wird verarbeitet..."
        : scannerRef.current && documentDetected
            ? "Scan übernehmen"
            : "Foto übernehmen";

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen) {
                    handleCancel();
                    return;
                }

                onOpenChange(true);
            }}
        >
            <DialogContent
                showCloseButton={false}
                className="max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-4xl overflow-y-auto rounded-2xl bg-slate-950 p-3 text-white sm:p-5"
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-extrabold text-white">
                        <ScanLine className="size-5 text-cyan-400" />
                        Dokument scannen
                    </DialogTitle>
                    <DialogDescription className="text-slate-300">
                        Die Verarbeitung erfolgt lokal im Browser. Es wird erst nach deiner
                        Bestätigung hochgeladen.
                    </DialogDescription>
                </DialogHeader>

                <div className="relative overflow-hidden rounded-2xl bg-black">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="block max-h-[62dvh] w-full object-contain"
                    />
                    <canvas
                        ref={overlayCanvasRef}
                        className="pointer-events-none absolute inset-0 size-full opacity-70"
                    />

                    {showCameraLoading || showVideoPreparing ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/85">
                            <div className="text-center">
                                <Loader2 className="mx-auto size-8 animate-spin text-cyan-400" />
                                {showCameraLoading ? (
                                    <>
                                        <p className="mt-3 font-bold">Kamera wird geöffnet...</p>
                                        <p className="mt-1 text-sm text-slate-300">
                                            Bitte Kamerazugriff erlauben.
                                        </p>
                                    </>
                                ) : null}
                                {showVideoPreparing ? (
                                    <>
                                        <p className="mt-3 font-bold">Kamera wird vorbereitet...</p>
                                        <p className="mt-1 text-sm text-slate-300">
                                            Videovorschau wird gestartet.
                                        </p>
                                    </>
                                ) : null}
                            </div>
                        </div>
                    ) : null}

                    {hasCameraError ? (
                        <div className="absolute inset-0 flex min-h-72 items-center justify-center bg-slate-950 p-6">
                            <div className="max-w-md text-center">
                                <TriangleAlert className="mx-auto size-9 text-amber-400" />
                                <p className="mt-4 font-extrabold">Scanner nicht verfügbar</p>
                                <p className="mt-2 text-sm leading-6 text-slate-300">
                                    {errorMessage}
                                </p>
                            </div>
                        </div>
                    ) : null}
                </div>

                <canvas ref={frameCanvasRef} className="hidden" />
                <canvas ref={outputCanvasRef} className="hidden" />

                {isVideoReady ? (
                    <div
                        className={
                            documentDetected
                                ? "rounded-2xl border border-emerald-700 bg-emerald-950/70 px-4 py-3 text-sm font-bold text-emerald-200"
                                : "rounded-2xl border border-amber-700 bg-amber-950/70 px-4 py-3 text-sm font-bold text-amber-200"
                        }
                    >
                        {documentDetected && scannerRef.current
                            ? "Dokument erkannt - Scan übernehmen"
                            : isScannerUnavailable
                                ? "Automatische Erkennung nicht verfügbar - Foto kann trotzdem übernommen werden."
                                : isLoadingScanner
                                    ? "Dokumenterkennung wird geladen... Foto kann trotzdem übernommen werden."
                                    : "Dokument vollständig ins Bild halten oder Foto übernehmen"}
                    </div>
                ) : null}

                {errorMessage && isVideoReady ? (
                    <div className="rounded-2xl border border-red-700 bg-red-950/70 px-4 py-3 text-sm font-bold text-red-200">
                        {errorMessage}
                    </div>
                ) : null}

                <DialogFooter className="sticky bottom-0 z-10 border-slate-700 bg-slate-900">
                    <Button
                        type="button"
                        variant="outline"
                        className="h-11 border-slate-600 bg-slate-900 text-white hover:bg-slate-800"
                        onClick={handleCancel}
                    >
                        Abbrechen
                    </Button>
                    <Button
                        type="button"
                        disabled={!canCapturePhoto || isProcessingScan}
                        className="h-11 bg-cyan-600 text-white hover:bg-cyan-500"
                        onClick={() => void handlePrimaryAction()}
                    >
                        {isProcessingScan ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <Camera className="size-4" />
                        )}
                        {primaryButtonLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
