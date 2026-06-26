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

type DocumentPoint = {
    x: number;
    y: number;
};

type CvMat = {
    rows: number;
    cols: number;
    data32S: Int32Array;
    delete: () => void;
};

type CvMatVector = {
    size: () => number;
    get: (index: number) => CvMat;
    delete: () => void;
};

type CvRuntime = {
    Mat: new (...args: number[]) => CvMat;
    MatVector: new () => CvMatVector;
    Size: new (width: number, height: number) => unknown;
    Scalar: new (...values: number[]) => unknown;
    COLOR_RGBA2GRAY: number;
    RETR_LIST: number;
    CHAIN_APPROX_SIMPLE: number;
    INTER_LINEAR: number;
    BORDER_CONSTANT: number;
    CV_32FC2: number;
    imread: (source: HTMLCanvasElement) => CvMat;
    imshow: (target: HTMLCanvasElement, mat: CvMat) => void;
    cvtColor: (source: CvMat, target: CvMat, code: number) => void;
    GaussianBlur: (
        source: CvMat,
        target: CvMat,
        size: unknown,
        sigmaX: number,
    ) => void;
    Canny: (
        source: CvMat,
        target: CvMat,
        threshold1: number,
        threshold2: number,
    ) => void;
    findContours: (
        image: CvMat,
        contours: CvMatVector,
        hierarchy: CvMat,
        mode: number,
        method: number,
    ) => void;
    contourArea: (contour: CvMat) => number;
    arcLength: (curve: CvMat, closed: boolean) => number;
    approxPolyDP: (
        curve: CvMat,
        approximation: CvMat,
        epsilon: number,
        closed: boolean,
    ) => void;
    matFromArray: (
        rows: number,
        columns: number,
        type: number,
        values: number[],
    ) => CvMat;
    getPerspectiveTransform: (source: CvMat, target: CvMat) => CvMat;
    warpPerspective: (
        source: CvMat,
        target: CvMat,
        transform: CvMat,
        size: unknown,
        flags: number,
        borderMode: number,
        borderValue: unknown,
    ) => void;
};

declare global {
    interface Window {
        cv?: CvRuntime | PromiseLike<CvRuntime>;
    }
}

let openCvPromise: Promise<CvRuntime> | null = null;

const OPEN_CV_TIMEOUT_MS = 12000;
const CAMERA_TIMEOUT_MS = 9000;
const VIDEO_READY_TIMEOUT_MS = 6000;

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

function waitForVideoReady(video: HTMLVideoElement): Promise<void> {
    if (video.videoWidth > 0 && video.videoHeight > 0) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        let intervalId: number | null = null;
        let timeoutId: number | null = null;

        const cleanup = () => {
            video.removeEventListener("loadedmetadata", handleReady);
            video.removeEventListener("canplay", handleReady);
            video.removeEventListener("playing", handleReady);

            if (intervalId !== null) {
                window.clearInterval(intervalId);
            }

            if (timeoutId !== null) {
                window.clearTimeout(timeoutId);
            }
        };

        const handleReady = () => {
            if (video.videoWidth === 0 || video.videoHeight === 0) return;

            cleanup();
            resolve();
        };

        video.addEventListener("loadedmetadata", handleReady);
        video.addEventListener("canplay", handleReady);
        video.addEventListener("playing", handleReady);

        intervalId = window.setInterval(handleReady, 150);
        timeoutId = window.setTimeout(() => {
            cleanup();
            reject(createTimeoutError("Video konnte nicht gestartet werden."));
        }, VIDEO_READY_TIMEOUT_MS);

        handleReady();
    });
}

function isCvRuntime(value: unknown): value is CvRuntime {
    return Boolean(
        value &&
            typeof value === "object" &&
            "Mat" in value &&
            typeof (value as { Mat?: unknown }).Mat === "function",
    );
}

