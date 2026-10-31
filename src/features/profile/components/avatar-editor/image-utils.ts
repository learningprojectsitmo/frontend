import { drawCrop, type CropState, type ImageSize } from "./crop-math";

/** Итоговый размер: хватает и для 128 px в шапке на Retina, и для списков. */
export const AVATAR_OUTPUT_SIZE = 512;

/** Оригинал в мегабайтах не ограничиваем жёстко — только защищаем память браузера. */
export const MAX_SOURCE_BYTES = 15 * 1024 * 1024;

const UNSUPPORTED_TYPE_MESSAGE =
    "Не удалось открыть изображение. Поддерживаются JPEG, PNG, WebP и AVIF.";

export const isImageFile = (file: File): boolean => file.type.startsWith("image/");

export const validateSourceFile = (file: File): void => {
    if (!isImageFile(file)) {
        throw new Error("Выберите файл изображения");
    }
    if (file.size > MAX_SOURCE_BYTES) {
        throw new Error("Файл больше 15 МБ — выберите изображение поменьше");
    }
};

/**
 * Декодирует картинку с учётом EXIF-поворота.
 *
 * HEIC (частая причина «фото с iPhone не открывается») Chrome/Firefox не
 * декодируют — для пользователя это обычная ошибка «не удалось открыть».
 */
export const loadImageBitmap = async (file: File): Promise<ImageBitmap> => {
    validateSourceFile(file);
    try {
        return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
        throw new Error(UNSUPPORTED_TYPE_MESSAGE);
    }
};

/**
 * Рендерит квадрат 512×512. Круглую маску не «запекаем»: храним квадрат,
 * чтобы аватар можно было показывать и кругом, и скруглённым квадратом.
 */
export const renderAvatarBlob = async (bitmap: ImageBitmap, state: CropState): Promise<Blob> => {
    const canvas = document.createElement("canvas");
    canvas.width = AVATAR_OUTPUT_SIZE;
    canvas.height = AVATAR_OUTPUT_SIZE;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
        throw new Error("Браузер не поддерживает canvas — попробуйте другой браузер");
    }

    const image: CanvasImageSource & ImageSize = bitmap;
    drawCrop(ctx, image, state, AVATAR_OUTPUT_SIZE);

    return await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error("Не удалось подготовить изображение"));
                }
            },
            "image/webp",
            0.9,
        );
    });
};
