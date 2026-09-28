import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "~app": path.resolve("src/app"),
      "~entities": path.resolve("src/entities"),
      "~features": path.resolve("src/features"),
      "~pages": path.resolve("src/pages"),
      "~shared": path.resolve("src/shared"),
      "~widgets": path.resolve("src/widgets"),
    },
  },
});
