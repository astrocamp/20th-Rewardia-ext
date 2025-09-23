import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup/popup.html"),
        content: resolve(__dirname, "src/content_scripts/content_script.js"),
        iframe: resolve(__dirname, "src/content_scripts/iframe_handler.js"),
        "content_script.css": resolve(
          __dirname,
          "src/content_scripts/content_script.css"
        ),
        background: resolve(__dirname, "src/background/background.js"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === "popup" ? "popup.js" : "[name].js";
        },
        chunkFileNames: "[name].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.includes("popup.html")) {
            return "popup.html";
          }
          if (assetInfo.name && assetInfo.name.includes(".css")) {
            return "[name].[ext]";
          }
          return "[name].[ext]";
        },
      },
    },
    outDir: "dist",
    emptyOutDir: false,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  publicDir: "public",
});
