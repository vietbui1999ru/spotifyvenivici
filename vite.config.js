import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { spotifyOAuthPlugin } from "./vite-plugin-spotify.js";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), spotifyOAuthPlugin()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
});
