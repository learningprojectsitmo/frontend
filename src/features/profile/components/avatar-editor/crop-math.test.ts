import { describe, expect, it, vi } from "vitest";

import {
    clamp,
    clampCenter,
    coverScale,
    drawCrop,
    imageLayout,
    MAX_ZOOM,
    MIN_ZOOM,
    panBy,
    withZoom,
} from "./crop-math";

const SQUARE = { width: 400, height: 300 };
const VIEWPORT = 200;

describe("coverScale", () => {
    it("scales so the image fully covers the viewport", () => {
        const scale = coverScale(SQUARE, VIEWPORT, 1);
        const dw = SQUARE.width * scale;
        const dh = SQUARE.height * scale;
        expect(dw).toBeGreaterThanOrEqual(VIEWPORT);
        expect(dh).toBeGreaterThanOrEqual(VIEWPORT);
        // Минимальный масштаб: одна из сторон ровно равна вьюпорту.
        expect(Math.min(dw, dh)).toBeCloseTo(VIEWPORT, 6);
    });

    it("multiplies by zoom", () => {
        expect(coverScale(SQUARE, VIEWPORT, 2)).toBeCloseTo(coverScale(SQUARE, VIEWPORT, 1) * 2);
    });
});

describe("imageLayout", () => {
    it("places the center point in the middle of the viewport", () => {
        const state = { zoom: 1, center: { x: 0.5, y: 0.5 } };
        const layout = imageLayout(SQUARE, VIEWPORT, state);
        const cx = layout.dx + layout.dw * 0.5;
        const cy = layout.dy + layout.dh * 0.5;
        expect(cx).toBeCloseTo(VIEWPORT / 2);
        expect(cy).toBeCloseTo(VIEWPORT / 2);
    });
});

describe("clampCenter", () => {
    it("keeps the image edges inside the viewport", () => {
        const extreme = clampCenter({ x: 0, y: 0 }, SQUARE, VIEWPORT, 1);
        // Центр не может уйти дальше, чем половина изображения во вьюпорте.
        const layout = imageLayout(SQUARE, VIEWPORT, { zoom: 1, center: extreme });
        expect(layout.dx).toBeLessThanOrEqual(0);
        expect(layout.dy).toBeLessThanOrEqual(0);
        expect(layout.dx + layout.dw).toBeGreaterThanOrEqual(VIEWPORT);
        expect(layout.dy + layout.dh).toBeGreaterThanOrEqual(VIEWPORT);
    });

    it("collapses to the centre when the image exactly covers the viewport", () => {
        const image = { width: 200, height: 200 };
        const center = clampCenter({ x: 0.2, y: 0.8 }, image, VIEWPORT, 1);
        expect(center.x).toBe(0.5);
        expect(center.y).toBe(0.5);
    });
});

describe("panBy", () => {
    it("moves the centre opposite to the drag direction", () => {
        const state = { zoom: 1, center: { x: 0.5, y: 0.5 } };
        const next = panBy(state, 10, 0, SQUARE, VIEWPORT);
        expect(next.center.x).toBeLessThan(0.5);
        expect(next.center.y).toBe(0.5);
    });

    it("does not let the image leave the viewport", () => {
        const state = { zoom: 1, center: { x: 0.5, y: 0.5 } };
        const next = panBy(state, 10_000, 0, SQUARE, VIEWPORT);
        const layout = imageLayout(SQUARE, VIEWPORT, next);
        expect(layout.dx + layout.dw).toBeGreaterThanOrEqual(VIEWPORT);
    });
});

describe("withZoom", () => {
    it("clamps zoom to the allowed range", () => {
        const state = { zoom: 1, center: { x: 0.5, y: 0.5 } };
        expect(withZoom(state, 0.1, SQUARE, VIEWPORT).zoom).toBe(MIN_ZOOM);
        expect(withZoom(state, 99, SQUARE, VIEWPORT).zoom).toBe(MAX_ZOOM);
    });

    it("keeps the centre valid after zooming in", () => {
        const state = { zoom: 1, center: { x: 0.5, y: 0.5 } };
        const next = withZoom(state, 2, SQUARE, VIEWPORT);
        expect(next.zoom).toBe(2);
        const layout = imageLayout(SQUARE, VIEWPORT, next);
        expect(layout.dx + layout.dw).toBeGreaterThanOrEqual(VIEWPORT);
    });
});

describe("clamp", () => {
    it("clamps values", () => {
        expect(clamp(5, 0, 10)).toBe(5);
        expect(clamp(-1, 0, 10)).toBe(0);
        expect(clamp(11, 0, 10)).toBe(10);
    });
});

describe("drawCrop", () => {
    it("draws the image with the computed layout", () => {
        const drawImage = vi.fn();
        const ctx = {
            clearRect: vi.fn(),
            drawImage,
        } as unknown as CanvasRenderingContext2D;
        const image = { width: 400, height: 300 } as CanvasImageSource & {
            width: number;
            height: number;
        };
        const state = { zoom: 1, center: { x: 0.5, y: 0.5 } };
        drawCrop(ctx, image, state, VIEWPORT);
        const layout = imageLayout(image, VIEWPORT, state);
        expect(drawImage).toHaveBeenCalledWith(image, layout.dx, layout.dy, layout.dw, layout.dh);
    });
});
