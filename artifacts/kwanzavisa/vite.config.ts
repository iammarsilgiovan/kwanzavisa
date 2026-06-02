import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const devPlugins =
  process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined
    ? await Promise.all([
        import("@replit/vite-plugin-cartographer").then((m) =>
          m.cartographer({ root: path.resolve(import.meta.dirname, "..") }),
        ),
        import("@replit/vite-plugin-dev-banner").then((m) => m.devBanner()),
      ])
    : [];

export default defineConfig(({ command }) => {
  const isBuild = command === "build";

  const rawPort = process.env.PORT;
  if (!isBuild && (!rawPort || Number.isNaN(Number(rawPort)) || Number(rawPort) <= 0)) {
    throw new Error(
      `PORT environment variable is required but was not provided or invalid: "${rawPort}"`,
    );
  }
  const port = Number(rawPort ?? "3000");

  const basePath = process.env.BASE_PATH;
  if (!isBuild && !basePath) {
    throw new Error("BASE_PATH environment variable is required but was not provided.");
  }

  return {
    base: basePath ?? "/",
    plugins: [
      react(),
      tailwindcss(),
      runtimeErrorOverlay(),
      ...devPlugins,
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
        "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
      },
      dedupe: ["react", "react-dom"],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      port,
      host: "0.0.0.0",
      allowedHosts: true,
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
    preview: {
      port,
      host: "0.0.0.0",
      allowedHosts: true,
    },
  };
});
