import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { SupabaseProvider } from "./supabase/useSupabase";
import { Analytics } from "@vercel/analytics/react";
import { enabled } from "./utils/FeatureGate";
import { initPostHog } from "./analytics/posthog";
import "./index.css";
import "./sw-register"; // SW only registers if VITE_ENABLE_SW === "true"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SupabaseProvider>
      <App />
      {enabled("VITE_ENABLE_ANALYTICS") && <Analytics />}
    </SupabaseProvider>
  </React.StrictMode>
);

// Init PostHog (env-gated)
if (enabled("VITE_ENABLE_ANALYTICS")) {
  initPostHog();
}
