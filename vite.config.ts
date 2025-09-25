import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [react()],
  build: {
    minify: false,
    // Disable inline source maps in production to keep asset sizes small
    sourcemap: false,
    rollupOptions: {
      output: {
        sourcemapExcludeSources: false, // Include original source in source maps if sourcemaps are enabled
        // Split large vendor bundles for better caching
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("@aptos-labs")) return "vendor-aptos";
            if (id.includes("react")) return "vendor-react";
            if (id.includes("@radix-ui")) return "vendor-radix";
            return "vendor";
          }
        },
      },
    },
  },
  // Enable source maps in development too
  css: {
    devSourcemap: true,
  },
  server: {
    allowedHosts: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  optimizeDeps: {
    // This is still crucial for reducing the time from when `bun run dev`
    // is executed to when the server is actually ready.
    include: ["react", "react-dom", "react-router-dom"],
    exclude: ["agents"], // Exclude agents package from pre-bundling due to Node.js dependencies
    force: true,
  },
  define: {
    // Define Node.js globals for the agents package
    global: "globalThis",
  },
  // Clear cache more aggressively
  cacheDir: "node_modules/.vite",
}));
