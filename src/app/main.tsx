<<<<<<< HEAD
import { StrictMode, createContext, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./index.css";
import App from "./App.tsx";
import Store from "../store/store.ts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

interface State {
    store: Store;
=======
import { StrictMode, createContext } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router';
import './index.css'
import App from './App.tsx'
import Store from '../store/store.ts';

interface State {
  store: Store,
>>>>>>> f4f2c8820cab31cbbf6f704f7e3cf3519b1e31eb
}

const store = new Store();

export const Context = createContext<State>({
<<<<<<< HEAD
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
=======
  store,
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Context.Provider value = {{
        store
      }}>
        <App />
      </Context.Provider>
    </BrowserRouter>
  </StrictMode>,
)
>>>>>>> f4f2c8820cab31cbbf6f704f7e3cf3519b1e31eb
