/**
 * Математика кадрирования аватара (как в Telegram).
 *
 * Картинка всегда покрывает квадратный вьюпорт: `center` — точка изображения
 * (в долях 0..1), которая находится в центре вьюпорта, `zoom` — множитель
 * к минимальному масштабу покрытия. Всё считается в пикселях вьюпорта, поэтому
 * одинаково работает и для превью, и для canvas 512×512 при сохранении.
 */

export type CropCenter = { x: number; y: number };

export type CropState = {
    zoom: number;
    center: CropCenter;
};

export type ImageSize = { width: number; height: number };

export type CropLayout = { dx: number; dy: number; dw: number; dh: number };

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 3;

export const clamp = (value: number, min: number, max: number): number =>
    Math.min(Math.max(value, min), max);

/** Минимальный масштаб, при котором изображение полностью покрывает вьюпорт. */
export const coverScale = (image: ImageSize, viewport: number, zoom: number): number =>
    Math.max(viewport / image.width, viewport / image.height) * zoom;

/** Положение и размер изображения внутри вьюпорта. */
export const imageLayout = (image: ImageSize, viewport: number, state: CropState): CropLayout => {
    const scale = coverScale(image, viewport, state.zoom);
    const dw = image.width * scale;
    const dh = image.height * scale;
    return {
        dx: viewport / 2 - state.center.x * dw,
        dy: viewport / 2 - state.center.y * dh,
        dw,
        dh,
    };
};

/**
 * Не даёт краям изображения попасть внутрь вьюпорта.
 *
 * Если по оси изображение ровно покрывает вьюпорт, диапазон схлопывается
 * в 0.5 — сдвигать нечего.
 */
export const clampCenter = (
    center: CropCenter,
    image: ImageSize,
    viewport: number,
    zoom: number,
): CropCenter => {
    const { dw, dh } = imageLayout(image, viewport, { zoom, center: { x: 0.5, y: 0.5 } });
    const halfX = Math.min(0.5, viewport / (2 * dw));
    const halfY = Math.min(0.5, viewport / (2 * dh));
    return {
        x: clamp(center.x, halfX, 1 - halfX),
        y: clamp(center.y, halfY, 1 - halfY),
    };
};

/** Сдвиг изображения пальцем/мышью на `dxPixels`/`dyPixels` (в пикселях вьюпорта). */
export const panBy = (
    state: CropState,
    dxPixels: number,
    dyPixels: number,
    image: ImageSize,
    viewport: number,
): CropState => {
    const { dw, dh } = imageLayout(image, viewport, state);
    return {
        zoom: state.zoom,
        center: clampCenter(
            { x: state.center.x - dxPixels / dw, y: state.center.y - dyPixels / dh },
            image,
            viewport,
            state.zoom,
        ),
    };
};

/** Зум относительно центра вьюпорта (как слайдер в Telegram). */
export const withZoom = (
    state: CropState,
    zoom: number,
    image: ImageSize,
    viewport: number,
): CropState => {
    const nextZoom = clamp(zoom, MIN_ZOOM, MAX_ZOOM);
    return {
        zoom: nextZoom,
        center: clampCenter(state.center, image, viewport, nextZoom),
    };
};

/** Нарисовать итоговый квадрат в canvas. Круглую маску делает CSS превью. */
export const drawCrop = (
    ctx: CanvasRenderingContext2D,
    image: CanvasImageSource & ImageSize,
    state: CropState,
    outputSize: number,
): void => {
    const { dx, dy, dw, dh } = imageLayout(image, outputSize, state);
    ctx.clearRect(0, 0, outputSize, outputSize);
    ctx.drawImage(image, dx, dy, dw, dh);
};
