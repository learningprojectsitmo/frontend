import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Регрессия: `/responses` вместо `/responses/` давало 307, а браузер при
 * следовании за редиректом отбрасывал `Authorization` — и страница откликов
 * получала 401 вместо данных. Отладка стоила вылазки в логи бэкенда, потому
 * что клиентский код выглядит совершенно корректно.
 *
 * Тест ловит такую ошибку по всему фронтенду: если кто-то напишет вызов
 * collection-эндпоинта без завершающего слеша, падать будет здесь, а не
 * в браузере.
 */

/**
 * Пути, объявленные на бэкенде как `@router.<method>("/")`.
 * Источник: `backend/src/api/v1/endpoints/*.py` (префикс роутера + "/").
 * При добавлении нового такого эндпоинта список нужно пополнить.
 */
const COLLECTION_ROUTES = [
    "/ideas",
    "/profile",
    "/project-types",
    "/projects",
    "/responses",
    "/resumes",
    "/roles",
    "/search",
    "/users",
    "/workspaces",
];

const SRC_DIR = join(process.cwd(), "src");

const collectSourceFiles = (dir: string): string[] =>
    readdirSync(dir).flatMap((entry) => {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) return collectSourceFiles(full);
        return /\.tsx?$/.test(entry) && !entry.endsWith(".test.ts") ? [full] : [];
    });

// `api.get("/responses")` и `api.get<T>("/responses")` — оба варианта.
const API_CALL = /api\.(?:get|post|put|patch|delete)(?:<[^>]*>)?\(\s*[`"]([^`"]*)[`"]/g;

describe("вызовы API: завершающий слеш у collection-эндпоинтов", () => {
    it("не содержит запросов без слеша — они уходят в 307 и теряют Authorization", () => {
        const offenders: string[] = [];

        for (const file of collectSourceFiles(SRC_DIR)) {
            readFileSync(file, "utf8")
                .split("\n")
                .forEach((line, index) => {
                    for (const match of line.matchAll(API_CALL)) {
                        const url = match[1];
                        // Шаблонные строки и query-параметры не разбираем:
                        // у них путь собирается в рантайме.
                        if (url.includes("${") || url.includes("?")) continue;
                        if (!COLLECTION_ROUTES.includes(url)) continue;
                        offenders.push(
                            `${file.slice(SRC_DIR.length + 1)}:${index + 1} → api.*("${url}")`,
                        );
                    }
                });
        }

        expect(offenders).toEqual([]);
    });
});
