import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,         // exposes network URL (0.0.0.0)
    port: 4173,         // fixed port for Google OAuth redirect
    strictPort: true,   // don’t auto-increment
    open: true          // auto-open browser on start
  }
});