function loadOpenCv(): Promise<CvRuntime> {
    if (openCvPromise) return openCvPromise;

    openCvPromise = new Promise<CvRuntime>((resolve, reject) => {
        const resolveRuntime = async () => {
            try {
                const candidate = await Promise.resolve(window.cv);

                if (isCvRuntime(candidate)) {
                    resolve(candidate);
                    return;
                }

                reject(new Error("OpenCV-Laufzeit ist nicht verfügbar."));
            } catch (error) {
                reject(error);
            }
        };

        if (window.cv) {
            void resolveRuntime();
            return;
        }

        const existingScript = document.querySelector<HTMLScriptElement>(
            'script[data-document-scanner-opencv="true"]',
        );

        if (existingScript) {
            existingScript.addEventListener("load", () => void resolveRuntime(), {
                once: true,
            });
            existingScript.addEventListener(
                "error",
                () => reject(new Error("OpenCV.js konnte nicht geladen werden.")),
                { once: true },
            );
            return;
        }

        const script = document.createElement("script");
        script.src = "/vendor/opencv.js";
        script.async = true;
        script.dataset.documentScannerOpencv = "true";
        script.addEventListener("load", () => void resolveRuntime(), {
            once: true,
        });
        script.addEventListener(
            "error",
            () => reject(new Error("OpenCV.js konnte nicht geladen werden.")),
            { once: true },
        );
        document.head.appendChild(script);
    }).catch((error) => {
        openCvPromise = null;
        throw error;
    });

    return openCvPromise;
}

function orderPoints(points: DocumentPoint[]): DocumentPoint[] {
    const sortedByY = [...points].sort((a, b) => a.y - b.y);
    const top = sortedByY.slice(0, 2).sort((a, b) => a.x - b.x);
    const bottom = sortedByY.slice(2).sort((a, b) => a.x - b.x);

    return [top[0], top[1], bottom[1], bottom[0]];
}

