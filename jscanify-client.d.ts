declare module "jscanify/client" {
    type JscanifyOptions = {
        color?: string;
        thickness?: number;
    };

    export default class Jscanify {
        findPaperContour(image: unknown): unknown | null;

        highlightPaper(
            image: HTMLCanvasElement,
            options?: JscanifyOptions,
        ): HTMLCanvasElement;

        extractPaper(
            image: HTMLCanvasElement,
            resultWidth: number,
            resultHeight: number,
            cornerPoints?: unknown,
        ): HTMLCanvasElement | null;

        getCornerPoints(contour: unknown): {
            topLeftCorner?: { x: number; y: number };
            topRightCorner?: { x: number; y: number };
            bottomLeftCorner?: { x: number; y: number };
            bottomRightCorner?: { x: number; y: number };
        };
    }
}
