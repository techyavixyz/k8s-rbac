import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Load env vars for the current mode
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    server: {
      port: 3000,
      host: true,
      allowedHosts: env.VITE_ALLOWED_HOST
        ? [env.VITE_ALLOWED_HOST]
        : [],
      proxy: {
        "/api": {
          target: env.VITE_API_PROXY_TARGET,
          changeOrigin: true
        }
      }
    }
  };
});
