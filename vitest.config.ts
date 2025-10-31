import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    reporters: ["verbose"],
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    globals: true,
    css: true,
  },
});
