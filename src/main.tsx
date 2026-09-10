import * as React from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import "@/components/block-editor/style.css";
import { App } from "./app";
import { setupSentry } from "./lib/sentry";
// import { enableMocking } from './testing/mocks';

setupSentry();

const root = document.getElementById("root");
if (!root) throw new Error("No root element found");

// enableMocking().then(() => {
createRoot(root).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);
// });
