import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split vendor libraries into separate cached chunks.
        // App code changes frequently; vendor code rarely does.
        // Browsers can cache vendor chunks across deploys.
        manualChunks: {
          "vendor-react":   ["react", "react-dom", "react-router-dom"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-ui":      [
            "@radix-ui/react-dialog",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-avatar",
            "@radix-ui/react-popover",
            "@radix-ui/react-toast",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-label",
            "@radix-ui/react-scroll-area",
            "@radix-ui/react-separator",
            "@radix-ui/react-slot",
            "@radix-ui/react-switch",
          ],
          "vendor-charts":  ["recharts"],
        },
      },
    },
  },
});
