import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  base: "/",
  define: {
    global: "globalThis",
  },
  optimizeDeps: {
    include: ["amazon-cognito-identity-js"],
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      "/multiangle-api": {
        target: "http://localhost:7861",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/multiangle-api/, "/api"),
      },
    },
  },
  build: {
    outDir: "docs",
  },
});
