import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,                     // allow external access
    allowedHosts: [
      "rbac-k8s.pve.mogiio.com"     // allow your domain explicitly
    ],
    proxy: {
      "/api": {
        target: "http://kube-api-backend:3001",
        changeOrigin: true
      }
    }
  }
});
