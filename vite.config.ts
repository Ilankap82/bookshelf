import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // When deploying to GitHub Pages at https://username.github.io/bookshelf/
  // set base to '/bookshelf/' — change this to match your repo name
  base: '/bookshelf/',
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
