import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative base so the built site works from any static path (exhibition machine, file share, GitHub Pages).
export default defineConfig({
  base: "./",
  plugins: [react()],
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