function distance(a: DocumentPoint, b: DocumentPoint): number {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function drawDetectedDocument(
    canvas: HTMLCanvasElement,
    points: DocumentPoint[] | null,
) {
    const context = canvas.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!points) return;

    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
    context.closePath();
    context.lineWidth = Math.max(4, canvas.width / 180);
    context.strokeStyle = "#22d3ee";
    context.fillStyle = "rgba(8, 145, 178, 0.12)";
    context.fill();
    context.stroke();

    points.forEach((point) => {
        context.beginPath();
        context.arc(point.x, point.y, Math.max(6, canvas.width / 120), 0, Math.PI * 2);
        context.fillStyle = "#ffffff";
        context.fill();
        context.lineWidth = Math.max(3, canvas.width / 240);
        context.strokeStyle = "#0891b2";
        context.stroke();
    });
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

export function DocumentScannerDialog({
                                          open,
                                          onOpenChange,
                                          onScanComplete,
                                      }: DocumentScannerDialogProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const analysisCanvasRef = useRef<HTMLCanvasElement>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const outputCanvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const intervalRef = useRef<number | null>(null);
    const detectedPointsRef = useRef<DocumentPoint[] | null>(null);
    const cvRef = useRef<CvRuntime | null>(null);
    const analysisRunningRef = useRef(false);

    const [isLoadingOpenCv, setIsLoadingOpenCv] = useState(false);
    const [isOpeningCamera, setIsOpeningCamera] = useState(false);
    const [isVideoReady, setIsVideoReady] = useState(false);
    const [isProcessingScan, setIsProcessingScan] = useState(false);
    const [documentDetected, setDocumentDetected] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const isLoading =
        open &&
        (isLoadingOpenCv || isOpeningCamera || (!isVideoReady && !errorMessage));

    const stopScanner = useCallback(() => {
        if (intervalRef.current !== null) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
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

        detectedPointsRef.current = null;
        cvRef.current = null;
        analysisRunningRef.current = false;
        setDocumentDetected(false);

        const overlayCanvas = overlayCanvasRef.current;
        if (overlayCanvas) {
            drawDetectedDocument(overlayCanvas, null);
        }
    }, []);

    const resetScannerState = useCallback(() => {
        setIsLoadingOpenCv(false);
        setIsOpeningCamera(false);
        setIsVideoReady(false);
        setIsProcessingScan(false);
        setDocumentDetected(false);
        setErrorMessage(null);
    }, []);

    const handleCancel = useCallback(() => {
        stopScanner();
        resetScannerState();
        onOpenChange(false);
    }, [onOpenChange, resetScannerState, stopScanner]);

    const analyzeFrame = useCallback(() => {
        if (analysisRunningRef.current) return;

        const video = videoRef.current;
        const analysisCanvas = analysisCanvasRef.current;
        const overlayCanvas = overlayCanvasRef.current;
        const cv = cvRef.current;

        if (
            !video ||
            !analysisCanvas ||
            !overlayCanvas ||
            !cv ||
            video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
            video.videoWidth === 0 ||
            video.videoHeight === 0
        ) {
            return;
        }

        analysisRunningRef.current = true;

        const sourceWidth = video.videoWidth;
        const sourceHeight = video.videoHeight;
        const analysisWidth = Math.min(960, sourceWidth);
        const analysisHeight = Math.round(
            sourceHeight * (analysisWidth / sourceWidth),
        );

        analysisCanvas.width = analysisWidth;
        analysisCanvas.height = analysisHeight;
        overlayCanvas.width = analysisWidth;
        overlayCanvas.height = analysisHeight;

        const context = analysisCanvas.getContext("2d", {
            willReadFrequently: true,
        });

        if (!context) {
            analysisRunningRef.current = false;
            return;
        }

        context.drawImage(video, 0, 0, analysisWidth, analysisHeight);

        let source: CvMat | null = null;
        let gray: CvMat | null = null;
        let blurred: CvMat | null = null;
        let edges: CvMat | null = null;
        let contours: CvMatVector | null = null;
        let hierarchy: CvMat | null = null;

        try {
            source = cv.imread(analysisCanvas);
            gray = new cv.Mat();
            blurred = new cv.Mat();
            edges = new cv.Mat();
            contours = new cv.MatVector();
            hierarchy = new cv.Mat();

            cv.cvtColor(source, gray, cv.COLOR_RGBA2GRAY);
            cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
            cv.Canny(blurred, edges, 60, 160);
            cv.findContours(
                edges,
                contours,
                hierarchy,
                cv.RETR_LIST,
                cv.CHAIN_APPROX_SIMPLE,
            );

            const minimumArea = analysisWidth * analysisHeight * 0.12;
            let bestArea = 0;
            let bestPoints: DocumentPoint[] | null = null;

            for (let index = 0; index < contours.size(); index += 1) {
                const contour = contours.get(index);
                const approximation = new cv.Mat();

                try {
                    const perimeter = cv.arcLength(contour, true);
                    cv.approxPolyDP(
                        contour,
                        approximation,
                        0.02 * perimeter,
                        true,
                    );

                    const area = Math.abs(cv.contourArea(approximation));

                    if (
                        approximation.rows === 4 &&
                        area >= minimumArea &&
                        area > bestArea
                    ) {
                        const values = approximation.data32S;
                        const points = orderPoints([
                            { x: values[0], y: values[1] },
                            { x: values[2], y: values[3] },
                            { x: values[4], y: values[5] },
                            { x: values[6], y: values[7] },
                        ]);

                        bestArea = area;
                        bestPoints = points;
                    }
                } finally {
                    approximation.delete();
                    contour.delete();
                }
            }

            detectedPointsRef.current = bestPoints;
            setDocumentDetected(Boolean(bestPoints));
            drawDetectedDocument(overlayCanvas, bestPoints);
        } catch {
            detectedPointsRef.current = null;
            setDocumentDetected(false);
            drawDetectedDocument(overlayCanvas, null);
        } finally {
            source?.delete();
            gray?.delete();
            blurred?.delete();
            edges?.delete();
            contours?.delete();
            hierarchy?.delete();
            analysisRunningRef.current = false;
        }
    }, []);

    useEffect(() => {
        if (!open) {
            stopScanner();
            resetScannerState();
            return;
        }

        let cancelled = false;

        async function startScanner() {
            stopScanner();
            resetScannerState();

            let cv: CvRuntime;

            try {
                setIsLoadingOpenCv(true);
                cv = await withTimeout(
                    loadOpenCv(),
                    OPEN_CV_TIMEOUT_MS,
                    "OpenCV konnte nicht geladen werden.",
                );
            } catch {
                if (cancelled) return;

                openCvPromise = null;
                stopScanner();
                setIsLoadingOpenCv(false);
                setErrorMessage(
                    "Dokumentenscanner konnte nicht geladen werden. Bitte Foto aufnehmen oder Datei auswählen.",
                );
                return;
            } finally {
                if (!cancelled) {
                    setIsLoadingOpenCv(false);
                }
            }

            try {
                if (!navigator.mediaDevices?.getUserMedia) {
                    throw new Error("Kamera-API ist in diesem Browser nicht verfügbar.");
                }

                setIsOpeningCamera(true);
                let cameraTimedOut = false;
                const cameraPromise = navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: {
                        facingMode: { ideal: "environment" },
                        width: { ideal: 1920 },
                        height: { ideal: 1080 },
                    },
                }).then((stream) => {
                    if (cancelled || cameraTimedOut) {
                        stopMediaStream(stream);
                    }

                    return stream;
                });

                const stream = await withTimeout(
                    cameraPromise,
                    CAMERA_TIMEOUT_MS,
                    "Kamera konnte nicht geöffnet werden.",
                ).catch((error) => {
                    cameraTimedOut = true;
                    throw error;
                });

                if (cancelled) {
                    stopMediaStream(stream);
                    return;
                }

                cvRef.current = cv;
                streamRef.current = stream;

                const video = videoRef.current;
                if (!video) {
                    throw new Error("Kameravorschau konnte nicht initialisiert werden.");
                }

                video.srcObject = stream;
                video.muted = true;
                video.playsInline = true;

                try {
                    await video.play();
                } catch {
                    // Safari can resolve video readiness via media events even when play()
                    // is slow to settle. The readiness timeout below keeps this bounded.
                }

                await waitForVideoReady(video);

                if (cancelled) return;

                setIsVideoReady(true);

                intervalRef.current = window.setInterval(analyzeFrame, 450);
                analyzeFrame();
            } catch {
                if (cancelled) return;

                stopScanner();
                setIsOpeningCamera(false);
                setIsVideoReady(false);
                setErrorMessage(
                    "Kamera konnte nicht geöffnet werden. Bitte Berechtigung prüfen oder Datei manuell hochladen.",
                );
                return;
            } finally {
                if (!cancelled) {
                    setIsOpeningCamera(false);
                }
            }
        }

        void startScanner();

        return () => {
            cancelled = true;
            stopScanner();
        };
    }, [analyzeFrame, open, resetScannerState, stopScanner]);

    async function handleScan() {
        const video = videoRef.current;
        const detectedPoints = detectedPointsRef.current;
        const cv = cvRef.current;
        const outputCanvas = outputCanvasRef.current;

        if (!video || !detectedPoints || !cv || !outputCanvas) return;

        setIsProcessingScan(true);
        setErrorMessage(null);

        const frameCanvas = document.createElement("canvas");
        frameCanvas.width = video.videoWidth;
        frameCanvas.height = video.videoHeight;

        const context = frameCanvas.getContext("2d", {
            willReadFrequently: true,
        });

        if (!context) {
            setIsProcessingScan(false);
            setErrorMessage("Scan konnte nicht verarbeitet werden.");
            return;
        }

        context.drawImage(video, 0, 0, frameCanvas.width, frameCanvas.height);

        const analysisCanvas = analysisCanvasRef.current;
        if (!analysisCanvas) {
            setIsProcessingScan(false);
            setErrorMessage("Scan konnte nicht verarbeitet werden.");
            return;
        }

        const scaleX = frameCanvas.width / analysisCanvas.width;
        const scaleY = frameCanvas.height / analysisCanvas.height;
        const points = detectedPoints.map((point) => ({
            x: point.x * scaleX,
            y: point.y * scaleY,
        }));

        const targetWidth = Math.max(
            distance(points[0], points[1]),
            distance(points[3], points[2]),
        );
        const targetHeight = Math.max(
            distance(points[0], points[3]),
            distance(points[1], points[2]),
        );
        const outputScale = Math.min(1, 1800 / Math.max(targetWidth, targetHeight));
        const outputWidth = Math.max(1, Math.round(targetWidth * outputScale));
        const outputHeight = Math.max(1, Math.round(targetHeight * outputScale));

        let source: CvMat | null = null;
        let sourcePoints: CvMat | null = null;
        let targetPoints: CvMat | null = null;
        let transform: CvMat | null = null;
        let output: CvMat | null = null;

        try {
            source = cv.imread(frameCanvas);
            sourcePoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
                points[0].x,
                points[0].y,
                points[1].x,
                points[1].y,
                points[2].x,
                points[2].y,
                points[3].x,
                points[3].y,
            ]);
            targetPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
                0,
                0,
                outputWidth - 1,
                0,
                outputWidth - 1,
                outputHeight - 1,
                0,
                outputHeight - 1,
            ]);
            transform = cv.getPerspectiveTransform(sourcePoints, targetPoints);
            output = new cv.Mat();

            cv.warpPerspective(
                source,
                output,
                transform,
                new cv.Size(outputWidth, outputHeight),
                cv.INTER_LINEAR,
                cv.BORDER_CONSTANT,
                new cv.Scalar(255, 255, 255, 255),
            );
            cv.imshow(outputCanvas, output);

            const file = await canvasToFile(outputCanvas);
            stopScanner();
            onScanComplete(file);
            onOpenChange(false);
        } catch {
            setErrorMessage(
                "Scan konnte nicht verarbeitet werden. Bitte Dokument erneut ausrichten oder Datei manuell hochladen.",
            );
        } finally {
            source?.delete();
            sourcePoints?.delete();
            targetPoints?.delete();
            transform?.delete();
            output?.delete();
            setIsProcessingScan(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
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
                        className="pointer-events-none absolute inset-0 size-full"
                    />

                    {isLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/85">
                            <div className="text-center">
                                <Loader2 className="mx-auto size-8 animate-spin text-cyan-400" />
                                {isLoadingOpenCv ? (
                                    <>
                                        <p className="mt-3 font-bold">Scanner wird geladen…</p>
                                        <p className="mt-1 text-sm text-slate-300">
                                            OpenCV wird vorbereitet…
                                        </p>
                                    </>
                                ) : null}
                                {isOpeningCamera ? (
                                    <>
                                        <p className="mt-3 font-bold">Kamera wird geöffnet…</p>
                                        <p className="mt-1 text-sm text-slate-300">
                                            Bitte Berechtigung prüfen.
                                        </p>
                                    </>
                                ) : null}
                                {!isLoadingOpenCv && !isOpeningCamera && !isVideoReady ? (
                                    <>
                                        <p className="mt-3 font-bold">Kamera wird vorbereitet…</p>
                                        <p className="mt-1 text-sm text-slate-300">
                                            Videovorschau wird gestartet.
                                        </p>
                                    </>
                                ) : null}
                            </div>
                        </div>
                    ) : null}

                    {errorMessage && !isLoading ? (
                        <div className="flex min-h-72 items-center justify-center p-6">
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

                <canvas ref={analysisCanvasRef} className="hidden" />
                <canvas ref={outputCanvasRef} className="hidden" />

                {isVideoReady && !errorMessage ? (
                    <div
                        className={
                            documentDetected
                                ? "rounded-2xl border border-emerald-700 bg-emerald-950/70 px-4 py-3 text-sm font-bold text-emerald-200"
                                : "rounded-2xl border border-amber-700 bg-amber-950/70 px-4 py-3 text-sm font-bold text-amber-200"
                        }
                    >
                        {documentDetected
                            ? "Dokument erkannt – Scan übernehmen"
                            : "Dokument vollständig ins Bild halten"}
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
                        disabled={!documentDetected || !isVideoReady || isProcessingScan}
                        className="h-11 bg-cyan-600 text-white hover:bg-cyan-500"
                        onClick={() => void handleScan()}
                    >
                        {isProcessingScan ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <Camera className="size-4" />
                        )}
                        {isProcessingScan
                            ? "Scan wird verarbeitet…"
                            : "Scan übernehmen"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
