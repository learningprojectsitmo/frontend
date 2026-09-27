/**
 * Собирает значение мультивыборного фильтра для запроса.
 *
 * Пустой выбор — фильтр выключен (`undefined`), чтобы параметр не уезжал в
 * запрос вовсе. Выбор всех доступных значений тоже считаем выключенным: такой
 * `IN` со всеми id не меняет результат по наличию, но исключает записи, у которых
 * значения нет вовсе (участник без проектов, без тегов) — то есть «выбрать все»
 * молча спрятал бы их. Это не то, что ожидаешь от такого клика.
 */
export function selectedValuesToParam(
    selected: string[],
    options: { value: string }[],
): string[] | undefined {
    if (selected.length === 0) return undefined;
    if (options.length > 0 && selected.length === options.length) return undefined;
    return selected;
}
