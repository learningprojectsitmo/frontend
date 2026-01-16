import { StrictMode, createContext } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./index.css";
import App from "./App.tsx";
import Store from "../store/store.ts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

interface State {
    store: Store;
}

const store = new Store();

export const Context = createContext<State>({
    store,
});

const client = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
        },
    },
});

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <BrowserRouter>
            <QueryClientProvider client={client}>
                <Context.Provider
                    value={{
                        store,
                    }}
                >
                    <App />
                </Context.Provider>
            </QueryClientProvider>
        </BrowserRouter>
    </StrictMode>,
);
