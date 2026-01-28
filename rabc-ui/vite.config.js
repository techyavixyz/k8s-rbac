import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    allowedHosts: ["rbac-k8s.pve.mogio.com", "localhost", "127.0.0.1"]
  }
});