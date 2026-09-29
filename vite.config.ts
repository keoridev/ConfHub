import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Получаем абсолютный путь к директории текущего файла (vite.config.ts)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "~app": path.resolve(__dirname, "src/app"),
      "~entities": path.resolve(__dirname, "src/entities"),
      "~features": path.resolve(__dirname, "src/features"),
      "~pages": path.resolve(__dirname, "src/pages"),
      "~shared": path.resolve(__dirname, "src/shared"),
      "~widgets": path.resolve(__dirname, "src/widgets"),
    },
  },
});