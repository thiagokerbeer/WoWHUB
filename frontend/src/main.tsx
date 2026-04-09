import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./components/ui/ui.css";
import { warnIfApiUrlMissing } from "./lib/env";
import { createAppQueryClient } from "./query/queryClient";
import "./styles.css";

warnIfApiUrlMissing();

const queryClient = createAppQueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
