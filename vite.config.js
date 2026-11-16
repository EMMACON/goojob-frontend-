import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { renderHome } from "./scripts/markup.mjs";

function shellPlugin() {
  return {
    name: "goojob-shell",
    transformIndexHtml(html) {
      if (!html.includes("<!--ROOT-->")) return html;
      return html.replace("<!--ROOT-->", renderHome({ jobs: [] }));
    },
  };
}

export default defineConfig({
  plugins: [react(), shellPlugin()],
  server: {
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
