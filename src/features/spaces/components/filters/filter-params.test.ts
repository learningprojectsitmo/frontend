import { describe, expect, it } from "vitest";

import { selectedValuesToParam } from "@/features/spaces/components/filters/filter-params";

const options = [{ value: "1" }, { value: "2" }, { value: "3" }];

describe("selectedValuesToParam", () => {
    it("возвращает undefined, если ничего не выбрано", () => {
        // given
        // when
        const result = selectedValuesToParam([], options);
        // then
        expect(result).toBeUndefined();
    });

    it("возвращает выбранные значения, если выбрана часть", () => {
        // given
        // when
        const result = selectedValuesToParam(["1", "3"], options);
        // then
        expect(result).toEqual(["1", "3"]);
    });

    it("возвращает одно значение обычным массивом", () => {
        // given
        // when
        const result = selectedValuesToParam(["2"], options);
        // then
        expect(result).toEqual(["2"]);
    });

    it("возвращает undefined, если выбраны все варианты", () => {
        // given
        // when
        const result = selectedValuesToParam(["1", "2", "3"], options);
        // then
        // полный IN исключил бы участников без проектов/тегов — это не «без фильтра»
        expect(result).toBeUndefined();
    });

    it("не считает выбор полным, пока опции не загрузились", () => {
        // given: сервер ещё не вернул опции, а у пользователя стоят галки с прошлой сессии
        // when
        const result = selectedValuesToParam(["1", "2"], []);
        // then
        // фильтр остаётся включённым, чтобы не потерять намерение пользователя
        expect(result).toEqual(["1", "2"]);
    });

    it("работает с тегами как с обычными строками", () => {
        // given
        const tagOptions = [{ value: "python" }, { value: "ai" }];
        // when
        const partial = selectedValuesToParam(["python"], tagOptions);
        const all = selectedValuesToParam(["python", "ai"], tagOptions);
        // then
        expect(partial).toEqual(["python"]);
        expect(all).toBeUndefined();
    });
});
