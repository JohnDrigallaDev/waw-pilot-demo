declare module "jscanify/client" {
    type JscanifyOptions = {
        color?: string;
        thickness?: number;
    };

    export default class Jscanify {
        highlightPaper(
            image: HTMLCanvasElement,
            options?: JscanifyOptions,
        ): HTMLCanvasElement;

        extractPaper(
            image: HTMLCanvasElement,
            resultWidth: number,
            resultHeight: number,
        ): HTMLCanvasElement | null;
    }
}
