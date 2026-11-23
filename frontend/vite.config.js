import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Site React de página única (SPA): index.html -> src/main.jsx -> rotas em src/rotas.jsx.
// base: pasta onde o site fica na hospedagem ("/" na raiz do domínio, "/loja/" numa subpasta).
export default defineConfig({
  plugins: [react()],
  base: "/",
  server: { port: 5173 },
  preview: { port: 4173 }
});
