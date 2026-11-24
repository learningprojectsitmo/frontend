// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes, useSearchParams } from "react-router";
import { expect, it, vi } from "vitest";

import { api } from "./api-client";
import { ProtectedRoute } from "./auth";

function LoginDestination() {
    const [params] = useSearchParams();
    return <output>{params.get("redirectTo")}</output>;
}

it("retains the exam editor workspace when redirecting to login", async () => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    const request = vi.spyOn(api, "get").mockRejectedValue(new Error("Unauthenticated"));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const container = document.body.appendChild(document.createElement("div"));
    const root = createRoot(container);
    try {
        await act(async () => {
            root.render(
                <QueryClientProvider client={client}>
                    <MemoryRouter
                        initialEntries={[
                            "/app/exams/123/edit?workspaceId=42&section=queue#history",
                        ]}
                    >
                        <Routes>
                            <Route
                                path="/app/exams/:examId/edit"
                                element={<ProtectedRoute>Экзамен</ProtectedRoute>}
                            />
                            <Route path="/auth/login" element={<LoginDestination />} />
                        </Routes>
                    </MemoryRouter>
                </QueryClientProvider>,
            );
        });
        await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
        expect(container.querySelector("output")?.textContent).toBe(
            "/app/exams/123/edit?workspaceId=42&section=queue#history",
        );
    } finally {
        act(() => root.unmount());
        client.clear();
        container.remove();
        request.mockRestore();
    }
});
